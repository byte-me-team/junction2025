"use client";

import { useRequireAuth } from "@/lib/use-require-auth";
import { CalendarBoard } from "@/components/calendar-board";

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
    <main className="px-6 py-10">
      <section className="mx-auto w-full max-w-6xl space-y-8">
        <div>
          <p className="text-sm font-semibold text-primary">
            Planning for {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Calendar</h1>
          <p className="text-base text-muted-foreground">
            Create new activities, drag them between days, and log invites directly from this view.
          </p>
        </div>
        <CalendarBoard userId={user.id} />
      </section>
    </main>
  );
}
