import { NextRequest, NextResponse } from "next/server";

import {
  ensureSuggestionMinimum,
  getSuggestionJobStatus,
  getSuggestionRefreshTimestamp,
} from "@/lib/matched-suggestions";

const INTERNAL_TOKEN =
  process.env.MATCHED_SUGGESTION_GATEWAY_TOKEN ??
  process.env.NEXTAUTH_SECRET ??
  "";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!INTERNAL_TOKEN) {
    return NextResponse.json(
      { error: "MATCHED_SUGGESTION_GATEWAY_TOKEN is not configured" },
      { status: 500 }
    );
  }

  const provided = request.headers.get("x-matched-suggestions-internal");
  if (provided !== INTERNAL_TOKEN) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { userId?: string }
    | null;
  const userId = payload?.userId;

  if (!userId) {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 }
    );
  }

  const result = await ensureSuggestionMinimum(userId);
  const refreshedAt = getSuggestionRefreshTimestamp(userId);
  const status = getSuggestionJobStatus(userId);

  return NextResponse.json({
    status,
    queued: result.jobStarted,
    missing: result.missing,
    refreshedAt,
  });
}
