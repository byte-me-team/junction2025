"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, PencilLine, XCircle } from "lucide-react";
import { logActivityHistory } from "@/lib/log-activity-history";
import { ScheduleActivityDialog } from "@/components/schedule-activity-dialog";

type ActivitySuggestion = {
  title: string;
  description: string;
  location: string;
  possible_date: string;
};

type MatchStatus = "idle" | "loading" | "ready" | "error";

export default function CreateMatchModal({
  userId,
  relativeId,
  relativeName,
}: {
  userId: string;
  relativeId: string;
  relativeName: string;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [status, setStatus] = useState<MatchStatus>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [activities, setActivities] = useState<ActivitySuggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customSummary, setCustomSummary] = useState("");
  const [inviteMessage, setInviteMessage] = useState("");
  const [statusNotice, setStatusNotice] = useState("");
  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);

  const selectedActivity = useMemo(() => {
    if (selectedIndex === null) return null;
    return activities[selectedIndex] ?? null;
  }, [activities, selectedIndex]);

  useEffect(() => {
    if (!statusNotice) return;
    const timer = setTimeout(() => setStatusNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [statusNotice]);

  useEffect(() => {
    if (!selectedActivity && isCustomizeOpen) {
      setIsCustomizeOpen(false);
    }
  }, [isCustomizeOpen, selectedActivity]);

  function resetState() {
    setStatus("idle");
    setErrorMessage("");
    setActivities([]);
    setSelectedIndex(null);
    setCustomTitle("");
    setCustomSummary("");
    setInviteMessage("");
    setStatusNotice("");
    setIsCustomizeOpen(false);
  }

  function closePanel() {
    setPanelOpen(false);
    resetState();
  }

  function handleCustomize(index: number) {
    const activity = activities[index];
    if (!activity) return;

    setSelectedIndex(index);
    setCustomTitle(activity.title);
    setCustomSummary(activity.description);
    setInviteMessage(`Hey! Want to try “${activity.title}” together soon?`);
    setIsCustomizeOpen(true);
  }

  async function handleSendInvite() {
    if (!selectedActivity) return;
    const name = customTitle || selectedActivity.title;
    await logActivityHistory({
      title: name,
      description: customSummary || selectedActivity.description,
      source: "relative",
      partnerName: relativeName,
      metadata: { relativeId },
    });
    setStatusNotice(`Invite queued for “${name}”.`);
    setIsCustomizeOpen(false);
  }

  async function handleCreateMatch() {
    setStatus("loading");
    setErrorMessage("");
    setActivities([]);
    setSelectedIndex(null);
    setStatusNotice("");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, relativeId }),
      });

      const payload = (await res.json().catch(() => null)) as
        | {
            id?: string;
            matchId?: string;
            error?: string;
            suggestionsJson?: { activities?: ActivitySuggestion[] };
            activities?: ActivitySuggestion[];
          }
        | null;

      if (!res.ok) {
        throw new Error(payload?.error ?? "Unable to create a match");
      }

      const createdMatchId = payload?.id ?? payload?.matchId ?? null;
      const query = new URLSearchParams({
        userId,
        relativeId,
      });

      if (createdMatchId) {
        query.set("matchId", createdMatchId);
      }

      const followupRes = await fetch(`/api/match?${query.toString()}`);
      const followPayload = await followupRes.json().catch(() => null);
      if (!followupRes.ok) {
        throw new Error(
          (followPayload as { error?: string } | null)?.error ??
            "Unable to load match suggestions"
        );
      }

      const suggestions = extractActivities(followPayload);

      if (suggestions.length === 0) {
        throw new Error("No activities were returned for this match");
      }

      const nextActivities = suggestions.slice(0, 3);
      setActivities(nextActivities);
      setSelectedIndex(null);
      setCustomTitle("");
      setCustomSummary("");
      setInviteMessage("");
      setStatus("ready");
    } catch (err) {
      console.error(err);
      setStatus("error");
      const message =
        err instanceof Error && err.message.includes("Featherless")
          ? "Service temporarily unavailable. Please try again in a moment."
          : err instanceof Error
            ? err.message
            : "Something went wrong";
      setErrorMessage(message);
    }
  }

  return (
    <>
      <div className="flex min-w-[140px] justify-end shrink-0">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            if (panelOpen) {
              closePanel();
              return;
            }
            resetState();
            setPanelOpen(true);
          }}
        >
          Hang out!
        </Button>
      </div>

      {panelOpen && (
        <div className="basis-full w-full mt-4 rounded-3xl border border-border/70 bg-card/60 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-primary">
                Plan something fun together
              </p>
              <p className="text-sm text-muted-foreground">
                We&apos;ll suggest three doable ideas you can tweak before sending.
              </p>
              <p className="text-sm text-muted-foreground">
                Click an idea to customize and send your invite.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {status === "ready" && (
                <Button size="sm" variant="outline" onClick={handleCreateMatch}>
                  Regenerate
                </Button>
              )}
              <Button size="sm" variant="ghost" onClick={closePanel}>
                Close
              </Button>
            </div>
          </div>

          {status === "idle" && (
            <div className="flex flex-col items-center gap-4 p-4 text-center">
              <p className="text-sm text-muted-foreground">
                We&apos;ll save this match, talk to the AI, and surface a trio of
                conversation-ready ideas.
              </p>
              <Button onClick={handleCreateMatch}>Generate 3 ideas</Button>
            </div>
          )}

          {status === "loading" && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <Loader2 className="h-9 w-9 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Finding shared interests and asking the AI for activities…
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-center">
              <XCircle className="h-8 w-8 text-destructive" />
              <p className="text-sm text-muted-foreground">
                {errorMessage || "Please try again."}
              </p>
              <Button variant="outline" onClick={handleCreateMatch}>
                Try again
              </Button>
            </div>
          )}

          {status === "ready" && (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                {statusNotice ? (
                  <p className="text-sm text-emerald-600">{statusNotice}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Click an idea below to customize and send your invite.
                  </p>
                )}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {activities.map((activity, index) => {
                  const isSelected = index === selectedIndex;
                  return (
                    <Card
                      key={`${activity.title}-${index}`}
                      className={`flex h-full flex-col bg-muted/30 ${
                        isSelected
                          ? "border-primary shadow-lg shadow-primary/30"
                          : "border-border/70"
                      }`}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">
                            {activity.title}
                          </CardTitle>
                          {isSelected && (
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                              Selected
                            </span>
                          )}
                        </div>
                        <CardDescription>{activity.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <p>
                          <span className="font-semibold text-foreground">
                            Location:
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {activity.location || "Flexible"}
                          </span>
                        </p>
                        <p>
                          <span className="font-semibold text-foreground">
                            Ideal time:
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {formatDate(activity.possible_date)}
                          </span>
                        </p>
                      </CardContent>
                      <CardFooter className="mt-auto flex flex-col gap-2">
                        <Button className="w-full" onClick={() => handleCustomize(index)}>
                          Let&apos;s go!
                        </Button>
                        <ScheduleActivityDialog
                          triggerLabel="Schedule"
                          defaultTitle={activity.title}
                          defaultDescription={activity.description}
                          defaultPartner={relativeName}
                          relatives={[{ id: relativeId, name: relativeName }]}
                          source="relative"
                          sourceId={activity.title}
                          triggerVariant="outline"
                          triggerSize="default"
                          triggerClassName="w-full"
                          onScheduled={() =>
                            setStatusNotice(`Scheduled “${activity.title}” in your calendar.`)
                          }
                        />
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <Dialog
        open={Boolean(isCustomizeOpen && selectedActivity)}
        onOpenChange={(next) => setIsCustomizeOpen(next)}
      >
        {selectedActivity && (
          <DialogContent className="max-w-3xl rounded-[32px]">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold">
                Customize “{customTitle || selectedActivity.title}”
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Make it sound personal before we send it off.
              </p>
            </DialogHeader>

            <div className="mt-4 grid gap-6 md:grid-cols-2">
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
              <p className="mt-2 text-sm text-muted-foreground">
                Talk to them like you normally would. We&apos;ll reuse this copy
                when sending the invite.
              </p>
              <textarea
                className="mt-4 min-h-[140px] w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-base"
                value={inviteMessage}
                onChange={(event) => setInviteMessage(event.target.value)}
                placeholder='e.g. "Want to try this together on Saturday?"'
              />
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button className="flex-1 min-w-[150px]" onClick={handleSendInvite}>
                Send invite
              </Button>
              <Button
                variant="ghost"
                className="flex-1 min-w-[150px]"
                onClick={() => setIsCustomizeOpen(false)}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  );
}

function extractActivities(payload: unknown): ActivitySuggestion[] {
  const raw =
    (payload as { activities?: unknown })?.activities ??
    (payload as {
      suggestionsJson?: { activities?: unknown };
    })?.suggestionsJson?.activities ??
    (payload as {
      match?: { suggestionsJson?: { activities?: unknown } };
    })?.match?.suggestionsJson?.activities;

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (
        !item ||
        typeof item !== "object" ||
        !("title" in item) ||
        !("description" in item)
      ) {
        return null;
      }

      const activity = item as Partial<ActivitySuggestion>;

      return {
        title: activity.title ?? "Untitled plan",
        description: activity.description ?? "No description provided",
        location: activity.location ?? "Flexible location",
        possible_date: activity.possible_date ?? new Date().toISOString(),
      };
    })
    .filter((item): item is ActivitySuggestion => Boolean(item));
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Any day works";
  }
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
