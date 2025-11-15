import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
  BellOff,
  CloudRain,
  HeartCrack,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const highlights: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Personal preference co-pilot",
    body: "Automatically normalize each person’s likes and limits so suggestions stay within their comfort zone every time.",
    icon: BellOff,
  },
  {
    title: "Matchmaking that adapts",
    body: "Evergreen compares interests, weather, mobility, and even schedules to produce three realistic invites you can send instantly.",
    icon: CloudRain,
  },
  {
    title: "Contextual reminders",
    body: "No nagging. Nudges arrive only when plans feel stale or silence stretches too long, keeping everyone looped in without guilt.",
    icon: HeartCrack,
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <main className="mx-auto flex min-h-[calc(100vh-120px)] w-full max-w-6xl flex-col gap-12 px-6 py-14 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-primary/80">
              <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
              evergreen
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                EVERGREEN
              </h1>
              <p className="text-xl font-medium text-primary/90">
                the gentle bridge from a lonely dystopia to a shared utopia
              </p>
              <p className="text-base text-muted-foreground sm:text-lg">
                A calm intervention for families drifting apart. We pair honest
                data with respectful AI nudges so no one has to be the nagging
                relative or the forgotten grandparent.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Built at Junction 2025. Designed to plug directly into production
                APIs once the hackathon dust settles.
              </p>
            </div>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Button asChild size="lg" className="text-base shadow-lg shadow-primary/40 transition hover:-translate-y-0.5">
                <Link href="/onboarding">Get started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-base transition hover:-translate-y-0.5"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-primary/10 blur-3xl" />
            <div className="relative rounded-[40px] border border-primary/30 bg-card/80 p-8 text-center shadow-xl shadow-primary/20 transition motion-safe:animate-[pulse_4s_ease-in-out_infinite]">
              <Image
                src="/evergreen.png"
                alt="Evergreen logo"
                priority
                width={256}
                height={256}
                className="mx-auto mb-6 h-auto w-52 sm:w-64"
              />
              <p className="text-sm uppercase tracking-[0.35em] text-primary">
                Rooted in togetherness
              </p>
              <p className="mt-3 text-lg font-semibold">
                Invite AI to handle the relentless logistics so you can stay
                soft, human, and present.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="group rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
            >
              <div className="flex items-center gap-3">
                <span className="rounded-full bg-primary/10 p-2 text-primary transition group-hover:scale-105 group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
                </span>
                <h3 className="text-lg font-semibold">{title}</h3>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{body}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
