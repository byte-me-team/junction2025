import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type Params = Promise<{ id: string }>

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id?: string }> | { id?: string } }
) {
  try {
    const rawParams = context.params;
    const resolvedParams = rawParams instanceof Promise ? await rawParams : rawParams;
    let suggestionId = resolvedParams?.id;
    if (!suggestionId) {
      const path = req.nextUrl.pathname;
      suggestionId = path.split("/").filter(Boolean).pop();
    }
    if (!suggestionId) {
      return NextResponse.json(
        { error: "Suggestion id is required in the URL" },
        { status: 400 }
      );
    }

    const { accepted } = (await req.json()) as {
      accepted?: boolean;
    };

    if (typeof accepted !== "boolean") {
      return NextResponse.json(
        { error: "accepted flag is required" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.generalSuggestion.findUnique({
      where: { id: suggestionId },
    });

    if (!suggestion) {
      return NextResponse.json(
        { error: "Suggestion not found" },
        { status: 404 }
      );
    }

    const updated = await prisma.generalSuggestion.update({
      where: { id: suggestion.id },
      data: {
        accepted,
        status: accepted ? "accepted" : suggestion.status,
        decisionAt: accepted ? new Date() : suggestion.decisionAt,
      },
    });

    return NextResponse.json(
      {
        suggestion: {
          id: updated.id,
          title: updated.title,
          summary: updated.summary,
          benefit: updated.benefit,
          metadata: updated.metadata,
          accepted: updated.accepted,
          status: updated.status,
          decisionAt: updated.decisionAt,
          createdAt: updated.createdAt,
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("PATCH /api/general-suggestions/:id error:", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Failed to update suggestion",
      },
      { status: 500 }
    );
  }
}

