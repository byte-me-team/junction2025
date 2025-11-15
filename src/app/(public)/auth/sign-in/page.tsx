"use client";

import Link from "next/link";
import Image from "next/image";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { Sparkles } from "lucide-react";

import { LoginForm } from "@/components/login-form";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isValid) {
      setEmailError("Please enter a valid email.");
      return;
    }

    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }

    setEmailError(null);
    setPasswordError(null);
    setFormError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn("credentials", {
        email: trimmed,
        password,
        redirect: false,
      });

      if (result?.error) {
        const message =
          result.error === "CredentialsSignin"
            ? "Invalid email or password."
            : "Unable to sign in. Please try again.";
        setFormError(message);
        return;
      }

      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to sign in", error);
      setFormError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative isolate flex flex-1 flex-col overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/15 via-background to-background" />
      <div className="pointer-events-none absolute -left-24 top-64 -z-10 h-80 w-80 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -right-16 bottom-12 -z-10 h-72 w-72 rounded-full bg-secondary/30 blur-[120px]" />

      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12 sm:py-16">
        <div className="inline-flex w-fit items-center gap-3 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
          <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
          Welcome back
        </div>
        <div className="grid w-full items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-8">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              We've got plenty of new activities to explore
            </h1>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 -z-10 rounded-[36px] bg-gradient-to-br from-primary/20 via-card/60 to-background blur-3xl" />
            <LoginForm
              className="relative"
              cardClassName="border-primary/30 bg-card/80 shadow-primary/30"
              email={email}
              password={password}
              emailError={emailError}
              passwordError={passwordError}
              formError={formError}
              isSubmitting={isSubmitting}
              onEmailChange={(value) => {
                if (emailError) setEmailError(null);
                if (formError) setFormError(null);
                setEmail(value);
              }}
              onPasswordChange={(value) => {
                if (passwordError) setPasswordError(null);
                if (formError) setFormError(null);
                setPassword(value);
              }}
              onSubmit={handleSubmit}
              supportingText="Use the email and password you created during account creation."
              footer={
                <p className="text-center text-sm text-muted-foreground">
                  First time here?{" "}
                  <Link className="font-medium text-primary" href="/onboarding">
                    Create an account
                  </Link>
                </p>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
