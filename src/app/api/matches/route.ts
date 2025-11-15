import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatch } from "@/lib/services";
import {
  FeatherlessConcurrencyError,
  FeatherlessMissingApiKeyError,
} from "@/lib/featherless";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, relativeId } = body as {
      userId?: string;
      relativeId?: string;
    };

    if (!userId || !relativeId) {
      return NextResponse.json(
        { error: "both people are required" },
        { status: 400 }
      );
    }

    const match = await createMatch(userId, relativeId);

    return NextResponse.json(match, { status: 200 });

  } catch (err: any) {
    console.error("POST /api/preferences error:", err);

    if (err instanceof FeatherlessConcurrencyError) {
      return NextResponse.json(
        {
          error: "LLM concurrency limit exceeded. Please wait a moment and try again.",
          details: err.message,
        },
        { status: 429 }
      );
    }

    if (err instanceof FeatherlessMissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "FEATHERLESS_API_KEY is missing. Add it to your .env to run the matching prototype.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}