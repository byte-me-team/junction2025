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
    const { user1Email, user2Email } = body as {
      user1Email?: string;
      user2Email?: string;
    };

    if (!user1Email || !user2Email) {
      return NextResponse.json(
        { error: "user1Email and user2Email are required" },
        { status: 400 }
      );
    }

    const [user1, user2] = await Promise.all([
      prisma.user.findUnique({ where: { email: user1Email } }),
      prisma.user.findUnique({ where: { email: user2Email } }),
    ]);

    if (!user1 || !user2) {
      return NextResponse.json(
        { error: "Both users must exist and have saved preferences" },
        { status: 400 }
      );
    }

    const match = await createMatch(user1.id, user2.id);

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
