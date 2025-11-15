import { NextRequest, NextResponse } from "next/server";
import type { GeneralSuggestion } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { generateGeneralSuggestionsForEmail } from "@/lib/services";
import {
  FeatherlessConcurrencyError,
  FeatherlessMissingApiKeyError,
} from "@/lib/featherless";

function formatSuggestions(suggestions: GeneralSuggestion[]) {
  return suggestions.map((suggestion) => {
    const metadataSource =
      suggestion.metadata && typeof suggestion.metadata === "object"
        ? (suggestion.metadata as Record<string, unknown>)
        : null;
    const rawMetadata =
      metadataSource && !Array.isArray(metadataSource)
        ? Object.entries(metadataSource).reduce<Record<string, string>>(
            (acc, [key, value]) => {
              if (typeof value === "string" && value.length > 0) {
                acc[key] = value;
              }
              return acc;
            },
            {}
          )
        : undefined;
    const metadata =
      rawMetadata && Object.keys(rawMetadata).length > 0
        ? rawMetadata
        : undefined;

    return {
      id: suggestion.id,
      title: suggestion.title,
      summary: suggestion.summary,
      benefit: suggestion.benefit,
      metadata,
      accepted: suggestion.accepted,
      status: suggestion.status,
      decisionAt: suggestion.decisionAt,
      createdAt: suggestion.createdAt,
    };
  });
}

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "email query parameter is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const [suggestions, relatives] = await Promise.all([
      prisma.generalSuggestion.findMany({
        where: {
          userId: user.id,
          status: { in: ["pending", "accepted"] },
        },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.relative.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
        take: 10,
      }),
    ]);

    const formattedRelatives = relatives.map((relative) => ({
      id: relative.id,
      name: relative.name,
      email: relative.email ?? `${relative.name.split(" ")[0] ?? "friend"}@example.com`,
    }));

    return NextResponse.json(
      {
        suggestions: formatSuggestions(suggestions),
        relatives: formattedRelatives,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GET /api/general-suggestions error:", err);
    return NextResponse.json(
      { error: "Failed to load general suggestions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const suggestions = await generateGeneralSuggestionsForEmail(email);

    return NextResponse.json(
      { suggestions: formatSuggestions(suggestions) },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/general-suggestions error:", err);

    if (err instanceof FeatherlessConcurrencyError) {
      return NextResponse.json(
        {
          error:
            "LLM concurrency limit exceeded. Please wait a moment and try again.",
          details: err.message,
        },
        { status: 429 }
      );
    }

    if (err instanceof FeatherlessMissingApiKeyError) {
      return NextResponse.json(
        {
          error:
            "FEATHERLESS_API_KEY is missing. Add it to your .env to run this prototype.",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: err?.message ?? "Failed to generate suggestions" },
      { status: 500 }
    );
  }
}
