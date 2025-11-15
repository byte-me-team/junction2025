import { z } from "zod";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;
if (!FEATHERLESS_API_KEY) {
  throw new Error("FEATHERLESS_API_KEY is not set");
}

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1/completions";
const MODEL_NAME = "Qwen/Qwen2.5-72B-Instruct";

// ------------- Schemas -------------

const InterestSchema = z.object({
  name: z.string(),
  type: z
    .enum(["physical", "mental", "social", "digital", "creative", "other"])
    .optional(),
  tags: z.array(z.string()).default([]),
  solo_or_social: z.enum(["solo", "social", "either"]).optional(),
});

export const NormalizedPreferencesSchema = z.object({
  interests: z.array(InterestSchema),
});

export type NormalizedPreferences = z.infer<typeof NormalizedPreferencesSchema>;

const JointActivitySchema = z.object({
  title: z.string(),
  description: z.string(),
  why_it_matches: z.string(),
  uses_user1_interests: z.array(z.string()),
  uses_user2_interests: z.array(z.string()),
});

export const JointActivitiesSchema = z.object({
  activities: z.array(JointActivitySchema),
});

export type JointActivities = z.infer<typeof JointActivitiesSchema>;

// ------------- Low-level HTTP caller -------------

function extractJsonObject(text: string): string {
  // If there are fenced code blocks, strip them
  const fenceMatch = text.match(/```(?:json)?([\s\S]*?)```/i);
  const inner = fenceMatch ? fenceMatch[1] : text;

  // Trim and then try to take substring from first "{" to last "}"
  const trimmed = inner.trim();
  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return trimmed.slice(firstBrace, lastBrace + 1);
  }

  // If that fails, just return trimmed and let JSON.parse throw
  return trimmed;
}

export class FeatherlessConcurrencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FeatherlessConcurrencyError";
  }
}

async function callFeatherlessRaw(prompt: string): Promise<string> {
  const res = await fetch(FEATHERLESS_BASE_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${FEATHERLESS_API_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL_NAME,
      prompt,
      max_tokens: 1500,
    }),
  });

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    try {
      const json = JSON.parse(text);
      const code = json?.error?.code;
      const message = json?.error?.message ?? text;

      if (code === "concurrency_limit_exceeded") {
        throw new FeatherlessConcurrencyError(message);
      }
    } catch {
      // ignore JSON parse error, fall through to generic error
    }

    throw new Error(
      `Featherless error: ${res.status} ${res.statusText} - ${text}`
    );
  }

  const data = JSON.parse(text) as any;
  const completionText = data.choices?.[0]?.text;

  if (!completionText || typeof completionText !== "string") {
    throw new Error("Invalid Featherless response: missing choices[0].text");
  }

  return completionText.trim();
}

// ------------- High-level helpers -------------

const NORMALIZE_SYSTEM_INSTRUCTIONS = `
You are a data normalizer for an activity-matching app.
Extract a structured JSON object from the user's free-text description of what they like to do.

Return JSON only:
{
  "interests": [
    {
      "name": string,
      "type": "physical" | "mental" | "social" | "digital" | "creative" | "other",
      "tags": string[],
      "solo_or_social": "solo" | "social" | "either"
    }
  ]
}
No explanation.
`.trim();

export async function callFeatherlessNormalize(
  rawText: string
): Promise<NormalizedPreferences> {
  const fullPrompt = `
${NORMALIZE_SYSTEM_INSTRUCTIONS}

User text:
${rawText}

Return JSON only. No backticks, no code fences, no commentary.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);
  const jsonString = extractJsonObject(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      "Failed to parse normalize JSON: " +
        (err as Error).message +
        "\nHere is the output: " +
        output
    );
  }

  return NormalizedPreferencesSchema.parse(parsed);
}

const MATCH_SYSTEM_INSTRUCTIONS = `
You generate shared activity suggestions between two people.

Input:
Two JSON objects, each containing a person's normalized interests.

Output:
Valid JSON ONLY:
{
  "activities": [
    {
      "title": string,
      "description": string,
      "why_it_matches": string,
      "uses_user1_interests": string[],
      "uses_user2_interests": string[]
    }
  ]
}
`.trim();

export async function callFeatherlessJointActivities(
  user1Prefs: NormalizedPreferences,
  user2Prefs: NormalizedPreferences
): Promise<JointActivities> {
  const fullPrompt = `
${MATCH_SYSTEM_INSTRUCTIONS}

User 1:
${JSON.stringify(user1Prefs, null, 2)}

User 2:
${JSON.stringify(user2Prefs, null, 2)}

Return JSON only. No backticks, no code fences, no commentary.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);
  const jsonString = extractJsonObject(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      "Failed to parse joint activities JSON: " +
        (err as Error).message +
        "\nHere is the output: " +
        output
    );
  }

  return JointActivitiesSchema.parse(parsed);
}
