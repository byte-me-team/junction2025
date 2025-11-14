"use client";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="min-h-screen bg-background">
        <MarketingHeader />
        <div className="mx-auto w-full max-w-5xl px-4 pb-12 pt-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </OnboardingProvider>
  );
}
