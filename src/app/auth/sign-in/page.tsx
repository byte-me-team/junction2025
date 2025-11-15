"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

import { LoginForm } from "@/components/login-form";
import { MarketingHeader } from "@/components/layout/marketing-header";

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
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 lg:px-8">
        <LoginForm
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
          supportingText="Use the email and password you created during onboarding."
          footer={
            <p className="text-center text-sm text-muted-foreground">
              First time here?{" "}
              <Link className="font-medium text-primary" href="/onboarding">
                Start onboarding
              </Link>
            </p>
          }
        />
      </section>
    </div>
  );
}
