import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMatch } from "@/lib/services";
import {
  FeatherlessConcurrencyError,
  FeatherlessMissingApiKeyError,
} from "@/lib/featherless";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const matchId = url.searchParams.get("id");

    if (!matchId) {
      return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({
      where: { id: matchId }
    });

    return NextResponse.json(match);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
