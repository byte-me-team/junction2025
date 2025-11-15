import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { MarketingHeader } from "@/components/layout/marketing-header";
import {
  Compass,
  Crown,
  Share2,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const highlights: { title: string; body: string; icon: LucideIcon }[] = [
  {
    title: "Initiative is yours again",
    body: "EverGreen lets you pick pick the level of discovery, the ambiance and the guest list while we organise logistics in the background.",
    icon: Crown,
  },
  {
    title: "Gentle pushes toward new discoveries",
    body: "We suggest new activities, handle the planning, and inform you of relatives who would love to join.",
    icon: Compass,
  },
  {
    title: "Connect with Family",
    body: "Evergreen keeps kids and grandkids involved, confirms RSVPs, and syncs calendars so everyone is included.",
    icon: Share2,
  },
];

const partners = [
  {
    name: "Aalto University School of Science",
    tagline: "Hackathon challenge providers",
    description:
      "Evergreen is our answer to Aalto's challenge: build tools that advance their research into elevating the everyday life of older adults as the world around them accelerates.",
    logoLight: "/aalto_dark.png",
    logoDark: "/aalto_white.png",
    url: "https://www.aalto.fi/en/innovation-portfolio/ar4u",
  },
];

export default function Home() {
  return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-12 px-6 py-14 sm:py-20">
        <section className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-3 rounded-full border border-primary/30 px-4 py-2 text-xs font-semibold uppercase tracking-[0.5em] text-primary/80">
              <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
              evergreen
            </div>
            <div className="space-y-3">
              <h1 className="text-5xl font-black uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                EverGreen
              </h1>
              <p className="text-xl font-medium text-primary/90">
                There's no age limit for Utopia
              </p>
              <p className="text-base text-muted-foreground sm:text-lg">
                A subtle support for seniors wanting to reconnect their loved ones. We pair honest
                data with respectful AI nudges so being connected is as easy as it can be.
              </p>
              <p className="text-sm text-muted-foreground/80">
                Built at Junction 2025.
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
            <div className="relative rounded-[40px] border border-primary/30 bg-card/80 p-8 text-center shadow-xl shadow-primary/20 transition motion-safe:animate-[pulse_8s_ease-in-out_infinite]">
              <Image
                src="/evergreen.png"
                alt="Evergreen logo"
                priority
                width={256}
                height={256}
                className="mx-auto mb-6 h-auto w-52 sm:w-64"
              />
              <p className="text-sm uppercase tracking-[0.35em] text-primary">
                Rooted in friendship
              </p>
              <p className="mt-3 text-lg font-semibold">
                Allow AI to handle the logistics so you can be present.
              </p>
            </div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3">
          {highlights.map(({ title, body, icon: Icon }) => (
            <div
              key={title}
              className="group flex h-full flex-col rounded-2xl border border-border/70 bg-card/80 p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
            >
              <div className="flex min-h-[56px] items-start gap-3">
                <span className="rounded-full bg-primary/10 p-2 text-primary transition group-hover:scale-105 group-hover:bg-primary/20">
                  <Icon className="h-5 w-5 motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
                </span>
                <h3 className="text-lg font-semibold leading-tight">{title}</h3>
              </div>
              <p className="mt-4 flex-1 text-base leading-relaxed text-muted-foreground">
                {body}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 flex flex-col items-center gap-8 rounded-3xl border border-border/70 bg-card/60 p-8 text-center shadow-lg shadow-primary/10">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-primary">
              Our partners
            </p>
            <h2 className="text-3xl font-semibold">
              Research-backed collaborators
            </h2>
            <p className="text-sm text-muted-foreground sm:text-base">
              Aalto University School of Science frames our hackathon challenge,
              and Evergreen is built to accelerate their research into
              supporting elder wellbeing in an ever-changing world.
            </p>
          </div>
          <div className="flex w-full max-w-3xl flex-col items-center gap-6">
            {partners.map((partner) => (
              <Link
                key={partner.name}
                href={partner.url}
                target="_blank"
                rel="noreferrer"
                className="flex h-full flex-col items-center gap-6 rounded-3xl border border-border/70 bg-card/80 p-6 transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl hover:shadow-primary/20"
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="rounded-3xl border border-border/60 bg-background/90 p-4 shadow-sm">
                    <Image
                      src={partner.logoLight}
                      alt={`${partner.name} logo`}
                      width={360}
                      height={320}
                      className="block h-auto w-[320px] max-w-full dark:hidden"
                    />
                    <Image
                      src={partner.logoDark}
                      alt={`${partner.name} logo`}
                      width={360}
                      height={320}
                      className="hidden h-auto w-[320px] max-w-full dark:block"
                    />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xl font-semibold">{partner.name}</p>
                    <p className="text-xs uppercase tracking-[0.35em] text-primary">
                      {partner.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-base text-muted-foreground">
                  {partner.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
  );
}
