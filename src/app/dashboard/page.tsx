"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";

type EventRecommendation = {
  event_id: string;
  title: string;
  reason: string;
  confidence: number;
  event: {
    title: string;
    summary: string | null;
    startTime: string;
    endTime: string | null;
    location: string | null;
    price: string | null;
    sourceUrl: string | null;
  };
};

async function fetchEspooSuggestions(
  email: string
): Promise<EventRecommendation[]> {
  const response = await fetch("/api/espoo-suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to load suggestions");
  }

  const json = (await response.json()) as {
    recommendations: EventRecommendation[];
  };

  return [...json.recommendations].sort(
    (a, b) => b.confidence - a.confidence
  );
}

const formatDate = (input: string) => {
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatConfidence = (value: number) => {
  if (!Number.isFinite(value)) return "--";
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}% match`;
};

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const [eventSuggestions, setEventSuggestions] = useState<EventRecommendation[]>([]);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    if (!user?.email) return;

    let cancelled = false;
    setIsLoadingSuggestions(true);
    setSuggestionError(null);
    fetchEspooSuggestions(user.email)
      .then((data) => {
        if (cancelled) return;
        setEventSuggestions(data.slice(0, 3));
      })
      .catch((error) => {
        if (cancelled) return;
        setSuggestionError(
          error instanceof Error
            ? error.message
            : "We couldn't fetch events right now."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingSuggestions(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user?.email]);

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="bg-background">
      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 space-y-1">
          <p className="text-sm font-semibold text-primary">
            Welcome back, {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Your upcoming suggestions</h1>
          <p className="text-base text-muted-foreground">
            Hand-picked events happening around Espoo based on your onboarding
            profile.
          </p>
        </div>
        <div className="grid gap-4">
          {isLoadingSuggestions &&
            Array.from({ length: 3 }).map((_, index) => (
              <article
                key={`skeleton-${index}`}
                className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm animate-pulse"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="skeleton-shimmer h-5 w-48 rounded" />
                    <div className="skeleton-shimmer h-3 w-32 rounded" />
                  </div>
                  <div className="skeleton-shimmer h-8 w-20 rounded" />
                </div>
                <div className="mt-4 skeleton-shimmer h-4 w-full rounded" />
                <div className="mt-2 skeleton-shimmer h-3 w-24 rounded" />
              </article>
            ))}

          {suggestionError && (
            <article className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
              <p className="text-sm text-destructive">
                {suggestionError}
              </p>
            </article>
          )}

          {!isLoadingSuggestions &&
            !suggestionError &&
            eventSuggestions.length === 0 && (
              <article className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  No Espoo events matched your profile in the next few days. Check
                  back soon!
                </p>
              </article>
            )}

          {eventSuggestions.map((suggestion) => (
            <article
              key={suggestion.event_id}
              className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {suggestion.event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(suggestion.event.startTime)}
                    {suggestion.event.location
                      ? ` • ${suggestion.event.location}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Confidence
                  </div>
                  <div className="text-sm font-semibold text-primary">
                    {formatConfidence(suggestion.confidence)}
                  </div>
                  {suggestion.event.sourceUrl ? (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={suggestion.event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Details
                      </a>
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Details
                    </Button>
                  )}
                </div>
              </div>
              <p className="mt-3 text-base text-muted-foreground">
                {suggestion.reason}
              </p>
              {suggestion.event.price && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Price: {suggestion.event.price}
                </p>
              )}
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <div
            id="invite"
            className="rounded-2xl border border-dashed border-primary/40 p-5"
          >
            <h3 className="text-xl font-semibold">Invite a relative</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Soon you will be able to share a link for shared onboarding. For
              now this is just a placeholder section.
            </p>
            <Button asChild variant="outline" className="mt-4">
            <Link href="/invite" className="font-medium text-primary">
              Generate invite link
            </Link>
          </Button>
          </div>
          <div
            id="reminders"
            className="rounded-2xl border border-border/80 bg-card/80 p-5"
          >
            <h3 className="text-xl font-semibold">Daily reminders</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Once suggestions go live, this block will summarize which nudges you
              have acknowledged. Hook it up to /api/v1/profile later.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
