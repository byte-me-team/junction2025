import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  callFeatherlessEventSuggestions,
  NormalizedPreferences,
  EventSuggestions,
} from "@/lib/featherless";

const MATCH_TARGET = Math.max(
  1,
  Number(process.env.MATCHED_SUGGESTION_TARGET ?? "10")
);
const MODEL_BATCH_SIZE = Math.max(
  1,
  Number(process.env.MATCHED_SUGGESTION_MODEL_BATCH ?? "10")
);
const EVENT_POOL_LIMIT = Math.max(
  MATCH_TARGET,
  Number(process.env.MATCHED_SUGGESTION_EVENT_LIMIT ?? "200")
);

const suggestionJobs = new Map<string, Promise<void>>();
const suggestionRefreshTimestamps = new Map<string, number>();

type Recommendation = EventSuggestions["recommendations"][number];

type MatchedSuggestionWithEvent = Prisma.MatchedSuggestionGetPayload<{
  include: { event: true };
}>;

export type MatchedSuggestionView = {
  id: string;
  reason: string;
  confidence: number;
  createdAt: string;
  eventId: string;
  event: {
    id: string;
    title: string;
    summary: string | null;
    startTime: string;
    endTime: string | null;
    location: string | null;
    price: string | null;
    sourceUrl: string | null;
  };
};

export function getSuggestionTarget() {
  return MATCH_TARGET;
}

export function getSuggestionJobStatus(userId: string): "idle" | "running" {
  return suggestionJobs.has(userId) ? "running" : "idle";
}

export function getSuggestionRefreshTimestamp(userId: string) {
  return suggestionRefreshTimestamps.get(userId) ?? null;
}

export async function ensureSuggestionMinimum(userId: string) {
  const count = await prisma.matchedSuggestion.count({ where: { userId } });
  const missing = Math.max(0, MATCH_TARGET - count);

  if (missing === 0) {
    return {
      missing,
      jobStarted: false,
    };
  }

  const jobStarted = queueSuggestionJob(userId);

  return {
    missing,
    jobStarted,
  };
}

export async function listMatchedSuggestions(
  userId: string,
  limit = MATCH_TARGET
): Promise<MatchedSuggestionView[]> {
  const rows = await prisma.matchedSuggestion.findMany({
    where: { userId },
    include: { event: true },
    orderBy: [
      { confidence: "desc" },
      { updatedAt: "desc" },
    ],
    take: limit,
  });

  return rows
    .map((row: MatchedSuggestionWithEvent | null) => {
      if (!row?.event) return null;
      return {
        id: row.id,
        reason: row.reason,
        confidence: clampConfidence(row.confidence),
        createdAt: row.updatedAt.toISOString(),
        eventId: row.eventId,
        event: {
          id: row.event.id,
          title: row.event.title,
          summary: row.event.summary ?? null,
          startTime: row.event.startTime.toISOString(),
          endTime: row.event.endTime ? row.event.endTime.toISOString() : null,
          location:
            row.event.locationName ??
            row.event.locationAddress ??
            row.event.city ??
            null,
          price: row.event.price ?? null,
          sourceUrl: row.event.sourceUrl ?? null,
        },
      } satisfies MatchedSuggestionView;
    })
    .filter((item): item is MatchedSuggestionView => Boolean(item));
}

function queueSuggestionJob(userId: string) {
  if (suggestionJobs.has(userId)) {
    return false;
  }

  const job = generateSuggestions(userId)
    .catch((error) => {
      console.error(
        `[MatchedSuggestions][user=${userId}] background generation failed`,
        error
      );
    })
    .finally(() => {
      suggestionJobs.delete(userId);
    });

  suggestionJobs.set(userId, job);
  return true;
}

async function generateSuggestions(userId: string) {
  const prefsRecord = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefsRecord) {
    console.warn(
      `[MatchedSuggestions][user=${userId}] cannot generate suggestions without preferences`
    );
    return;
  }

  const preferences = prefsRecord.normalizedJson as NormalizedPreferences;
  const existing = await prisma.matchedSuggestion.findMany({
    where: { userId },
    select: { eventId: true },
  });
  const existingIds = new Set(existing.map((row) => row.eventId));
  const missing = Math.max(0, MATCH_TARGET - existing.length);

  if (missing === 0) {
    return;
  }

  const now = new Date();
  const candidates = await prisma.event.findMany({
    where: {
      startTime: { gte: now },
    },
    orderBy: { startTime: "asc" },
    take: EVENT_POOL_LIMIT,
  });

  if (!candidates.length) {
    console.warn(
      `[MatchedSuggestions][user=${userId}] no candidate Espoo events in the catalog`
    );
    return;
  }

  const available = candidates.filter((event) => !existingIds.has(event.id));

  if (!available.length) {
    console.warn(
      `[MatchedSuggestions][user=${userId}] all candidates already matched, skipping`
    );
    return;
  }

  const candidateById = new Map(candidates.map((evt) => [evt.id, evt]));
  let inserted = 0;

  for (
    let offset = 0;
    offset < available.length && inserted < missing;
    offset += MODEL_BATCH_SIZE
  ) {
    const batch = available.slice(offset, offset + MODEL_BATCH_SIZE);
    if (!batch.length) break;

    const recommendations = await buildRecommendations(
      userId,
      preferences,
      batch
    );

    for (const rec of recommendations) {
      if (inserted >= missing) break;
      const event = candidateById.get(rec.event_id);
      if (!event || existingIds.has(event.id)) continue;

      const created = await createSuggestionRecord(
        userId,
        event.id,
        rec.reason,
        rec.confidence,
        {
          title: rec.title,
        }
      );

      if (created) {
        existingIds.add(event.id);
        inserted += 1;
      }
    }
  }

  if (inserted > 0) {
    suggestionRefreshTimestamps.set(userId, Date.now());
  }
}

async function buildRecommendations(
  userId: string,
  preferences: NormalizedPreferences,
  events: Array<{
    id: string;
    title: string;
    summary: string | null;
    description: string | null;
    startTime: Date;
    endTime: Date | null;
    locationName: string | null;
    locationAddress: string | null;
    city: string | null;
    price: string | null;
    tags: string[];
    sourceUrl: string | null;
  }>
): Promise<Recommendation[]> {
  try {
    const eventPayload = events.map((event) => ({
      id: event.id,
      title: event.title,
      summary: event.summary ?? event.description ?? null,
      description: event.description ?? undefined,
      start_time: event.startTime.toISOString(),
      end_time: event.endTime ? event.endTime.toISOString() : undefined,
      location:
        event.locationName ?? event.locationAddress ?? event.city ?? undefined,
      price: event.price ?? undefined,
      tags: event.tags,
      source_url: event.sourceUrl ?? undefined,
    }));

    const response = await callFeatherlessEventSuggestions(
      preferences,
      eventPayload
    );

    return [...response.recommendations].sort(
      (a, b) => b.confidence - a.confidence
    );
  } catch (error) {
    console.error(
      `[MatchedSuggestions][user=${userId}] Featherless recommendation failed`,
      error
    );
    return [];
  }
}

async function createSuggestionRecord(
  userId: string,
  eventId: string,
  reason: string,
  rawConfidence: number,
  metadata: Prisma.InputJsonValue
) {
  try {
    await prisma.matchedSuggestion.create({
      data: {
        userId,
        eventId,
        reason,
        confidence: clampConfidence(rawConfidence),
        metadata,
      },
    });
    return true;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return false;
    }
    throw error;
  }
}

function clampConfidence(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}
