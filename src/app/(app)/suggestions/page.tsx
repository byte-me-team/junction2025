"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function SuggestionsPage() {
  const { user, isLoading } = useRequireAuth();

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

  return (
    <main className="bg-background">
      <section className="mx-auto w-full max-w-4xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Suggestions for {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Event suggestions</h1>
          <p className="text-base text-muted-foreground">
            This page is intentionally blank while the matching engine is being
            redesigned. Hook up your new API here.
          </p>
        </div>

        <article className="rounded-3xl bg-card p-6 text-sm text-card-foreground shadow-sm">
          <p className="text-muted-foreground">
            Remove this placeholder once you have a new pipeline. Until then,
            nothing is fetched from the Espoo API or Featherless.
          </p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </article>
      </section>
    </main>
  );
}
