"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";
import { Sparkles } from "lucide-react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";

export default function OnboardingSummaryPage() {
  const router = useRouter();
  const { state, reset } = useOnboarding();
  const { status } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!state.basicInfo.email) {
      router.replace("/onboarding");
    }
  }, [state.basicInfo.email, router]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const labels = useMemo(
    () => ({
      time: {
        any: "No preference",
        morning: "Morning",
        afternoon: "Afternoon",
        evening: "Evening",
      },
      social: {
        any: "Flexible",
        alone: "Solo",
        small_group: "Small group",
        family: "With family",
      },
      adventurous: {
        yes: "Yes",
        sometimes: "Sometimes",
        no: "Prefer familiar",
      },
    }),
    []
  );

  const handleFinish = async () => {
    if (!state.basicInfo.email) {
      router.push("/onboarding");
      return;
    }
    if (state.basicInfo.password.length < 8) {
      setError("Your password must be at least 8 characters.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.basicInfo.name,
          email: state.basicInfo.email,
          password: state.basicInfo.password,
          city: state.basicInfo.city,
          onboarding: state,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        setError(payload?.error ?? "Unable to save your account.");
        return;
      }

      const result = await signIn("credentials", {
        email: state.basicInfo.email,
        password: state.basicInfo.password,
        redirect: false,
      });

      if (result?.error) {
        setError("Account created, but we couldn't sign you in automatically.");
        return;
      }

      reset();
      router.push("/dashboard");
    } catch (err) {
      console.error("Failed to save profile", err);
      setError("Something went wrong while saving your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-1 sm:py-8">
      <section className="w-full max-w-4xl space-y-5 rounded-[28px] border border-primary/25 bg-card/80 px-5 py-5 shadow-2xl shadow-primary/20 backdrop-blur sm:px-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
            Step 3 of 3
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">Review & confirm</h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            Double-check the essentials before we securely stash your profile
            and auto-log you into Evergreen.
          </p>
        </div>

        <div className="space-y-4 rounded-[24px] border border-border/50 bg-card/90 p-4 shadow-xl shadow-primary/10">
          <div className="grid gap-3 sm:grid-cols-[1fr_1fr]">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-card/70 p-3 text-sm shadow-inner">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">
                Basics
              </p>
              <div className="mt-4 grid gap-3 text-base font-semibold text-foreground">
                <p>
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Name
                  </span>
                  <br />
                  {state.basicInfo.name || "Not provided"}
                </p>
                <p>
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    Email
                  </span>
                  <br />
                  <span className="break-all">{state.basicInfo.email}</span>
                </p>
                <p>
                  <span className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
                    City
                  </span>
                  <br />
                  {state.basicInfo.city || "Not provided"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-card/70 p-3 shadow-inner">
              <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                Moodboard
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                {(state.preferences.enjoyList.length
                  ? state.preferences.enjoyList
                  : ["No joyful notes yet"]
                ).map((item) => (
                  <span
                    key={`enjoy-${item}`}
                    className="rounded-full bg-primary/15 px-3 py-1 text-primary"
                  >
                    {item}
                  </span>
                ))}
                {state.preferences.dislikeList.map((item) => (
                  <span
                    key={`avoid-${item}`}
                    className="rounded-full bg-destructive/20 px-3 py-1 text-destructive"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-card/70 p-3 shadow-inner">
              <p className="text-sm font-semibold">Travel distance</p>
              <div className="mt-4 h-2 rounded-full bg-border/50">
                <div
                  className="h-full rounded-full bg-primary/70"
                  style={{
                    width: `${((state.preferences.travelDistanceKm - 1) / 39) * 100}%`,
                  }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Up to {state.preferences.travelDistanceKm} km
              </p>
            </div>
            <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card/90 to-card/70 p-3 shadow-inner">
              <p className="text-sm font-semibold">Rhythm & social energy</p>
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-between">
                  <span>Preferred time</span>
                  <span className="font-semibold text-foreground">
                    {labels.time[state.preferences.preferredTime]}
                  </span>
                </span>
                <span className="flex items-center justify-between">
                  <span>Social preference</span>
                  <span className="font-semibold text-foreground">
                    {labels.social[state.preferences.socialPreference]}
                  </span>
                </span>
                <span className="flex items-center justify-between">
                  <span>Trying new things</span>
                  <span className="font-semibold text-foreground">
                    {labels.adventurous[state.preferences.adventurous]}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding/preferences")}
          >
            Edit
          </Button>
          <Button
            onClick={handleFinish}
            disabled={isSubmitting}
            className="shadow-lg shadow-primary/30"
          >
            {isSubmitting ? "Saving..." : "Create profile"}
          </Button>
        </div>
      </section>
    </main>
  );
}
