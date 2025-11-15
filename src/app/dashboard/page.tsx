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

const LOADING_STAGES = ["Fetching data", "Sending prompt", "Awaiting response"] as const;

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
      <section className="mx-auto w-full max-w-7xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-semibold text-primary">
            Welcome back, {user.name || user.email}
          </p>
          <h1 className="text-3xl font-semibold">Your dashboard</h1>
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
            <GeneralSuggestionLab email={user.email} />
          ) : (
            <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-4 text-sm text-orange-900">
              Add an email address to your profile to unlock suggestion
              generation.
            </p>
          )}
        </section>

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

function GeneralSuggestionLab({ email }: { email: string }) {
  const [suggestions, setSuggestions] = useState<DashboardSuggestion[]>([]);
  const [relatives, setRelatives] = useState<
    { id: string; name: string; email: string }[]
  >([]);
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

  const handleCustomize = useCallback(
    async (suggestionId: string) => {
      setUpdatingId(suggestionId);
      setError(null);
      try {
        const res = await fetch(`/api/general-suggestions/${suggestionId}`, {
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
          setCustomTitle(updated.title);
          setCustomSummary(updated.summary);
          setInviteMessage(`Hey family, let's try “${updated.title}” soon!`);
          setSelectedRelatives([]);
          setModalSuggestion(updated);
        }
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUpdatingId(null);
      }
    },
    []
  );

  const showSkeleton = isGenerating || (isLoading && suggestions.length === 0);

  const toggleRelative = useCallback((relativeId: string) => {
    setSelectedRelatives((prev) =>
      prev.includes(relativeId)
        ? prev.filter((id) => id !== relativeId)
        : [...prev, relativeId]
    );
  }, []);

  const handleSendInvites = useCallback(() => {
    const chosen = relatives.filter((relative) =>
      selectedRelatives.includes(relative.id)
    );
    const summaryMessage =
      chosen.length > 0
        ? `Sent invitations to ${chosen
            .map((r) => r.name.split(" ")[0] ?? r.name)
            .join(", ")}.`
        : "Saved your invite for later.";

    setStatusNotice(summaryMessage);
    closeModal();
  }, [closeModal, relatives, selectedRelatives]);

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
                      onClick={() => handleCustomize(suggestion.id)}
                      disabled={isUpdating}
                    >
                      Let&apos;s go!
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() =>
                        setStatusNotice(
                          `Scheduled “${suggestion.title}” for tomorrow.`
                        )
                      }
                    >
                      Schedule for tomorrow
                    </Button>
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
              <Button
                className="flex-1 min-w-[150px]"
                onClick={handleSendInvites}
              >
                Send invite
              </Button>
              <Button
                variant="outline"
                className="flex-1 min-w-[150px]"
                onClick={() => {
                  setStatusNotice("Saved your invite for later.");
                  closeModal();
                }}
              >
                Save for later
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
