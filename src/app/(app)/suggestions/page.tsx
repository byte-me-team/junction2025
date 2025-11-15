"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, PencilLine } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRequireAuth } from "@/lib/use-require-auth";
import { logActivityHistory } from "@/lib/log-activity-history";
import { ScheduleActivityDialog } from "@/components/schedule-activity-dialog";

const LOADING_STAGES = [
  "Fetching data",
  "Sending prompt",
  "Awaiting response",
] as const;

type RelativeSummary = {
  id: string;
  name: string;
  email: string;
};

type CityEvent = {
  id: string;
  title: string;
  description: string;
  locationName: string;
  startTime?: string | null;
  endTime?: string | null;
  infoUrl?: string | null;
};

type DashboardSuggestion = {
  id: string;
  title: string;
  summary: string;
  benefit: string;
  metadata?: Record<string, string>;
  accepted: boolean;
  status: "pending" | "accepted" | "rejected";
  createdAt: string;
  decisionAt?: string | null;
};

export default function SuggestionsPage() {
  const { user, isLoading } = useRequireAuth();
  const [relatives, setRelatives] = useState<RelativeSummary[]>([]);

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading suggestions…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main className="bg-background">
      <section className="px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Suggestions for {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">AI-powered suggestions</h1>
          <p className="text-base text-muted-foreground">
            Experiment with our prompt-based activity generator and live event
            feeds. Customize anything before sharing it with relatives.
          </p>
        </div>

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Fresh ideas to nudge you outside
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Generate three activity prompts tailored to your hobbies. Pick your
            favorite and we&apos;ll mark it as today&apos;s plan.
          </p>
          {user.email ? (
            <GeneralSuggestionLab
              email={user.email}
              relatives={relatives}
              setRelatives={setRelatives}
            />
          ) : (
            <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              Add an email address to your profile to unlock suggestion
              generation.
            </p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="text-2xl font-semibold">
            Real events happening this week
          </h2>
          <p className="mt-2 text-base text-muted-foreground">
            Pull live events from Espoo using the Linked Events API. Use the
            invite flow to loop in your relatives.
          </p>
          {user.email ? (
            <RealEventsLab
              email={user.email}
              relatives={relatives}
              setRelatives={setRelatives}
              city={user.city}
            />
          ) : null}
        </section>
      </section>
    </main>
  );
}

function GeneralSuggestionLab({
  email,
  relatives,
  setRelatives,
}: {
  email: string;
  relatives: RelativeSummary[];
  setRelatives: (relatives: RelativeSummary[]) => void;
}) {
  const [suggestions, setSuggestions] = useState<DashboardSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [modalSuggestion, setModalSuggestion] =
    useState<DashboardSuggestion | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [selectedRelatives, setSelectedRelatives] = useState<string[]>([]);
  const [activeStage, setActiveStage] = useState(0);

  const selectedId = useMemo(
    () => suggestions.find((s) => s.accepted)?.id ?? null,
    [suggestions]
  );

  const resetCustomization = useCallback(() => {
    setCustomTitle("");
    setCustomSummary("");
    setInviteMessage("");
    setSelectedRelatives([]);
  }, []);

  const closeModal = useCallback(() => {
    setModalSuggestion(null);
    resetCustomization();
  }, [resetCustomization]);

  const loadSuggestions = useCallback(async () => {
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/general-suggestions?email=${encodeURIComponent(email)}`
      );
      const payload = (await res.json().catch(() => null)) as
        | {
            suggestions?: DashboardSuggestion[];
            relatives?: { id: string; name: string; email: string }[];
            error?: string;
          }
        | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Unable to load suggestions");
      }
      setSuggestions(payload?.suggestions ?? []);
      setRelatives(payload?.relatives ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [email]);

  useEffect(() => {
    loadSuggestions();
  }, [loadSuggestions]);

  useEffect(() => {
    if (!isGenerating) {
      setActiveStage(0);
      return;
    }

    const timer = setInterval(() => {
      setActiveStage((prevStage) => (prevStage + 1) % LOADING_STAGES.length);
    }, 1400);

    return () => clearInterval(timer);
  }, [isGenerating]);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => setStatusNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  const generateSuggestions = useCallback(async () => {
    if (!email) return;

    setIsGenerating(true);
    setError(null);
    closeModal();
    try {
      const res = await fetch("/api/general-suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            suggestions?: DashboardSuggestion[];
            relatives?: { id: string; name: string; email: string }[];
            error?: string;
          }
        | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to generate suggestions");
      }
      setSuggestions(payload?.suggestions ?? []);
      if (payload?.relatives) {
        setRelatives(payload.relatives);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsGenerating(false);
    }
  }, [email, closeModal]);

  const handleCustomize = useCallback((suggestion: DashboardSuggestion) => {
    setCustomTitle(suggestion.title);
    setCustomSummary(suggestion.summary);
    setInviteMessage(`Hey family, let's try “${suggestion.title}” soon!`);
    setSelectedRelatives([]);
    setModalSuggestion(suggestion);
  }, []);

  const showSkeleton = isGenerating || (isLoading && suggestions.length === 0);

  const toggleRelative = useCallback((relativeId: string) => {
    setSelectedRelatives((prev) =>
      prev.includes(relativeId)
        ? prev.filter((id) => id !== relativeId)
        : [...prev, relativeId]
    );
  }, []);

  const handleSendInvites = useCallback(async () => {
    if (!modalSuggestion) return;
    const chosen = relatives.filter((relative) =>
      selectedRelatives.includes(relative.id)
    );
    const partnerNames = chosen.length
      ? chosen.map((r) => r.name.split(" ")[0] ?? r.name).join(", ")
      : undefined;
    const summaryMessage = partnerNames
      ? `Sent invitations to ${partnerNames}.`
      : "Saved your invite for later.";

    try {
      setUpdatingId(modalSuggestion.id);
      const res = await fetch(`/api/general-suggestions/${modalSuggestion.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accepted: true }),
      });
      const payload = (await res.json().catch(() => null)) as
        | { suggestion?: DashboardSuggestion; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Unable to update choice");
      }
      const updated = payload?.suggestion;
      if (updated) {
        setSuggestions((prev) =>
          prev.map((item) =>
            item.id === updated.id
              ? { ...item, accepted: true }
              : { ...item, accepted: false }
          )
        );
      }
      await logActivityHistory({
        title: customTitle || modalSuggestion.title,
        description: customSummary || modalSuggestion.summary,
        source: "suggestion",
        partnerName: partnerNames,
        metadata: modalSuggestion.metadata,
      });
      setStatusNotice(summaryMessage);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdatingId(null);
      closeModal();
    }
  }, [closeModal, customSummary, customTitle, modalSuggestion, relatives, selectedRelatives]);

  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-border/60 bg-card/50 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating}
        >
          {isGenerating ? "Thinking…" : "Generate 3 suggestions"}
        </Button>
        <Button
          variant="outline"
          onClick={loadSuggestions}
          disabled={isLoading}
        >
          {isLoading ? "Refreshing…" : "Reload existing"}
        </Button>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : statusNotice ? (
          <p className="text-sm text-emerald-600">{statusNotice}</p>
        ) : suggestions.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Tap an idea to start customizing your invite.
          </p>
        ) : null}
      </div>

      {showSkeleton ? (
        <SimpleLoadingState
          isGenerating={isGenerating}
          activeStage={activeStage}
        />
      ) : suggestions.length === 0 ? (
        <HintNotice />
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {suggestions.slice(0, 3).map((suggestion) => {
            const isSelected = suggestion.id === selectedId;
            const isUpdating = updatingId === suggestion.id;
            const statusLabel =
              suggestion.status === "accepted"
                ? "Accepted"
                : suggestion.status === "pending"
                  ? "New idea"
                  : "Rejected";
            const tags = [
              suggestion.metadata?.mood && `Mood: ${suggestion.metadata.mood}`,
              suggestion.metadata?.ideal_time &&
                `Best time: ${suggestion.metadata.ideal_time}`,
              suggestion.metadata?.companion_tip &&
                `Companion tip: ${suggestion.metadata.companion_tip}`,
            ].filter(Boolean) as string[];

            return (
              <Card
                key={suggestion.id}
                className={`flex h-full flex-col bg-muted/30 ${
                  isSelected
                    ? "border-primary shadow-lg shadow-primary/30"
                    : "border-border/70"
                }`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg">
                      {suggestion.title}
                    </CardTitle>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        suggestion.status === "accepted"
                          ? "bg-primary/10 text-primary"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <CardDescription>{suggestion.summary}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-foreground">
                    Why:{" "}
                    <span className="font-normal text-muted-foreground">
                      {suggestion.benefit}
                    </span>
                  </p>
                  {tags.length > 0 && (
                    <ul className="mt-4 space-y-1 text-xs text-muted-foreground">
                      {tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-muted px-3 py-1">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
                <CardFooter className="mt-auto w-full flex-col items-start gap-4">
                  <div className="flex w-full flex-wrap items-center justify-between text-xs text-muted-foreground">
                    <p className="font-medium">
                      {new Date(suggestion.createdAt).toLocaleDateString()}
                    </p>
                    <p>
                      {suggestion.status === "accepted"
                        ? "Already approved"
                        : "Awaiting action"}
                    </p>
                  </div>
                  <div className="flex w-full flex-wrap gap-2">
                    <Button
                      className="flex-1"
                      onClick={() => handleCustomize(suggestion)}
                      disabled={isUpdating}
                    >
                      Let&apos;s go!
                    </Button>
                    <ScheduleActivityDialog
                      triggerLabel="Schedule"
                      defaultTitle={suggestion.title}
                      defaultDescription={suggestion.summary}
                      relatives={relatives}
                      source="suggestion"
                      sourceId={suggestion.id}
                      triggerVariant="outline"
                      triggerSize="default"
                      triggerClassName="flex-1"
                      onScheduled={() =>
                        setStatusNotice(`Scheduled “${suggestion.title}” in your calendar.`)
                      }
                    />
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}

      {modalSuggestion ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[32px] bg-background p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-primary">
                  Craft your invite
                </p>
                <h3 className="text-3xl font-semibold">
                  {modalSuggestion.title}
                </h3>
              </div>
              <button
                className="text-base text-muted-foreground"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-medium text-foreground">
                  <PencilLine className="h-4 w-4 text-primary" />
                  Plan title
                </label>
                <input
                  className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-lg font-semibold"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-medium text-foreground">
                  <PencilLine className="h-4 w-4 text-primary" />
                  Short description
                </label>
                <input
                  className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
                  value={customSummary}
                  onChange={(event) => setCustomSummary(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/60 p-5 text-base">
              <p className="font-semibold text-foreground">Invite message</p>
              <p className="mt-2 text-muted-foreground">
                Add a short note so it feels like it&apos;s coming directly from
                you.
              </p>
              <textarea
                className="mt-4 min-h-[140px] w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder='e.g. "Hey grandkids, want to try this with me tomorrow?"'
              />
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-base font-medium text-foreground">
                Invite relatives
              </label>
              {relatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t added any relatives yet. Add some to invite
                  them next time.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {relatives.map((relative) => {
                    const isSelected = selectedRelatives.includes(relative.id);
                    return (
                      <button
                        key={relative.id}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                        onClick={() => toggleRelative(relative.id)}
                      >
                        {relative.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Select one or more contacts. We&apos;ll email them using the
    message above.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="flex-1 min-w-[150px]" onClick={handleSendInvites}>
                Send invite
              </Button>
              <Button
                variant="ghost"
                className="flex-1 min-w-[150px]"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function HintNotice() {
  return (
    <div className="rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
      No suggestions yet. Generate a trio of tailored ideas to kick things off.
    </div>
  );
}

function SimpleLoadingState({
  isGenerating,
  activeStage,
}: {
  isGenerating: boolean;
  activeStage: number;
}) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/70 p-6">
      <div className="flex items-center gap-3">
        <Loader2
          className={`h-5 w-5 ${
            isGenerating ? "animate-spin text-primary" : "text-muted-foreground"
          }`}
        />
        <p className="text-sm font-medium text-muted-foreground">
          {isGenerating
            ? "Generating tailored activities..."
            : "Loading your saved suggestions..."}
        </p>
      </div>
      {isGenerating && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {LOADING_STAGES.map((stage, index) => (
            <span
              key={stage}
              className={`rounded-full border px-3 py-1 ${
                index === activeStage
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border bg-muted text-muted-foreground"
              }`}
            >
              {stage}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function RealEventsLab({
  email,
  relatives,
  setRelatives,
  city,
}: {
  email: string;
  relatives: RelativeSummary[];
  setRelatives: (relatives: RelativeSummary[]) => void;
  city?: string | null;
}) {
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);
  const [modalEvent, setModalEvent] = useState<CityEvent | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [selectedRelatives, setSelectedRelatives] = useState<string[]>([]);

  const closeModal = useCallback(() => {
    setModalEvent(null);
    setCustomTitle("");
    setCustomSummary("");
    setInviteMessage("");
    setSelectedRelatives([]);
  }, []);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => setStatusNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  const fetchEvents = useCallback(async () => {
    if (!email) return;

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/event-recommendations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const payload = (await res.json().catch(() => null)) as
        | {
            events?: CityEvent[];
            relatives?: RelativeSummary[];
            error?: string;
          }
        | null;
      if (!res.ok) {
        throw new Error(payload?.error ?? "Failed to load events");
      }
      setEvents(payload?.events ?? []);
      if (payload?.relatives) {
        setRelatives(payload.relatives);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [email, setRelatives]);

  const handleCustomize = useCallback(
    (event: CityEvent) => {
      setModalEvent(event);
      setCustomTitle(event.title);
      setCustomSummary(event.description);
      setInviteMessage(
        `Hi family, there is a “${event.title}” today in ${event.locationName}. Want to join me?`
      );
      setSelectedRelatives([]);
    },
    []
  );

  const toggleRelative = useCallback((id: string) => {
    setSelectedRelatives((prev) =>
      prev.includes(id) ? prev.filter((rid) => rid !== id) : [...prev, id]
    );
  }, []);

  const handleSendInvites = useCallback(async () => {
    if (!modalEvent) return;
    const count = selectedRelatives.length;
    await logActivityHistory({
      title: customTitle || modalEvent.title,
      description: customSummary || modalEvent.description,
      source: "real_event",
      partnerName:
        count > 0
          ? `${count} relative${count === 1 ? "" : "s"}`
          : undefined,
      metadata: {
        location: modalEvent.locationName,
        startTime: modalEvent.startTime,
      },
    });
    setStatusNotice(
      count > 0
        ? `Sent invitation to ${count} relative${count === 1 ? "" : "s"}.`
        : "Saved your invite for later."
    );
    closeModal();
  }, [closeModal, customSummary, customTitle, modalEvent, selectedRelatives]);

  const cityLabel = city?.length ? city : "your city";

  return (
    <div className="mt-6 space-y-4 rounded-3xl border border-border/60 bg-card/50 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={fetchEvents} disabled={isLoading}>
          {isLoading ? "Fetching…" : `Find events in ${cityLabel}`}
        </Button>
        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : statusNotice ? (
          <p className="text-sm text-emerald-600">{statusNotice}</p>
        ) : events.length > 0 ? (
          <p className="text-sm text-muted-foreground">
            Tap “Let’s go!” to personalize an invite.
          </p>
        ) : null}
      </div>

      {events.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-muted-foreground/40 p-6 text-sm text-muted-foreground">
          No live events for this week in {cityLabel}. Try fetching again later
          or broaden your interests.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} className="flex h-full flex-col bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{event.title}</CardTitle>
                <CardDescription>{event.locationName}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {event.description || "Details coming soon."}
                </p>
                <p className="mt-3 text-xs text-muted-foreground">
                  {event.startTime
                    ? new Date(event.startTime).toLocaleString()
                    : "Time TBD"}
                </p>
              </CardContent>
              <CardFooter className="mt-auto w-full flex-col items-start gap-3">
                <div className="flex w-full flex-wrap gap-2">
                  <Button className="flex-1" onClick={() => handleCustomize(event)}>
                    Let&apos;s go!
                  </Button>
                  <ScheduleActivityDialog
                    triggerLabel="Schedule"
                    defaultTitle={event.title}
                    defaultDescription={event.description || undefined}
                    relatives={relatives}
                    source="real_event"
                    sourceId={event.id}
                    triggerVariant="outline"
                    triggerSize="default"
                    triggerClassName="flex-1"
                    onScheduled={() =>
                      setStatusNotice(`Scheduled “${event.title}” in your calendar.`)
                    }
                  />
                </div>
                {event.infoUrl ? (
                  <Button
                    asChild
                    variant="outline"
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <a
                      href={event.infoUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View details
                      <span aria-hidden className="text-base">↗</span>
                    </a>
                  </Button>
                ) : null}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {modalEvent ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-3xl rounded-[32px] bg-background p-8 shadow-2xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-base font-semibold text-primary">
                  Craft your invite
                </p>
                <h3 className="text-3xl font-semibold">{modalEvent.title}</h3>
              </div>
              <button
                className="text-base text-muted-foreground"
                onClick={closeModal}
              >
                Close
              </button>
            </div>

            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-medium text-foreground">
                  <PencilLine className="h-4 w-4 text-primary" />
                  Plan title
                </label>
                <input
                  className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-lg font-semibold"
                  value={customTitle}
                  onChange={(event) => setCustomTitle(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-base font-medium text-foreground">
                  <PencilLine className="h-4 w-4 text-primary" />
                  Short description
                </label>
                <input
                  className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
                  value={customSummary}
                  onChange={(event) => setCustomSummary(event.target.value)}
                />
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-muted/60 p-5 text-base">
              <p className="font-semibold text-foreground">Invite message</p>
              <textarea
                className="mt-4 min-h-[140px] w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
              />
            </div>

            <div className="mt-6 space-y-3">
              <label className="text-base font-medium text-foreground">
                Invite relatives
              </label>
              {relatives.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Add relatives to your profile to send invites.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {relatives.map((relative) => {
                    const isSelected = selectedRelatives.includes(relative.id);
                    return (
                      <button
                        key={relative.id}
                        type="button"
                        className={`rounded-full border px-4 py-2 text-sm transition ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted text-muted-foreground"
                        }`}
                        onClick={() => toggleRelative(relative.id)}
                      >
                        {relative.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button className="flex-1 min-w-[150px]" onClick={handleSendInvites}>
                Send invite
              </Button>
              <Button
                variant="ghost"
                className="flex-1 min-w-[150px]"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
