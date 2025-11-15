import { prisma } from "@/lib/prisma";
import {
  callFeatherlessNormalize,
  callFeatherlessJointActivities,
  callFeatherlessEventSuggestions,
  JointActivities,
  NormalizedPreferences,
  EventSuggestions,
} from "@/lib/featherless";

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

export async function getEspooEventSuggestionsForUser(
  userId: string
): Promise<EventSuggestions> {
  const prefs = await prisma.userPreferences.findUnique({
    where: { userId },
  });

  if (!prefs) {
    throw new Error("User preferences not found. Complete onboarding first.");
  }

  const now = new Date();
  const end = new Date(
    now.getTime() + EVENT_SUGGESTION_WINDOW_DAYS * 24 * 60 * 60 * 1000
  );

  const events = await prisma.event.findMany({
    where: {
      startTime: {
        gte: now,
        lte: end,
      },
    },
    orderBy: { startTime: "asc" },
    take: EVENT_SUGGESTION_LIMIT,
  });

  if (!events.length) {
    throw new Error("No upcoming events available. Run the ingestor first.");
  }

  const preferences = prefs.normalizedJson as NormalizedPreferences;

  return callFeatherlessEventSuggestions(
    preferences,
    events.map((event) => ({
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
}
