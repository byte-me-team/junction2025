"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";

type Suggestion = {
  id: string;
  title: string;
  reason: string;
  time: string;
  location: string;
};

const fakeSuggestionData: Suggestion[] = [
  {
    id: "1",
    title: "Slow morning walk at Tapiola Garden",
    reason: "Short route with benches every 200m and winter lights",
    time: "Tomorrow, 10:00",
    location: "Tapiola Garden",
  },
  {
    id: "2",
    title: "Community knitting circle",
    reason: "Matches your enjoy list + indoors, quiet",
    time: "Friday, 14:00",
    location: "Iso Omena Library",
  },
  {
    id: "3",
    title: "Espoo jazz matinee with granddaughter",
    reason: "Family seating + 15 min travel",
    time: "Sunday, 16:30",
    location: "Sellosali",
  },
];

const loadSuggestionsPlaceholder = async (): Promise<Suggestion[]> => {
  // TODO: Fetch from /api/v1/suggestions once the backend is available
  return Promise.resolve(fakeSuggestionData);
};

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    loadSuggestionsPlaceholder().then(setSuggestions);
  }, []);

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
            These are mock entries. When the backend lands we will hydrate them
            with live data.
          </p>
        </div>

        <div className="grid gap-4">
          {suggestions.map((suggestion) => (
            <article
              key={suggestion.id}
              className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{suggestion.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {suggestion.location} • {suggestion.time}
                  </p>
                </div>
                <Button size="sm" variant="outline">
                  Details
                </Button>
              </div>
              <p className="mt-3 text-base text-muted-foreground">
                {suggestion.reason}
              </p>
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
