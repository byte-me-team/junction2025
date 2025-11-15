import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const INTERNAL_TOKEN =
  process.env.MATCHED_SUGGESTION_GATEWAY_TOKEN ??
  process.env.NEXTAUTH_SECRET ??
  "";

const STATE_COOKIE_NAME = "ms-state";
const ENSURE_CACHE_MS = Math.max(
  0,
  Number(process.env.MATCHED_SUGGESTION_ENSURE_CACHE_MS ?? "5000")
);

type SuggestionState = {
  status?: string;
  missing?: number;
  refreshedAt?: number | null;
  ensuredAt: number;
  userId: string;
};

function applySuggestionState(
  headers: Headers,
  state: Partial<SuggestionState>
) {
  if (state.status) {
    headers.set("x-matched-suggestions-status", state.status);
  }
  if (typeof state.missing === "number") {
    headers.set("x-matched-suggestions-missing", state.missing.toString());
  }
  if (typeof state.refreshedAt === "number") {
    headers.set(
      "x-matched-suggestions-refreshed",
      state.refreshedAt.toString()
    );
  }
}

function parseStateCookie(value?: string | null): SuggestionState | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as SuggestionState;
    if (
      typeof parsed.userId === "string" &&
      typeof parsed.ensuredAt === "number"
    ) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export async function middleware(request: NextRequest) {
  const forwardedHeaders = new Headers(request.headers);
  const buildResponse = () =>
    NextResponse.next({
      request: {
        headers: forwardedHeaders,
      },
    });

  if (!INTERNAL_TOKEN) {
    return buildResponse();
  }

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });
  const userId = (token?.id as string) ?? null;

  const cachedState = parseStateCookie(
    request.cookies.get(STATE_COOKIE_NAME)?.value
  );

  if (!userId) {
    if (cachedState) {
      const res = buildResponse();
      res.cookies.delete(STATE_COOKIE_NAME);
      return res;
    }
    return buildResponse();
  }

  const now = Date.now();
  if (
    cachedState &&
    cachedState.userId === userId &&
    now - cachedState.ensuredAt < ENSURE_CACHE_MS
  ) {
    applySuggestionState(forwardedHeaders, cachedState);
    return buildResponse();
  }

  try {
    const ensureUrl = new URL(
      "/api/internal/suggestions/ensure",
      request.url
    );
    const ensureResponse = await fetch(ensureUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-matched-suggestions-internal": INTERNAL_TOKEN,
      },
      body: JSON.stringify({ userId }),
      cache: "no-store",
    });

    if (ensureResponse.ok) {
      const payload = (await ensureResponse.json().catch(() => null)) as
        | {
            status?: string;
            missing?: number;
            refreshedAt?: number | null;
          }
        | null;
      const state: SuggestionState = {
        status: payload?.status ?? "idle",
        missing:
          typeof payload?.missing === "number" ? payload.missing : undefined,
        refreshedAt:
          typeof payload?.refreshedAt === "number"
            ? payload.refreshedAt
            : null,
        ensuredAt: now,
        userId,
      };
      applySuggestionState(forwardedHeaders, state);
      const res = buildResponse();
      res.cookies.set(STATE_COOKIE_NAME, JSON.stringify(state), {
        path: "/",
        maxAge: 60,
        httpOnly: true,
        sameSite: "lax",
      });
      return res;
    }
  } catch (error) {
    console.error(
      "[MatchedSuggestions][middleware] Failed to ensure suggestions",
      error
    );
  }

  return buildResponse();
}

export const config = {
  matcher: [
    "/((?!api/internal/suggestions/ensure|api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
