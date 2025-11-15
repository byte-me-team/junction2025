import { prisma } from "@/lib/prisma";
import {
  callFeatherlessNormalize,
  callFeatherlessJointActivities,
  callFeatherlessGeneralSuggestions,
  NormalizedPreferences,
  JointActivities,
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

    return null
  // return prisma.match.create({
  //   data: {
  //     user1Id,
  //     user2Id,
  //     user1Preferences: prefs1,
  //     user2Preferences: prefs2,
  //     suggestionsJson: suggestions,
  //   },
  // });
}

export async function generateGeneralSuggestionsForEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: { preferences: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.preferences) {
    throw new Error("User must complete onboarding before getting suggestions");
  }

  const normalizedPrefs = user.preferences
    .normalizedJson as NormalizedPreferences;

  const existingSuggestions = await prisma.generalSuggestion.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  const pendingSuggestions = existingSuggestions.filter(
    (item) => item.status === "pending"
  );
  const previouslyAccepted = existingSuggestions.filter(
    (item) => item.status === "accepted"
  );
  const previouslyRejected = existingSuggestions.filter(
    (item) => item.status === "rejected"
  );

  if (pendingSuggestions.length > 0) {
    await prisma.generalSuggestion.updateMany({
      where: { id: { in: pendingSuggestions.map((item) => item.id) } },
      data: {
        status: "rejected",
        accepted: false,
        decisionAt: new Date(),
      },
    });
  }

  const HISTORY_LIMIT = 5;
  const acceptedHistory = previouslyAccepted
    .map((item) => ({
      entry: {
        title: item.title,
      },
      decisionTime: item.decisionAt ?? item.createdAt,
    }))
    .sort(
      (a, b) =>
        (b.decisionTime?.getTime() ?? 0) - (a.decisionTime?.getTime() ?? 0)
    )
    .slice(0, HISTORY_LIMIT)
    .map((item) => item.entry);

  const rejectedHistory = [
    ...pendingSuggestions.map((item) => ({
      entry: {
        title: item.title,
      },
      decisionTime: new Date(),
    })),
    ...previouslyRejected.map((item) => ({
      entry: {
        title: item.title,
      },
      decisionTime: item.decisionAt ?? item.createdAt,
    })),
  ]
    .sort(
      (a, b) =>
        (b.decisionTime?.getTime() ?? 0) - (a.decisionTime?.getTime() ?? 0)
    )
    .slice(0, HISTORY_LIMIT)
    .map((item) => item.entry);

  const plan = await callFeatherlessGeneralSuggestions({
    name: user.name,
    email: user.email,
    city: user.city,
    preferences: normalizedPrefs,
    history: {
      accepted: acceptedHistory,
      rejected: rejectedHistory,
    },
  });

  const created = await prisma.$transaction(
    plan.suggestions.map((suggestion) => {
      const metadataEntries = {
        mood: suggestion.mood ?? null,
        ideal_time: suggestion.ideal_time ?? null,
        companion_tip: suggestion.companion_tip ?? null,
      };
      const cleanedMetadata = Object.entries(metadataEntries).reduce<
        Record<string, string>
      >((acc, [key, value]) => {
        if (value) {
          acc[key] = value;
        }
        return acc;
      }, {});

      return prisma.generalSuggestion.create({
        data: {
          userId: user.id,
          title: suggestion.title,
          summary: suggestion.summary,
          benefit: suggestion.benefit,
          metadata:
            Object.keys(cleanedMetadata).length > 0
              ? cleanedMetadata
              : undefined,
          status: "pending",
          accepted: false,
          decisionAt: null,
        },
      });
    })
  );

  const rejectedCount = await prisma.generalSuggestion.count({
    where: { userId: user.id, status: "rejected" },
  });

  const TARGET_REJECTED = 20;
  const removeCount = Math.max(0, rejectedCount - TARGET_REJECTED);
  if (removeCount > 0) {
    const overflow = await prisma.generalSuggestion.findMany({
      where: { userId: user.id, status: "rejected" },
      orderBy: [
        { decisionAt: "asc" },
        { createdAt: "asc" },
      ],
      take: removeCount,
    });

    if (overflow.length > 0) {
      await prisma.generalSuggestion.deleteMany({
        where: { id: { in: overflow.map((item) => item.id) } },
      });
    }
  }

  return created;
}
