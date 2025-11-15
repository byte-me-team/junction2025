"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import {
  MatchedSuggestion,
  SuggestionMeta,
  fetchMatchedSuggestions,
} from "@/lib/client/matched-suggestions";
import { formatConfidence, formatEventDate } from "@/lib/formatters";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";

const AUTO_REFRESH_DELAY_MS = 8000;

export default function SuggestionsPage() {
  const { user, isLoading } = useRequireAuth();
  const [suggestions, setSuggestions] = useState<MatchedSuggestion[]>([]);
  const [meta, setMeta] = useState<SuggestionMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [fetchReady, setFetchReady] = useState(false);
  const lastFetchKeyRef = useRef<string | null>(null);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasCompletedFetch, setHasCompletedFetch] = useState(false);

  useEffect(() => {
    if (!user?.email) {
      setFetchReady(false);
      lastFetchKeyRef.current = null;
      setHasCompletedFetch(false);
      setIsLoadingSuggestions(false);
      setSuggestions([]);
      setMeta(null);
      setError(null);
      setRefreshNonce(0);
      return;
    }

    setFetchReady(true);
    setRefreshNonce((value) => value + 1);
  }, [user?.email]);

  useEffect(() => {
    if (!fetchReady || !user?.email) {
      return;
    }

    const fetchKey = `${user.email}:${refreshNonce}`;
    if (lastFetchKeyRef.current === fetchKey) {
      setIsLoadingSuggestions(false);
      setHasCompletedFetch(true);
      return;
    }

    lastFetchKeyRef.current = fetchKey;
    let cancelled = false;
    let completed = false;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }

    setIsLoadingSuggestions(true);
    setError(null);

    fetchMatchedSuggestions(user.email)
      .then(({ recommendations, meta }) => {
        if (cancelled) return;
        setSuggestions(recommendations.slice(0, meta.target));
        setMeta(meta);
        if ((meta.status === "running" || meta.missing > 0) && !cancelled) {
          refreshTimeoutRef.current = setTimeout(() => {
            setRefreshNonce((value) => value + 1);
          }, AUTO_REFRESH_DELAY_MS);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof Error
            ? err.message
            : "We couldn't fetch suggestions right now."
        );
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoadingSuggestions(false);
        setHasCompletedFetch(true);
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
        <p className="text-sm text-muted-foreground">Loading suggestions…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const target = meta?.target ?? 10;
  const pendingSlots =
    typeof meta?.missing === "number"
      ? Math.max(meta.missing, 0)
      : Math.max(0, target - suggestions.length);
  const showBackfillMessage =
    (pendingSlots > 0 || meta?.status === "running") && hasCompletedFetch;
  const placeholderCount =
    meta?.status === "running" ? pendingSlots : Math.min(pendingSlots, 3);
  const showInitialSkeletons = !hasCompletedFetch && isLoadingSuggestions;

  return (
    <main className="bg-background">
      <section className="mx-auto w-full max-w-5xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Hand-picked events for {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">All Espoo suggestions</h1>
          <p className="text-base text-muted-foreground">
            We keep at least {target} Espoo events ready. Check back in a
            few seconds if this list is still filling up.
          </p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button asChild variant="secondary">
            <Link href="/dashboard">Back to dashboard</Link>
          </Button>
          {showBackfillMessage && (
            <p className="text-sm text-muted-foreground">
              {meta?.status === "running"
                ? "Loading the full list in the background. This page refreshes automatically."
                : "We’ll keep searching for more matches. Check again shortly."}
            </p>
          )}
        </div>

        {error && (
          <article className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm">
            <p className="text-sm text-destructive">{error}</p>
          </article>
        )}

        {showInitialSkeletons && (
          <div className="grid gap-4">
            {Array.from({ length: 4 }).map((_, index) => (
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
          </div>
        )}

        {!showInitialSkeletons && !error && hasCompletedFetch && (
          <div className="grid gap-4">
            {suggestions.map((suggestion) => (
              <article
                key={suggestion.id}
                className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
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
                  <div className="text-right">
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Confidence
                    </div>
                    <div className="text-sm font-semibold text-primary">
                      {formatConfidence(suggestion.confidence)}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {suggestion.reason}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  {suggestion.event.price && (
                    <span className="rounded-full border border-border px-3 py-1 text-xs">
                      {suggestion.event.price}
                    </span>
                  )}
                  {suggestion.event.sourceUrl && (
                    <Button asChild size="sm" variant="outline">
                      <a
                        href={suggestion.event.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Details
                      </a>
                    </Button>
                  )}
                </div>
              </article>
            ))}

            {suggestions.length === 0 && (
              <article className="rounded-2xl border border-dashed border-border/60 bg-card/50 p-5 shadow-sm text-sm text-muted-foreground">
                No Espoo events matched your profile yet. Please check back soon.
              </article>
            )}

            {placeholderCount > 0 &&
              Array.from({ length: placeholderCount }).map((_, index) => (
                <article
                  key={`placeholder-${index}`}
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
          </div>
        )}
      </section>
    </main>
  );
}
