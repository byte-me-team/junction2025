import { z } from "zod";

const FEATHERLESS_API_KEY = process.env.FEATHERLESS_API_KEY;

const FEATHERLESS_BASE_URL = "https://api.featherless.ai/v1/completions";
const MODEL_NAME = "Qwen/Qwen2.5-7B-Instruct";

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

export const JointActivitiesSchema = z.object({
  activities: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      location: z.string(),
      possible_date: z.string(),
    })
  ),
});

export type JointActivities = z.infer<typeof JointActivitiesSchema>;

/** Single yoga pose */
export const YogaPoseSchema = z.object({
  id: z.number(),
  english_name: z.string(),
  sanskrit_name_adapted: z.string().optional(),
  difficulty_level: z.enum(["Beginner", "Intermediate", "Expert"]),
  url_png: z.string().url(),
  pose_benefits: z.string().optional(),
});

/** Full custom yoga session */
export const YogaSessionSchema = z.object({
  title: z.string().min(5),
  difficulty: z.enum(["Beginner", "Intermediate", "Expert"]),
  poses: z.array(YogaPoseSchema).min(1),
});

/** API response wrapper */
export const YogaSessionResponseSchema = z.object({
  sessions: z.array(YogaSessionSchema).min(1),
});

export type YogaPose = z.infer<typeof YogaPoseSchema>;
export type YogaSession = z.infer<typeof YogaSessionSchema>;
export type YogaSessionResponse = z.infer<typeof YogaSessionResponseSchema>;


const GeneralSuggestionSchema = z.object({
  title: z.string(),
  summary: z.string(),
  benefit: z.string(),
  mood: z.string().optional(),
  ideal_time: z.string().optional(),
  companion_tip: z.string().optional(),
});

export const GeneralSuggestionsSchema = z.object({
  suggestions: z.array(GeneralSuggestionSchema).min(1),
});

export type GeneralSuggestionsPlan = z.infer<
  typeof GeneralSuggestionsSchema
>;

const EventKeywordPlanSchema = z.object({
  keywords: z.array(z.string().min(2)).min(1).max(5),
});

export type EventKeywordPlan = z.infer<typeof EventKeywordPlanSchema>;

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

type YogaPoseFromAPI = {
  id: number;
  english_name: string;
  difficulty_level: "Beginner" | "Intermediate" | "Expert";
  url_png?: string;
  pose_benefits?: string;
  sanskrit_name_adapted?: string;
};

export async function fetchYogaPoses(level?: string): Promise<YogaPoseFromAPI[]> {
  const url = new URL("https://yoga-api-nzy4.onrender.com/v1/poses");
  if (level) url.searchParams.set("level", level.toLowerCase());

  const res = await fetch(url.toString());
  const data = await res.json();

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.poses)) return data.poses;
  return [];
}

export async function callFeatherlessYogaSuggestion({
  history,
  mood,
  symptoms,
  goal,
  preferences,
}: {
  history: string[];
  mood: number; // 1–5
  symptoms: string[];
  goal: string;
  preferences: NormalizedPreferences;
}) {

const availablePoses = await fetchYogaPoses();

const YOGA_SESSION_PROMPT = `
You are a friendly AI yoga coach. Generate a single personalized yoga session for an elderly user.

Requirements:
- Use **only** the poses listed below from the Yoga API.
- Tailor the session to their mood (1–5), symptoms, goal, and preferences.
- Include 2 poses.
- Each pose must include: id, english_name, difficulty_level, url_png, pose_benefits
- Session must have: title (<10 words), difficulty, poses array.
- JSON only.

User input:
- Mood: ${mood}
- Symptoms: ${symptoms.join(", ")}
- Goal: ${goal}
- Preferences: ${preferences.interests.map(i => i.name).join(", ")}

Available poses:
${availablePoses.map((p) =>`id: ${p.id}, english_name: "${p.english_name}", difficulty_level: "${p.difficulty_level}"
, url_png: "${p.url_png}"`).join("\n")}

Return ONLY ONE JSON object like:
{
  "sessions": [
    {
      "title": "Gentle Morning Flow",
      "difficulty": "Beginner",
      "poses": [
        {
          "id": 1,
          "english_name": "Cat Pose",
          "difficulty_level": "Beginner",
          "url_png": "...",
          "pose_benefits": "..."
        }
      ]
    }
  ]
}
`.trim();

  const rawOutput = await callFeatherlessRaw(YOGA_SESSION_PROMPT);

  const jsonStringMatch = rawOutput.match(/\{[\s\S]*\}/m);
  if (!jsonStringMatch) throw new Error("No JSON found in AI output");
  const parsed = JSON.parse(jsonStringMatch[0]);

  return YogaSessionResponseSchema.parse(parsed);
}

const MATCH_SYSTEM_INSTRUCTIONS = `
You are a cheerful guide whose job is to encourage older adults to be physically and socially active.
You will receive two people's interests and dislikes, generate THREE activity ideas for them to do together.
Make sure they include some form of movement and leaving the house. You can make them try new things as often as their
adventourousness trait allows. Make sure it is relevant to the city and date they are in.

Formatting constraints:
- Each title must start with a relevant emoji and stay under 6 words.
- Summaries should be 1 short sentence (max ~25 words) focused on actually going out.
- "benefit" should be a single upbeat sentence (max 16 words) spelling out the positive outcome.
- mood / ideal_time / companion_tip must be ultra-short taglines (max 5 words). Use words only (no emoji or special unicode here to keep the JSON simple).
- Avoid repeating recently rejected titles, and lean into themes that match their approved history.

Input:
Three JSON objects, each containing an activity.

Output:
Valid JSON ONLY:
{
  "activities": [
    {
      "title": string,
      "description": string,
      "location": string,
      "possible_date": string
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

const GENERAL_SUGGESTIONS_INSTRUCTIONS = `
You are a cheerful guide whose job is to encourage older adults to step outside.
You will receive a person profile, recent decisions (what they approved or rejected recently), plus their normalized hobbies/preferences.
Generate EXACTLY 3 concrete activity nudges for their city.

Formatting constraints:
- Each title must start with a relevant emoji and stay under 6 words.
- Summaries should be 1 short sentence (max ~25 words) focused on actually going out.
- "benefit" should be a single upbeat sentence (max 16 words) spelling out the positive outcome.
- mood / ideal_time / companion_tip must be ultra-short taglines (max 5 words). Use words only (no emoji or special unicode here to keep the JSON simple).
- Avoid repeating recently rejected titles, and lean into themes that match their approved history.

Respond with VALID JSON ONLY:
{
  "suggestions": [
    {
      "title": string,
      "summary": string,
      "benefit": string,
      "mood": string,
      "ideal_time": string,
      "companion_tip": string
    }
  ]
}
`.trim();

// ------------- Event keyword instructions -------------
const EVENT_KEYWORD_INSTRUCTIONS = `
You design Linked Events API keyword filters for seniors in Espoo.
Use the provided profile and recent accepted/rejected titles to decide which keywords are most promising.

Rules:
- Return between 1 and 5 short search phrases (e.g. "choir", "quiet walk", "museum").
- Prefer phrases that align with accepted titles or core normalized interests.
- Avoid keywords related to recently rejected titles.
- No explanation, only the JSON structure shown below.

Output JSON ONLY:
{
  "keywords": [ "...", "..." ]
}
`.trim();

type SuggestionHistoryEntry = {
  title: string;
};

export async function callFeatherlessGeneralSuggestions({
  name,
  email,
  city,
  preferences,
  history,
}: {
  name?: string | null;
  email: string;
  city?: string | null;
  preferences: NormalizedPreferences;
  history?: {
    accepted?: SuggestionHistoryEntry[];
    rejected?: SuggestionHistoryEntry[];
  };
}): Promise<GeneralSuggestionsPlan> {
  const profileSummary = {
    name: name ?? "Neighbor",
    email,
    city: city ?? "Unknown",
  };

  const historySectionParts: string[] = [];
  if (history?.accepted && history.accepted.length > 0) {
    historySectionParts.push(
      "Approved ideas they enjoyed:\n" +
        history.accepted
          .map((item, index) => `${index + 1}. ${item.title}`)
          .join("\n")
    );
  }
  if (history?.rejected && history.rejected.length > 0) {
    historySectionParts.push(
      "Rejected ideas they passed on recently:\n" +
        history.rejected
          .map((item, index) => `${index + 1}. ${item.title}`)
          .join("\n")
    );
  }

  const historySection =
    historySectionParts.length > 0
      ? historySectionParts.join("\n\n")
      : "No prior approvals or rejections yet.";

  const fullPrompt = `
${GENERAL_SUGGESTIONS_INSTRUCTIONS}

Person profile:
${JSON.stringify(profileSummary, null, 2)}

Recent decision context:
${historySection}

Normalized hobbies/preferences:
${JSON.stringify(preferences, null, 2)}

Return JSON only. No code fences. No commentary.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);
  const jsonString = extractJsonObject(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      "Failed to parse general suggestions JSON: " +
        (err as Error).message +
        "\nHere is the output: " +
        output
    );
  }

  return GeneralSuggestionsSchema.parse(parsed);
}

export async function callFeatherlessEventKeywords({
  preferences,
  acceptedTitles,
  rejectedTitles,
}: {
  preferences: NormalizedPreferences;
  acceptedTitles: string[];
  rejectedTitles: string[];
}): Promise<EventKeywordPlan> {
  const fullPrompt = `
${EVENT_KEYWORD_INSTRUCTIONS}

Normalized interests:
${JSON.stringify(preferences, null, 2)}

Accepted titles they enjoyed:
${JSON.stringify(acceptedTitles, null, 2)}

Rejected titles they skipped:
${JSON.stringify(rejectedTitles, null, 2)}

Return JSON only. No code fences.
  `.trim();

  const output = await callFeatherlessRaw(fullPrompt);
  const jsonString = extractJsonObject(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err) {
    throw new Error(
      "Failed to parse event keyword JSON: " +
        (err as Error).message +
        "\nHere is the output: " +
        output
    );
  }

  return EventKeywordPlanSchema.parse(parsed);
}
