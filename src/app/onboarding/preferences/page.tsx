"use client";

import { FormEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { TagInput } from "@/components/forms/tag-input";

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const { state, updatePreferences } = useOnboarding();

  useEffect(() => {
    if (!state.basicInfo.email) {
      router.replace("/onboarding");
    }
  }, [state.basicInfo.email, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    router.push("/onboarding/summary");
  };

  return (
    <main className="bg-background">
      <section className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="mb-8 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Step 2 of 3
          </p>
          <h1 className="text-3xl font-semibold">Tell us what feels good</h1>
          <p className="text-base text-muted-foreground">
            Jot a word or phrase, tap Enter, and we will turn it into a bubble.
          </p>
        </div>
        <form className="space-y-8" onSubmit={handleSubmit}>
          <TagInput
            label="Things you enjoy doing"
            description="One idea per line. Hit Enter to save it."
            placeholder="Knitting\nLocal markets\nStroll with family"
            items={state.preferences.enjoyList}
            onChange={(next) => updatePreferences({ enjoyList: next })}
          />

          <TagInput
            label="Things you do not like"
            placeholder="Crowded malls"
            items={state.preferences.dislikeList}
            onChange={(next) => updatePreferences({ dislikeList: next })}
          />

          <div className="grid gap-6 rounded-2xl border border-border/70 bg-card/70 p-6 sm:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">
                How far are you willing to travel?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={state.preferences.travelDistanceKm}
                  onChange={(event) =>
                    updatePreferences({
                      travelDistanceKm: Number(event.target.value),
                    })
                  }
                  className="w-full"
                />
                <span className="text-sm font-semibold">
                  {state.preferences.travelDistanceKm} km
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Preferred time of day</label>
              <select
                className="w-full rounded-xl border border-border bg-card p-3 text-base"
                value={state.preferences.preferredTime}
                onChange={(event) =>
                  updatePreferences({
                    preferredTime: event.target.value as typeof state.preferences.preferredTime,
                  })
                }
              >
                <option value="any">No preference</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">How social do you prefer activities to be?</label>
              <select
                className="w-full rounded-xl border border-border bg-card p-3 text-base"
                value={state.preferences.socialPreference}
                onChange={(event) =>
                  updatePreferences({
                    socialPreference: event.target.value as typeof state.preferences.socialPreference,
                  })
                }
              >
                <option value="any">I'm flexible</option>
                <option value="alone">Just me</option>
                <option value="small_group">Small group</option>
                <option value="family">With family</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Do you like to try new things?</label>
              <select
                className="w-full rounded-xl border border-border bg-card p-3 text-base"
                value={state.preferences.adventurous}
                onChange={(event) =>
                  updatePreferences({
                    adventurous: event.target.value as typeof state.preferences.adventurous,
                  })
                }
              >
                <option value="yes">Yes, bring it on</option>
                <option value="sometimes">Sometimes</option>
                <option value="no">Prefer the familiar</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/onboarding")}
            >
              Back
            </Button>
            <Button type="submit">Continue</Button>
          </div>
        </form>
      </section>
    </main>
  );
}
