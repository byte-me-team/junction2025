"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { useRequireAuth } from "@/lib/use-require-auth";

// Parse HH:MM -> ms until next occurrence
function msUntilNextTime(hhmm: string) {
  const [hh, mm] = hhmm.split(":").map(Number);
  const now = new Date();
  const target = new Date();

  target.setHours(hh, mm, 0, 0);
  if (target <= now) target.setDate(target.getDate() + 1);

  return target.getTime() - now.getTime();
}

type ReminderSettings = {
  enabled: boolean;
  times: string[];
};

const STORAGE_KEY = "outdoor_reminders_v1";

type Step = {
  title: string;
  instruction: string;
  durationSec?: number;
};

const ROUTINES = [
  {
    id: "lightWalk",
    label: "Gentle Outdoor Walk",
    steps: [
      {
        title: "Warm-up breathing",
        instruction: "Stand tall, inhale slowly 4s, exhale 6s. Repeat 3 times.",
        durationSec: 30,
      },
      {
        title: "Easy walking",
        instruction: "Walk at a relaxed pace. Keep shoulders down, breathe calmly.",
        durationSec: 600,
      },
      {
        title: "Look around",
        instruction:
          "Pause and look at trees, sky, buildings. Gentle head turns only.",
        durationSec: 180,
      },
      {
        title: "Return walk",
        instruction:
          "Walk back at a comfortable pace. Stop anytime if tired.",
        durationSec: 600,
      },
    ],
  },

  {
    id: "balance",
    label: "Safe Balance Practice",
    steps: [
      {
        title: "Stand & breathe",
        instruction: "Stand near a railing or wall. Slow breathing 3×.",
        durationSec: 30,
      },
      {
        title: "Heel-to-toe",
        instruction:
          "Walk heel-to-toe along a line or curb. Hold railing if needed.",
        durationSec: 45,
      },
      {
        title: "Single-leg support",
        instruction:
          "Hold railing and lift one foot slightly. Switch after 10–15s.",
        durationSec: 30,
      },
    ],
  },

  {
    id: "nature",
    label: "Nature-Based Relaxation",
    steps: [
      {
        title: "Find a spot",
        instruction: "Sit or stand outside somewhere quiet.",
        durationSec: 60,
      },
      {
        title: "Listen",
        instruction:
          "Listen for 3 different sounds (birds, wind, people, cars).",
        durationSec: 120,
      },
      {
        title: "Slow neck turns",
        instruction: "Look left & right gently. Only small movements.",
        durationSec: 30,
      },
    ],
  },
];

export default function OutdoorPage() {
  const { user, isLoading } = useRequireAuth();

  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: false,
    times: ["10:00"],
  });

  const [notifPermission, setNotifPermission] =
    useState<NotificationPermission>(
      typeof window !== "undefined" && "Notification" in window
        ? Notification.permission
        : "default"
    );

  const timersRef = useRef<number[]>([]);

  const [selectedRoutineId, setSelectedRoutineId] = useState(
    ROUTINES[0].id
  );
  const routine =
    ROUTINES.find((r) => r.id === selectedRoutineId) ?? ROUTINES[0];

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stepRemaining, setStepRemaining] = useState<number | null>(null);

  const stepTimerRef = useRef<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("");

  if (isLoading) {
    return (
      <main className="p-6">
        <p className="text-sm text-muted-foreground">
          Loading…
        </p>
      </main>
    );
  }
  if (!user) return null;

  /* LOAD SETTINGS */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSettings(JSON.parse(raw));
    } catch {}
  }, []);

  /* SAVE SETTINGS */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {}
  }, [settings]);

  /* NOTIFICATION PERMISSION */
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) return;
    const p = await Notification.requestPermission();
    setNotifPermission(p);
  };

  /* REMINDER FIRING */
  const fireReminder = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body });
    } else {
      setStatusMessage(`${title} — ${body}`);
      alert(`${title}\n\n${body}`);
    }
  };

  /* SCHEDULE TIMERS */
  const schedule = () => {
    timersRef.current.forEach((id) => clearTimeout(id));
    timersRef.current = [];

    if (!settings.enabled) return;

    settings.times.forEach((t) => {
      const ms = msUntilNextTime(t);
      const id = window.setTimeout(function tick() {
        fireReminder(
          "Time for a short outdoor break",
          "A short walk or fresh-air moment can improve mood."
        );
        const next = window.setTimeout(tick, 24 * 60 * 60 * 1000);
        timersRef.current.push(next);
      }, ms);
      timersRef.current.push(id);
    });
  };

  useEffect(() => {
    schedule();
    return () => timersRef.current.forEach(clearTimeout);
  }, [settings]);

  /* STEPPER */
  const startStepper = () => {
    const step = routine.steps[currentStepIndex];
    setIsRunning(true);
    setStepRemaining(step.durationSec ?? null);
  };

  const pauseStepper = () => {
    setIsRunning(false);
    if (stepTimerRef.current) clearInterval(stepTimerRef.current);
    stepTimerRef.current = null;
  };

  useEffect(() => {
    if (!isRunning) {
      if (stepTimerRef.current) clearInterval(stepTimerRef.current);
      return;
    }

    const step = routine.steps[currentStepIndex];
    if (!step.durationSec) return;

    stepTimerRef.current = window.setInterval(() => {
      setStepRemaining((prev) => {
        if (prev == null) return null;
        if (prev <= 1) {
          clearInterval(stepTimerRef.current!);
          setIsRunning(false);
          setCurrentStepIndex((i) =>
            Math.min(i + 1, routine.steps.length - 1)
          );
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(stepTimerRef.current!);
  }, [isRunning, currentStepIndex, selectedRoutineId]);

  const goNext = () => {
    pauseStepper();
    setCurrentStepIndex((i) => Math.min(i + 1, routine.steps.length - 1));
    setStepRemaining(null);
  };
  const goPrev = () => {
    pauseStepper();
    setCurrentStepIndex((i) => Math.max(i - 1, 0));
    setStepRemaining(null);
  };

  /* UI */
  return (
    <main>
      <h1 className="text-3xl font-semibold">
        Outdoor Wellness & Mobility
      </h1>
      <p className="text-sm text-muted-foreground">
        Gentle outdoor routines & daily reminders
      </p>

      {/* REMINDERS */}
      <Card className="mt-6 mb-6">
        <CardHeader>
          <CardTitle>Outdoor Activity Reminders</CardTitle>
          <CardDescription>
            Get a gentle reminder to step outside for a short break.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) =>
                setSettings({ ...settings, enabled: e.target.checked })
              }
            />
            <span className="text-sm">Enable daily reminders</span>
          </label>

          <div className="mt-4">
            <p className="text-sm font-medium">Times</p>
            <div className="flex flex-wrap gap-2 mt-2">
              {settings.times.map((t) => (
                <div
                  key={t}
                  className="px-3 py-1 border rounded-full bg-muted/40 flex items-center gap-2"
                >
                  <span className="text-sm">{t}</span>
                  <button
                    className="text-xs"
                    onClick={() =>
                      setSettings({
                        ...settings,
                        times: settings.times.filter((x) => x !== t),
                      })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <AddTimeInput
              onAdd={(t) =>
                setSettings({
                  ...settings,
                  times: Array.from(new Set([...settings.times, t])).sort(),
                })
              }
            />
          </div>

          <Button
            size="sm"
            className="mt-4"
            variant="outline"
            onClick={requestNotificationPermission}
          >
            Enable Notification Permission
          </Button>
        </CardContent>

        <CardFooter>
          <Button
            variant="ghost"
            onClick={() =>
              setSettings({ enabled: false, times: [] })
            }
          >
            Clear all
          </Button>
        </CardFooter>
      </Card>

      {/* ROUTINES */}
      <Card>
        <CardHeader>
          <CardTitle>Outdoor Routines</CardTitle>
          <CardDescription>
            Safe, gentle, senior-friendly outdoor routines.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex gap-2 mb-4">
            {ROUTINES.map((r) => (
              <Button
                key={r.id}
                variant={
                  selectedRoutineId === r.id ? "default" : "outline"
                }
                onClick={() => {
                  setSelectedRoutineId(r.id);
                  setCurrentStepIndex(0);
                  setIsRunning(false);
                  setStepRemaining(null);
                }}
              >
                {r.label}
              </Button>
            ))}
          </div>

          <div className="border p-4 rounded-lg bg-card/60">
            <h3 className="text-lg font-semibold">
              {routine.steps[currentStepIndex].title}
            </h3>
            <p className="text-sm mt-1 text-muted-foreground">
              {routine.steps[currentStepIndex].instruction}
            </p>

            {stepRemaining != null && (
              <div className="text-center mt-3">
                <div className="text-2xl font-mono">
                  {formatSeconds(stepRemaining)}
                </div>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            )}

            <div className="flex gap-3 mt-4">
              <Button onClick={goPrev} disabled={currentStepIndex === 0}>
                Previous
              </Button>

              {isRunning ? (
                <Button variant="destructive" onClick={pauseStepper}>
                  Pause
                </Button>
              ) : (
                <Button onClick={startStepper}>Start</Button>
              )}

              <Button
                onClick={goNext}
                disabled={
                  currentStepIndex >= routine.steps.length - 1
                }
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {statusMessage && (
        <div className="mt-4 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      )}
    </main>
  );
}

function AddTimeInput({ onAdd }: { onAdd: (t: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex gap-2 mt-3">
      <input
        type="time"
        className="px-2 py-1 border rounded-md"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <Button
        size="sm"
        onClick={() => {
          if (value) {
            onAdd(value);
            setValue("");
          }
        }}
      >
        Add
      </Button>
    </div>
  );
}

function formatSeconds(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const ss = (s % 60).toString().padStart(2, "0");
  return `${m}:${ss}`;
}
