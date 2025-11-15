"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

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
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Welcome back, {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Your dashboard</h1>
          <p className="text-base text-muted-foreground">
            The Espoo event matcher is being rebuilt. For now this page simply
            keeps you signed in so you can test other flows.
          </p>
        </div>

        <article className="rounded-3xl bg-card p-6 text-sm text-card-foreground shadow-sm">
          <h2 className="text-xl font-semibold">Suggestions are offline</h2>
          <p className="mt-2 text-muted-foreground">
            The old background jobs, middleware, and API endpoints were removed.
            When you reintroduce a new matching pipeline, hook it up here.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/suggestions">View placeholder list</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/calendar">Open calendar</Link>
            </Button>
          </div>
        </article>

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
