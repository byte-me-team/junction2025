"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { SignupForm } from "@/components/signup-form";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";

export default function OnboardingBasicPage() {
  const router = useRouter();
  const { state, updateBasicInfo } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = state.basicInfo.email.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      setError("Please enter a valid email address.");
      return;
    }

    setError(null);
    router.push("/onboarding/preferences");
  };

  return (
    <main>
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Step 1 of 3
          </p>
          <h1 className="text-3xl font-semibold">Tell us the basics</h1>
          <p className="text-base text-muted-foreground">
            We use your email to keep onboarding progress locally until the API is
            ready.
          </p>
        </div>
        <SignupForm
          name={state.basicInfo.name}
          email={state.basicInfo.email}
          error={error}
          onNameChange={(value) =>
            updateBasicInfo({ name: value.slice(0, 60) })
          }
          onEmailChange={(value) => {
            if (error) setError(null);
            updateBasicInfo({ email: value });
          }}
          onSubmit={handleSubmit}
          supportingText="We'll never spam this address. It simply identifies the profile."
          footer={
            <p className="text-center text-sm text-muted-foreground">
              Already added preferences?{" "}
              <Link className="font-medium text-primary" href="/auth/sign-in">
                Jump to dashboard
              </Link>
            </p>
          }
        />
      </section>
    </main>
  );
}
