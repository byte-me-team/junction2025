import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";

const highlights = [
  {
    title: "Personal preferences",
    body: "Gentle onboarding that respects how you like to spend time and how far you want to travel.",
  },
  {
    title: "Shared plans",
    body: "Invite relatives to co-plan occasional outings without taking away independence.",
  },
  {
    title: "AI-powered nudges",
    body: "Daily suggestions tuned to your comfort level. No pressure, only helpful context.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-5xl flex-col gap-10 px-6 py-16 sm:py-20">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
            Aging with AI
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Activity planning for seniors and loved ones
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">
              Discover nearby events, plan gentle outings, and stay inspired with
              respectful reminders powered by AI. Built for hackathon speed with a
              clear path to production APIs.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg" className="text-base">
              <Link href="/onboarding">Get started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {highlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-border bg-card/80 p-5 shadow-sm"
            >
              <h3 className="text-xl font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
