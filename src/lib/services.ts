import { prisma } from "@/lib/prisma";
import {
  callFeatherlessNormalize,
  callFeatherlessJointActivities,
  callFeatherlessEventSuggestions,
  JointActivities,
  NormalizedPreferences,
  EventSuggestions,
} from "@/lib/featherless";
import { spawn } from "child_process";
import { join } from "path";

export async function saveUserPreferences(
  userId: string,
  rawText: string
) {
  const normalized: NormalizedPreferences =
    await callFeatherlessNormalize(rawText);

  return prisma.userPreferences.upsert({
    where: { userId },
    create: {
      userId,
      rawText,
      normalizedJson: normalized,
    },
    update: {
      rawText,
      normalizedJson: normalized,
    },
  });
}

export async function createMatch(user1Id: string, user2Id: string) {
  if (user1Id === user2Id) {
    throw new Error("Cannot match a user with themselves");
  }

  const [p1, p2] = await Promise.all([
    prisma.userPreferences.findUnique({ where: { userId: user1Id } }),
    prisma.userPreferences.findUnique({ where: { userId: user2Id } }),
  ]);

  if (!p1 || !p2) {
    throw new Error("Both users must have preferences saved first");
  }

  const prefs1 = p1.normalizedJson as NormalizedPreferences;
  const prefs2 = p2.normalizedJson as NormalizedPreferences;

  const suggestions: JointActivities =
    await callFeatherlessJointActivities(prefs1, prefs2);

  return prisma.match.create({
    data: {
      user1Id,
      user2Id,
      user1Preferences: prefs1,
      user2Preferences: prefs2,
      suggestionsJson: suggestions,
    },
  });
}

const EVENT_SUGGESTION_WINDOW_DAYS = Number(
  process.env.ESPOO_EVENTS_WINDOW_DAYS ?? "10"
);
const EVENT_SUGGESTION_LIMIT = Number(
  process.env.ESPOO_EVENTS_LIMIT ?? "25"
);
const EVENT_SUGGESTION_MODEL_LIMIT = Number(
  process.env.ESPOO_EVENTS_MODEL_LIMIT ?? "25"
);
const EVENT_SUGGESTION_CACHE_TTL_MS =
  Number(process.env.ESPOO_SUGGESTION_CACHE_TTL_HOURS ?? "24") *
  60 *
  60 *
  1000;

const TSX_BINARY = join(
  process.cwd(),
  "node_modules",
  ".bin",
  process.platform === "win32" ? "tsx.cmd" : "tsx"
);

let backgroundIngestPromise: Promise<void> | null = null;

function runEspooIngestor(logPrefix: string): Promise<void> {
  if (!backgroundIngestPromise) {
    console.info(`${logPrefix} Starting fallback Espoo ingestion via ${TSX_BINARY}`);
    backgroundIngestPromise = new Promise((resolve, reject) => {
      const child = spawn(TSX_BINARY, ["scripts/ingest-espoo.ts"], {
        cwd: process.cwd(),
        env: process.env,
      });

      child.stdout?.on("data", (chunk) => {
        console.info(`${logPrefix} [ingest stdout] ${chunk.toString().trim()}`);
      });

      child.stderr?.on("data", (chunk) => {
        console.error(`${logPrefix} [ingest stderr] ${chunk.toString().trim()}`);
      });

      child.on("error", (error) => {
        backgroundIngestPromise = null;
        reject(error);
      });

      child.on("close", (code) => {
        backgroundIngestPromise = null;
        if (code === 0) {
          console.info(`${logPrefix} Espoo ingestion finished successfully`);
          resolve();
        } else {
          reject(new Error(`Espoo ingestion exited with code ${code}`));
        }
      });
    });
  } else {
    console.info(`${logPrefix} Waiting for existing Espoo ingestion to finish`);
  }

  return backgroundIngestPromise!;
}

type EventSuggestionWithContext = EventSuggestions & {
  recommendations: Array<
    EventSuggestions["recommendations"][number] & {
      event: {
        title: string;
        summary: string | null;
        startTime: string;
        endTime: string | null;
        location: string | null;
        price: string | null;
        sourceUrl: string | null;
      };
    }
  >;
};

export async function getEspooEventSuggestionsForUser(
  userId: string
): Promise<EventSuggestionWithContext> {
  const logPrefix = `[EspooSuggestions][user=${userId}]`;

  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    throw new Error("User preferences not found. Complete onboarding first.");
  }

  const now = new Date();

  const cached = await prisma.espooSuggestionCache.findUnique({
    where: { userId },
  });

  if (cached) {
    const ageMs = now.getTime() - cached.generatedAt.getTime();
    if (ageMs < EVENT_SUGGESTION_CACHE_TTL_MS) {
      console.info(
        `${logPrefix} Serving cached recommendations (age ${Math.round(
          ageMs / 1000
        )}s)`
      );
      return cached.suggestionsJson as EventSuggestionWithContext;
    }

    console.info(
      `${logPrefix} Cached recommendations expired (${Math.round(
        ageMs / 1000
      )}s old), refreshing`
    );
  }

  const end = new Date(
    now.getTime() + EVENT_SUGGESTION_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  console.info(
    `${logPrefix} Fetching up to ${EVENT_SUGGESTION_LIMIT} events ordered by start time (no date filter)`
  );

  const fetchEvents = () =>
    prisma.event.findMany({
      orderBy: { startTime: "asc" },
      take: EVENT_SUGGESTION_LIMIT,
    });

  let events = await fetchEvents();

  if (!events.length) {
    console.warn(
      `${logPrefix} No events found locally. Triggering fallback ingestion.`
    );
    try {
      await runEspooIngestor(logPrefix);
    } catch (error) {
      console.error(`${logPrefix} Failed to run fallback ingestion`, error);
      throw new Error(
        "Couldn't refresh Espoo events right now. Please try again shortly."
      );
    }

    events = await fetchEvents();

    if (!events.length) {
      console.warn(
        `${logPrefix} Still no events after ingestion. Returning empty list.`
      );
      return { recommendations: [] };
    }
  }

  const preferences = prefs.normalizedJson as NormalizedPreferences;

  const eventsForModel = events.slice(0, EVENT_SUGGESTION_MODEL_LIMIT);

  console.info(
    `${logPrefix} Sending ${eventsForModel.length}/${events.length} events to Featherless`
  );

  if (!eventsForModel.length) {
    console.warn(`${logPrefix} No events available for ranking after filtering.`);
    return { recommendations: [] };
  }

  let baseSuggestions: EventSuggestions;
  try {
    baseSuggestions = await callFeatherlessEventSuggestions(
      preferences,
      eventsForModel.map((event) => ({
        id: event.sourceId,
        title: event.title,
        summary: event.summary,
        description: event.description,
        start_time: event.startTime.toISOString(),
        end_time: event.endTime?.toISOString() ?? undefined,
        location:
          event.locationName || event.locationAddress || event.city || undefined,
        price: event.price ?? undefined,
        tags: event.tags,
        source_url: event.sourceUrl ?? undefined,
      }))
    );
  } catch (error) {
    console.error(`${logPrefix} Featherless failed, using fallback`, error);
    baseSuggestions = {
      recommendations: eventsForModel.slice(0, 3).map((event) => ({
        event_id: event.sourceId,
        title: event.title,
        reason:
          "Showing upcoming Espoo events while Featherless catches up. Check details to see if they fit your interests.",
        confidence: 0.25,
      })),
    };
  }

  const eventById = new Map(events.map((evt) => [evt.sourceId, evt]));
  console.info(`${logPrefix} Featherless returned ${baseSuggestions.recommendations.length} recommendations`);

  const sortedRecommendations = [...baseSuggestions.recommendations].sort(
    (a, b) => b.confidence - a.confidence
  );

  const resolved: EventSuggestionWithContext = {
    recommendations: sortedRecommendations
      .map((rec) => {
        const event = eventById.get(rec.event_id);
        if (!event) return null;
        return {
          ...rec,
          event: {
            title: event.title,
            summary: event.summary ?? null,
            startTime: event.startTime.toISOString(),
            endTime: event.endTime ? event.endTime.toISOString() : null,
            location:
              event.locationName || event.locationAddress || event.city || null,
            price: event.price ?? null,
            sourceUrl: event.sourceUrl ?? null,
          },
        };
      })
      .filter((rec): rec is NonNullable<typeof rec> => Boolean(rec)),
  };

  await prisma.espooSuggestionCache.upsert({
    where: { userId },
    create: {
      userId,
      suggestionsJson: resolved,
      generatedAt: new Date(),
    },
    update: {
      suggestionsJson: resolved,
      generatedAt: new Date(),
    },
  });

  return resolved;
}
