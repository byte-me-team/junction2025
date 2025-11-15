import { prisma } from "@/lib/prisma";
import {
  callFeatherlessNormalize,
  callFeatherlessJointActivities,
  JointActivities,
  NormalizedPreferences,
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
