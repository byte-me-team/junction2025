"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";

const saveOnboardingPlaceholder = async () => {
  // TODO: POST onboarding payload to /api/v1/onboarding when backend exists
  return Promise.resolve();
};

export default function OnboardingSummaryPage() {
  const router = useRouter();
  const { state } = useOnboarding();
  const { signIn } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!state.basicInfo.email) {
      router.replace("/onboarding");
    }
  }, [state.basicInfo.email, router]);

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
    setIsSubmitting(true);
    await saveOnboardingPlaceholder();
    signIn(state.basicInfo.email, {
      name: state.basicInfo.name,
      onboarding: state,
    });
    setIsSubmitting(false);
    router.push("/dashboard");
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
            Make sure things look right before we save them locally and later push
            them to the backend.
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

        <div className="mt-8 flex items-center justify-between">
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
