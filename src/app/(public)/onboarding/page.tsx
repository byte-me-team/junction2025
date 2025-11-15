"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Sparkles } from "lucide-react";

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
    <main className="relative z-10">
      <section className="space-y-8 rounded-[40px] border border-primary/25 bg-card/70 px-5 py-8 shadow-2xl shadow-primary/20 backdrop-blur sm:px-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
            Step 1 of 3
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            Tell us the basics
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg">
            We use your email, location, and password to anchor your secure
            account before we craft the more emotive bits.
          </p>
        </div>
        <SignupForm
          className="rounded-[32px] border border-border/70 bg-card/80 shadow-xl shadow-primary/10 backdrop-blur"
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
//          footer={
//            <p className="text-center text-sm text-muted-foreground">
 //             Already added preferences?{" "}
//              <Link className="font-medium text-primary" href="/auth/sign-in">
//                Jump to dashboard
//              </Link>
//            </p>
//          }
        />
      </section>
    </main>
  );
}
