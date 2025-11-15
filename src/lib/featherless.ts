import { z } from "zod";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;

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

const EventRecommendationSchema = z.object({
  event_id: z.string(),
  title: z.string(),
  reason: z.string(),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .catch(0.5),
});

export const EventSuggestionsSchema = z.object({
  recommendations: z.array(EventRecommendationSchema),
});

export type EventSuggestions = z.infer<typeof EventSuggestionsSchema>;

export type EventCandidate = {
  id: string;
  title: string;
  summary?: string | null;
  description?: string | null;
  start_time: string;
  end_time?: string | null;
  location?: string | null;
  tags?: string[];
  price?: string | null;
  source_url?: string | null;
};

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

export class FeatherlessMissingApiKeyError extends Error {
  constructor() {
    super("FEATHERLESS_API_KEY is not set. Add it to your environment to enable Featherless integrations.");
    this.name = "FeatherlessMissingApiKeyError";
  }
}

const FEATHERLESS_TIMEOUT_MS = Number(
  process.env.FEATHERLESS_TIMEOUT_MS ?? "45000"
);

async function callFeatherlessRaw(prompt: string): Promise<string> {
  if (!FEATHERLESS_API_KEY) {
    throw new FeatherlessMissingApiKeyError();
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FEATHERLESS_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(FEATHERLESS_BASE_URL, {
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
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if ((error as Error)?.name === "AbortError") {
      throw new Error(
        `Featherless request timed out after ${FEATHERLESS_TIMEOUT_MS}ms`
      );
    }
    throw error;
  }

  clearTimeout(timeout);

  const text = await res.text().catch(() => "");

  if (!res.ok) {
    let parsed: any;
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = null;
    }

    const code = parsed?.error?.code;
    const message = parsed?.error?.message ?? text;

    if (code === "concurrency_limit_exceeded") {
      throw new FeatherlessConcurrencyError(message);
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

const EVENT_MATCH_SYSTEM_INSTRUCTIONS = `
You are a cultural concierge. Given a person's structured preferences and a set of candidate events, recommend the most relevant events for the next week. Consider tags, descriptions, timing, location, and accessibility cues. Assign each recommendation a confidence score between 0 and 1 (0 = weak match, 1 = perfect match). Return JSON ONLY:
{
  "recommendations": [
    {
      "event_id": string, // must match the provided event id
      "title": string, // human readable title or summary
      "reason": string, // short explanation personalized to the user
      "confidence": number // required 0-1 confidence score
    }
  ]
}
`.trim();

export async function callFeatherlessEventSuggestions(
  userPrefs: NormalizedPreferences,
  events: EventCandidate[]
): Promise<EventSuggestions> {
  if (!events.length) {
    throw new Error("No events provided to Featherless");
  }

  const startedAt = Date.now();
  console.info("[Featherless][events] Sending candidate batch", {
    candidateCount: events.length,
  });

  const payload = events.map((evt) => ({
    event_id: evt.id,
    title: evt.title,
    summary: evt.summary ?? evt.description ?? null,
    start_time: evt.start_time,
    end_time: evt.end_time ?? null,
    location: evt.location ?? null,
    price: evt.price ?? null,
    tags: (evt.tags ?? []).slice(0, 8),
    source_url: evt.source_url ?? null,
  }));

  const fullPrompt = `
${EVENT_MATCH_SYSTEM_INSTRUCTIONS}

User preferences:
${JSON.stringify(userPrefs, null, 2)}

Candidate events:
${JSON.stringify(payload, null, 2)}

Always choose events from the provided list. No new events. Return JSON only, without backticks.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);
  console.info("[Featherless][events] Raw completion received", {
    durationMs: Date.now() - startedAt,
  });
  const jsonString = extractJsonObject(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      "Failed to parse event suggestions JSON: " +
        (err as Error).message +
        "\nHere is the output: " +
        output
    );
  }

  const validated = EventSuggestionsSchema.parse(parsed);
  console.info("[Featherless][events] Parsed recommendations", {
    recommendationCount: validated.recommendations.length,
  });

  return validated;
}
