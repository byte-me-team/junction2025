"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { useAuth } from "@/components/auth/auth-context";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function SignInPage() {
  const router = useRouter();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    if (!isValid) {
      setError("Please enter a valid email.");
      return;
    }
    setError(null);
    const nextUser = signIn(trimmed);
    if (nextUser.onboarding) {
      router.push("/dashboard");
    } else {
      router.push("/onboarding");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto w-full max-w-lg px-4 py-12 sm:px-6 lg:px-8">
        <LoginForm
          email={email}
          error={error}
          onEmailChange={(value) => {
            if (error) setError(null);
            setEmail(value);
          }}
          onSubmit={handleSubmit}
          supportingText="We'll route you to onboarding if we don't detect a stored profile."
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
