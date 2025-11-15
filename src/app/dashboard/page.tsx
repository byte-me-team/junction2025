"use client";

import Link from "next/link";
<<<<<<< HEAD
import { useCallback, useEffect, useRef, useState } from "react";
import {
  MatchedSuggestion,
  SuggestionMeta,
  fetchMatchedSuggestions,
  markSuggestionAttendance,
} from "@/lib/client/matched-suggestions";
=======
import { useEffect, useRef, useState } from "react";
>>>>>>> main
import { useRequireAuth } from "@/lib/use-require-auth";
import { formatConfidence, formatEventDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";


const DASHBOARD_VISIBLE_COUNT = 3;
const AUTO_REFRESH_DELAY_MS = 8000;

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const [eventSuggestions, setEventSuggestions] = useState<MatchedSuggestion[]>([]);
  const [meta, setMeta] = useState<SuggestionMeta | null>(null);
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [hasCompletedSuggestionsFetch, setHasCompletedSuggestionsFetch] = useState(false);
  const lastFetchKeyRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [fetchReady, setFetchReady] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.email) {
      setFetchReady(false);
      lastFetchKeyRef.current = null;
      setIsLoadingSuggestions(false);
      setHasCompletedSuggestionsFetch(false);
      setEventSuggestions([]);
      setMeta(null);
      setSuggestionError(null);
      setRefreshNonce(0);
      return;
    }

    setFetchReady(true);
    setRefreshNonce((value) => value + 1);
  }, [user?.email]);

  const handleToggleGoing = useCallback(
    async (suggestion: MatchedSuggestion) => {
      try {
        setActioningId(suggestion.id);
        await markSuggestionAttendance(suggestion.id, !suggestion.isGoing);
        setRefreshNonce((value) => value + 1);
      } catch (error) {
        setSuggestionError(
          error instanceof Error
            ? error.message
            : "Failed to update selection."
        );
      } finally {
        setActioningId(null);
      }
    },
    []
  );

  useEffect(() => {
    if (!fetchReady || !user?.email) {
      return;
    }

    const fetchKey = `${user.email}:${refreshNonce}`;
    if (lastFetchKeyRef.current === fetchKey) {
      setIsLoadingSuggestions(false);
      setHasCompletedSuggestionsFetch(true);
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    setHasCompletedSuggestionsFetch(false);

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    let cancelled = false;
    let completed = false;
    setIsLoadingSuggestions(true);
    setSuggestionError(null);
    fetchMatchedSuggestions(user.email)
      .then(({ recommendations, meta }) => {
        if (cancelled) return;
        setEventSuggestions(recommendations.slice(0, DASHBOARD_VISIBLE_COUNT));
        setMeta(meta);
        if ((meta.status === "running" || meta.missing > 0) && !cancelled) {
          refreshTimeoutRef.current = setTimeout(() => {
            setRefreshNonce((value) => value + 1);
          }, AUTO_REFRESH_DELAY_MS);
        }
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
        setHasCompletedSuggestionsFetch(true);
        completed = true;
      });

    return () => {
      cancelled = true;
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (!completed && lastFetchKeyRef.current === fetchKey) {
        lastFetchKeyRef.current = null;
      }
    };
  }, [fetchReady, user?.email, refreshNonce]);

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
            Hand-picked events happening around Espoo based on your onboarding profile.
          </p>
          {meta?.status === "running" && (
            <p className="text-sm text-muted-foreground">
              Refreshing your matches in the background. This list updates automatically.
            </p>
          )}
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
            hasCompletedSuggestionsFetch &&
            eventSuggestions.length === 0 && (
              <article className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  No Espoo events matched your profile in the next few days. Check
                  back soon!
                </p>
              </article>
            )}

          {eventSuggestions.map((suggestion) => {
            const cardClass = `rounded-2xl border p-5 shadow-sm ${
              suggestion.isGoing
                ? "border-primary bg-primary/10"
                : "border-border bg-card/70"
            }`;
            return (
            <article
              key={suggestion.id}
              className={cardClass}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    {suggestion.event.title}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {formatEventDate(suggestion.event.startTime)}
                    {suggestion.event.location
                      ? ` • ${suggestion.event.location}`
                      : ""}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 text-right">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Confidence
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {formatConfidence(suggestion.confidence)}
                    </div>
                  </div>
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant={suggestion.isGoing ? "default" : "outline"}
                      onClick={() => handleToggleGoing(suggestion)}
                      disabled={actioningId === suggestion.id}
                    >
                      {suggestion.isGoing ? "Going" : "I'm going"}
                    </Button>
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
              </div>
              {suggestion.event.price && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Price: {suggestion.event.price}
                </p>
              )}
              {suggestion.isGoing && (
                <p className="mt-2 text-xs italic text-muted-foreground">
                  Invite a relative to join this outing (coming soon).
                </p>
              )}
            </article>
          )})}

          <div className="pt-2">
            <Button asChild variant="secondary">
              <Link href="/suggestions">See more suggestions</Link>
            </Button>
          </div>
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
