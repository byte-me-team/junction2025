import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getEspooEventSuggestionsForUser } from "@/lib/services";
import {
  FeatherlessConcurrencyError,
  FeatherlessMissingApiKeyError,
} from "@/lib/featherless";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { email?: string };
    const email = body.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    console.info("[EspooSuggestions][API] Incoming request", { email });

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const suggestions = await getEspooEventSuggestionsForUser(user.id);

    console.info("[EspooSuggestions][API] Responding with recommendations", {
      email,
      recommendationCount: suggestions.recommendations.length,
    });

    return NextResponse.json(suggestions, { status: 200 });
  } catch (error) {
    console.error("[EspooSuggestions][API] Error", error);

    if (error instanceof FeatherlessConcurrencyError) {
      return NextResponse.json(
        {
          error:
            "LLM concurrency limit exceeded. Please wait a moment and try again.",
          details: error.message,
        },
        { status: 429 }
      );
    }

    if (error instanceof FeatherlessMissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "FEATHERLESS_API_KEY is missing. Add it to your environment to run event suggestions.",
        },
        { status: 500 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
