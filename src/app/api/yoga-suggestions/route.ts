import { NextRequest, NextResponse } from "next/server";
import { callFeatherlessYogaSuggestion } from "@/lib/featherless";
import { NormalizedPreferencesSchema } from "@/lib/featherless";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      mood,
      symptoms,
      goal,
      preferences,
      history,
    }: {
      email: string;
      mood: number;
      symptoms: string[];
      goal: string;
      preferences: unknown;
      history?: string[];
    } = body;

    // Validate preferences
    const normalizedPrefs = NormalizedPreferencesSchema.parse(preferences);

    const suggestions = await callFeatherlessYogaSuggestion({
      mood,
      symptoms,
      goal,
      preferences: normalizedPrefs,
      history: history ?? [],
    });

    return NextResponse.json({ suggestions });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}


