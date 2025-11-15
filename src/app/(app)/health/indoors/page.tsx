"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useRequireAuth } from "@/lib/use-require-auth";

/**
 * Simple helper: parse "HH:MM" into milliseconds until that next occurrence.
 */
function msUntilNextTime(hhmm: string) {
  const [hhStr, mmStr] = hhmm.split(":");
  const hh = Number(hhStr);
  const mm = Number(mmStr);
  const now = new Date();
  const target = new Date(now);
  target.setHours(hh, mm, 0, 0);

  if (target <= now) {
    // tomorrow
    target.setDate(target.getDate() + 1);
  }
  return target.getTime() - now.getTime();
}

type ReminderSettings = {
  enabled: boolean;
  times: string[]; // "HH:MM"
};

const STORAGE_KEY = "stretch_reminders_v1";

type Step = {
  title: string;
  instruction: string;
  durationSec?: number; // optional duration; if set, stepper will count down
};

const ROUTINES: { id: string; label: string; steps: Step[] }[] = [
  {
    id: "general",
    label: "Gentle Full-Body Stretch (General)",
    steps: [
      { title: "Sit tall / breathe", instruction: "Sit or stand tall. Inhale slowly for 4s, exhale for 6s. Repeat 3 times.", durationSec: 30 },
      { title: "Neck turns", instruction: "Slowly turn head to the left, hold 5s, then to the right. Repeat twice each side.", durationSec: 30 },
      { title: "Shoulder rolls", instruction: "Roll shoulders backward 8 times, then forward 8 times.", durationSec: 30 },
      { title: "Seated side stretch", instruction: "Seated: raise one arm and lean to opposite side gently. Hold 15s each side.", durationSec: 30 },
      { title: "Ankle circles", instruction: "Lift one foot and circle the ankle 10x each direction. Repeat with other foot.", durationSec: 30 },
    ],
  },
  {
    id: "lowerBack",
    label: "Lower Back Mobility Routine",
    steps: [
      { title: "Pelvic tilts", instruction: "Lie on your back with knees bent. Gently tilt your pelvis to flatten lower back to the floor, then release. Repeat 8–10 times.", durationSec: 45 },
      { title: "Knee-to-chest (single)", instruction: "Bring one knee to chest, hold 15s, switch legs. Repeat twice each side.", durationSec: 40 },
      { title: "Seated cat-cow", instruction: "Sit tall, arch the back slightly on inhale (cow), round on exhale (cat). Repeat 8–10 times.", durationSec: 40 },
    ],
  },
  {
    id: "knees",
    label: "Knee-Friendly Mobility",
    steps: [
      { title: "Heel slides", instruction: "Lie on back and slowly slide heel toward buttock, then straighten. 10 reps each leg.", durationSec: 45 },
      { title: "Quadriceps set", instruction: "Sitting or lying, tighten front thigh muscle and hold 5s. 10 reps each leg.", durationSec: 30 },
      { title: "Seated calf raises", instruction: "Sit and lift heels while toes stay on floor. 12–15 reps.", durationSec: 30 },
    ],
  },
];

export default function RemindersPage() {
  // Reminders settings
  const [settings, setSettings] = useState<ReminderSettings>({ enabled: false, times: ["09:00"] });

  // runtime scheduling refs
  const timersRef = useRef<number[]>([]);

  const { user, isLoading } = useRequireAuth();

  // notifications permission
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default");

  // UI: routine selection and stepper
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>(ROUTINES[0].id);
  const routine = ROUTINES.find((r) => r.id === selectedRoutineId)!;

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [stepRemaining, setStepRemaining] = useState<number | null>(null);
  const stepTimerRef = useRef<number | null>(null);

  // status message
  const [statusMessage, setStatusMessage] = useState("");

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading health center…</p>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  // load settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setSettings(JSON.parse(raw));
      }
    } catch (err) {
      console.warn("Failed to load reminder settings:", err);
    }
  }, []);

  // persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (err) {
      console.warn("Failed to save reminder settings:", err);
    }
  }, [settings]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      setStatusMessage("This browser does not support notifications.");
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setNotifPermission(p);
      if (p === "granted") {
        setStatusMessage("Notifications enabled. Reminders will use native notifications.");
      } else if (p === "denied") {
        setStatusMessage("Notifications blocked. Use the page while open to receive alerts.");
      } else {
        setStatusMessage("Notification permission: " + p);
      }
    } catch (err) {
      console.warn(err);
      setStatusMessage("Failed to request notification permission.");
    }
  };

  // beep using WebAudio (short)
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      o.frequency.value = 880;
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.value = 0.0001;
      const now = ctx.currentTime;
      g.gain.linearRampToValueAtTime(0.03, now + 0.01);
      o.start(now);
      g.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      o.stop(now + 0.45);
    } catch (err) {
      // fallback to alert
      // eslint-disable-next-line no-alert
      // alert("Reminder!");
    }
  };

  // show a notification or fallback to an in-page message
  const fireReminder = (title: string, body?: string) => {
    if (typeof window === "undefined") return;
    if ("Notification" in window && Notification.permission === "granted") {
      try {
        new Notification(title, { body: body ?? "Time for a short stretching break." });
      } catch (err) {
        console.warn("Notification failed", err);
        setStatusMessage(title + " — " + (body ?? ""));
      }
    } else {
      // in-page fallback
      setStatusMessage(title + " — " + (body ?? ""));
      // optionally show alert if user chooses so
      // eslint-disable-next-line no-alert
      // alert(`${title}\n\n${body ?? ""}`);
    }
    playBeep();
  };

  // schedule timers for reminders (clears existing timers)
  const scheduleReminders = () => {
    // clear
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];

    if (!settings.enabled) return;

    for (const hhmm of settings.times) {
      const ms = msUntilNextTime(hhmm);
      const id = window.setTimeout(function handler() {
        fireReminder("Stretching time", `It's ${hhmm}. A short stretch can help mobility.`);
        // after firing, schedule the same reminder for next day
        const nextId = window.setTimeout(handler, 24 * 60 * 60 * 1000);
        timersRef.current.push(nextId);
      }, ms);
      timersRef.current.push(id);
    }
  };

  // schedule on settings change or mount
  useEffect(() => {
    scheduleReminders();
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // Helper: add time, remove time
  const addTime = (hhmm: string) => {
    if (!/^\d{1,2}:\d{2}$/.test(hhmm)) {
      setStatusMessage("Time must be HH:MM");
      return;
    }
    const [hStr, mStr] = hhmm.split(":");
    const h = Number(hStr);
    const m = Number(mStr);
    if (h < 0 || h > 23 || m < 0 || m > 59) {
      setStatusMessage("Invalid time");
      return;
    }
    setSettings((s) => ({ ...s, times: Array.from(new Set([...s.times, hhmm])).sort() }));
    setStatusMessage("");
  };

  const removeTime = (hhmm: string) => {
    setSettings((s) => ({ ...s, times: s.times.filter((t) => t !== hhmm) }));
  };

  // Stepper logic
  const startStepper = () => {
    const step = routine.steps[currentStepIndex];
    if (step.durationSec) {
      setStepRemaining(step.durationSec);
    } else {
      setStepRemaining(null);
    }
    setIsRunning(true);
  };

  const pauseStepper = () => {
    setIsRunning(false);
    if (stepTimerRef.current) {
      window.clearInterval(stepTimerRef.current);
      stepTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (isRunning) {
      // If current step has duration, start countdown
      const step = routine.steps[currentStepIndex];
      if (step.durationSec) {
        setStepRemaining(prev =>
            prev == null
                ? (step.durationSec ?? null)
                : prev);
        // tick every second
        stepTimerRef.current = window.setInterval(() => {
          setStepRemaining((r) => {
            if (r == null) return r;
            if (r <= 1) {
              // advance automatically
              window.clearInterval(stepTimerRef.current!);
              stepTimerRef.current = null;
              setIsRunning(false);
              // play short beep
              playBeep();
              // automatically move to next step but don't start it
              setCurrentStepIndex((i) => Math.min(i + 1, routine.steps.length - 1));
              return 0;
            }
            return r - 1;
          });
        }, 1000) as unknown as number;
      }
    } else {
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    }

    return () => {
      if (stepTimerRef.current) {
        window.clearInterval(stepTimerRef.current);
        stepTimerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning, currentStepIndex, selectedRoutineId]);

  const goToPrev = () => {
    pauseStepper();
    setCurrentStepIndex((i) => Math.max(0, i - 1));
    setStepRemaining(null);
  };

  const goToNext = () => {
    pauseStepper();
    setCurrentStepIndex((i) => Math.min(routine.steps.length - 1, i + 1));
    setStepRemaining(null);
  };

  // quick test notification (fires immediately)
  const testReminderNow = () => {
    fireReminder("Test: stretching reminder", "This is a test reminder. Try starting a short routine.");
  };

  return (
    <main>
      <p className="text-sm font-semibold text-primary">
          Welcome, {user.name || user.email}
        </p>
        <h1 className="text-3xl font-semibold">Daily Indoors Movement</h1>
      <Card className="mb-6 mt-3">
        <CardHeader>
          <CardTitle>Reminders</CardTitle>
          <CardDescription>
            Configure daily times when you'd like to be reminded to do a short, gentle stretching routine.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings((s) => ({ ...s, enabled: e.target.checked }))}
                />
                <span className="text-sm">Enable daily reminders</span>
              </label>

              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" onClick={requestNotificationPermission} size="sm">
                  Enable Notifications
                </Button>
                <Button variant="ghost" onClick={testReminderNow} size="sm">
                  Test reminder
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <p className="text-sm font-medium">Scheduled times</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {settings.times.length ? (
                    settings.times.map((t) => (
                      <div key={t} className="inline-flex items-center gap-2 rounded-full border px-3 py-1 bg-muted/20">
                        <span className="text-sm">{t}</span>
                        <button
                          className="text-xs px-1 rounded hover:bg-muted"
                          onClick={() => removeTime(t)}
                          aria-label={`Remove ${t}`}
                        >
                          ✕
                        </button>
                      </div>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No times set</span>
                  )}
                </div>
              </div>

              <AddTimeInput onAdd={(t) => addTime(t)} />
            </div>

            <p className="text-xs text-muted-foreground">
              Notifications require permission and will usually only appear while the site/tab is open. For persistent OS-level reminders, consider native apps or enabling push notifications (not implemented here).
            </p>
            {statusMessage && <p className="text-sm text-muted-foreground">{statusMessage}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button onClick={() => { setSettings({ enabled: false, times: [] }); setStatusMessage("Cleared reminders."); }}>
            Clear all
          </Button>
        </CardFooter>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Stretching Routines</CardTitle>
          <CardDescription>
            Choose a routine and step through it at your own pace. All routines are gentle — stop if anything hurts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            {ROUTINES.map((r) => (
              <button
                key={r.id}
                className={`px-3 py-2 rounded-md border ${r.id === selectedRoutineId ? "bg-primary/10 border-primary" : "bg-card border-border"}`}
                onClick={() => {
                  setSelectedRoutineId(r.id);
                  setCurrentStepIndex(0);
                  setIsRunning(false);
                  setStepRemaining(null);
                }}
              >
                {r.label}
              </button>
            ))}
          </div>

          <div className="rounded-lg border p-4 bg-card/60">
            <h3 className="text-lg font-semibold">{routine.steps[currentStepIndex].title}</h3>
            <p className="text-sm text-muted-foreground mt-2">{routine.steps[currentStepIndex].instruction}</p>

            {stepRemaining != null && (
              <div className="mt-3 text-center">
                <div className="text-2xl font-mono">{formatSeconds(stepRemaining)}</div>
                <div className="text-xs text-muted-foreground">Remaining</div>
              </div>
            )}

            <div className="mt-4 flex gap-2">
              <Button onClick={goToPrev} disabled={currentStepIndex === 0}>Previous</Button>
              {isRunning ? (
                <Button variant="destructive" onClick={pauseStepper}>Pause</Button>
              ) : (
                <Button onClick={startStepper}>Start</Button>
              )}
              <Button onClick={goToNext} disabled={currentStepIndex >= routine.steps.length - 1}>Next</Button>
              <Button variant="ghost" onClick={() => {
                setCurrentStepIndex(0);
                setIsRunning(false);
                setStepRemaining(null);
              }}>Reset</Button>
            </div>

            <p className="text-xs text-muted-foreground mt-3">
              Tip: move slowly, breathe, and only go as far as comfortable. This is general information, not medical advice.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Quick access</CardTitle>
          <CardDescription>Jump straight into a routine</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {ROUTINES.map((r) => (
              <Button key={r.id} onClick={() => {
                setSelectedRoutineId(r.id);
                setCurrentStepIndex(0);
                setIsRunning(true);
                const firstDuration = r.steps[0].durationSec ?? 0;
                setStepRemaining(firstDuration || null);
              }}>{r.label}</Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {statusMessage && <div className="mt-4 text-sm">{statusMessage}</div>}
    </main>
  );
}

/** tiny component for adding time */
function AddTimeInput({ onAdd }: { onAdd: (hhmm: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <div className="flex items-center gap-2">
      <input
        type="time"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="rounded-md border px-2 py-1"
        aria-label="Add time"
      />
      <Button onClick={() => { if (value) { onAdd(value); setValue(""); } }} size="sm">Add</Button>
    </div>
  );
}

/** helpers */
function formatSeconds(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${mm}:${ss.toString().padStart(2, "0")}`;
}
