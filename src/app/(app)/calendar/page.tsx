"use client";

import { useRequireAuth } from "@/lib/use-require-auth";

export default function CalendarPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading calendar…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main>
      <section>
        <p className="text-sm font-semibold text-primary">
          Planning for {user.name || user.email}
        </p>
        <h1 className="text-3xl font-semibold">Calendar</h1>
        <p className="text-base text-muted-foreground">
          The previous week-at-a-glance view relied on the Espoo suggestion
          pipeline, which has been removed. Rebuild whichever calendar
          experience you need in this file.
        </p>
        <div className="rounded-3xl bg-card p-6 text-sm text-card-foreground shadow-sm">
          <p className="text-muted-foreground">
            No events are displayed right now. Once you reintroduce your own
            event source, render it here.
          </p>
        </div>
      </section>
    </main>
  );
}
