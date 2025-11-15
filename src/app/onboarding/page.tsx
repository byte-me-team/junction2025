"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { SignupForm } from "@/components/signup-form";
import { useOnboarding } from "@/components/onboarding/onboarding-provider";

export default function OnboardingBasicPage() {
  const router = useRouter();
  const { state, updateBasicInfo } = useOnboarding();
  const { status } = useSession();
  const [emailError, setEmailError] = useState<string | null>(null);
  const [cityError, setCityError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = state.basicInfo.email.trim();
    const password = state.basicInfo.password;
    const city = state.basicInfo.city.trim();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (!isValidEmail) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!city) {
      setCityError("Please choose the city you're based in.");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }

    setEmailError(null);
    setCityError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setFormError(null);
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
            We use your email and password to create a secure account when you
            finish onboarding.
          </p>
        </div>
        <SignupForm
          name={state.basicInfo.name}
          email={state.basicInfo.email}
          city={state.basicInfo.city}
          password={state.basicInfo.password}
          confirmPassword={confirmPassword}
          emailError={emailError}
          cityError={cityError}
          passwordError={passwordError}
          confirmPasswordError={confirmPasswordError}
          formError={formError}
          onNameChange={(value) =>
            updateBasicInfo({ name: value.slice(0, 60) })
          }
          onEmailChange={(value) => {
            if (emailError) setEmailError(null);
            updateBasicInfo({ email: value });
          }}
          onCityChange={(value) => {
            if (cityError) setCityError(null);
            updateBasicInfo({ city: value });
          }}
          onPasswordChange={(value) => {
            if (passwordError) setPasswordError(null);
            updateBasicInfo({ password: value });
          }}
          onConfirmPasswordChange={(value) => {
            if (confirmPasswordError) setConfirmPasswordError(null);
            setConfirmPassword(value);
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
