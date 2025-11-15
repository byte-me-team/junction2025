import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import {
  getSuggestionTarget,
  listMatchedSuggestions,
} from "@/lib/matched-suggestions";

const DEFAULT_STATUS = "idle";

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

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const target = getSuggestionTarget();
    const suggestions = await listMatchedSuggestions(user.id, target);

    const statusHeader =
      request.headers.get("x-matched-suggestions-status") ?? DEFAULT_STATUS;
    const missingHeader = request.headers.get(
      "x-matched-suggestions-missing"
    );
    const refreshedHeader = request.headers.get(
      "x-matched-suggestions-refreshed"
    );

    const missing =
      typeof missingHeader === "string"
        ? Number(missingHeader)
        : Math.max(0, target - suggestions.length);

    return NextResponse.json(
      {
        recommendations: suggestions,
        meta: {
          target,
          status: statusHeader,
          missing: Number.isFinite(missing) ? missing : 0,
          refreshedAt: refreshedHeader ? Number(refreshedHeader) : null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Suggestions][API] Failed to load suggestions", error);
    return NextResponse.json(
      { error: "Failed to load suggestions" },
      { status: 500 }
    );
  }
}
