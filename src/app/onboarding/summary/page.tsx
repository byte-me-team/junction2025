"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signIn } from "next-auth/react";

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
      console.error("Failed to save onboarding", err);
      setError("Something went wrong while saving your profile.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="bg-background">
      <section className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Step 3 of 3
          </p>
          <h1 className="text-3xl font-semibold">Review & confirm</h1>
          <p className="text-base text-muted-foreground">
            Make sure things look right before we save them to your secure
            account in the database.
          </p>
        </div>

        <div className="space-y-6 rounded-2xl border border-border/70 bg-card/60 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Basics
            </p>
            <div className="mt-2 space-y-2 text-sm">
              <p>
                <span className="font-semibold">Name:</span> {" "}
                {state.basicInfo.name || "Not provided"}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {state.basicInfo.email}
              </p>
              <p>
                <span className="font-semibold">City:</span> {" "}
                {state.basicInfo.city || "Not provided"}
              </p>
            </div>
          </div>

          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Preferences
            </p>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold">Enjoys</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {state.preferences.enjoyList.length ? (
                    state.preferences.enjoyList.map((item) => (
                      <li key={item}>• {item}</li>
                    ))
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold">Avoids</p>
                <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                  {state.preferences.dislikeList.length ? (
                    state.preferences.dislikeList.map((item) => (
                      <li key={item}>• {item}</li>
                    ))
                  ) : (
                    <li>—</li>
                  )}
                </ul>
              </div>
            </div>

            <dl className="mt-4 grid gap-4 text-sm text-muted-foreground sm:grid-cols-2">
              <div>
                <dt className="font-semibold text-foreground">
                  Travel distance
                </dt>
                <dd>Up to {state.preferences.travelDistanceKm} km</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Time of day</dt>
                <dd>{labels.time[state.preferences.preferredTime]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">
                  Social preference
                </dt>
                <dd>{labels.social[state.preferences.socialPreference]}</dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Trying new things</dt>
                <dd>{labels.adventurous[state.preferences.adventurous]}</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
          <Button
            variant="outline"
            onClick={() => router.push("/onboarding/preferences")}
          >
            Edit
          </Button>
          <Button onClick={handleFinish} disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : "Finish onboarding"}
          </Button>
        </div>
      </section>
    </main>
  );
}
