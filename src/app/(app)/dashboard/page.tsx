"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main>
      <section className="px-6 py-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-primary">
            Welcome back, {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Your dashboard</h1>
          <p className="text-base text-muted-foreground">
            We&apos;re refreshing this view. For now, head to the suggestions lab
            to play with AI-generated plans and real events.
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/suggestions">Open suggestions</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/invite">Invite relatives</Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
