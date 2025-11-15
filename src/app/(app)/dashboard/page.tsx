"use client";

import Link from "next/link";
import Image from "next/image";
import type { ComponentType } from "react";
import {
  Activity,
  CalendarDays,
  HeartHandshake,
  Map,
  Notebook,
  NotebookPen,
  Sparkles,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRequireAuth } from "@/lib/use-require-auth";

type DashboardTile = {
  title: string;
  subtitle: string;
  href: string;
  accent: string;
  badge?: string;
  cols?: string;
  rows?: string;
  icon?: ComponentType<{ className?: string }>;
  hero?: "icon" | "image";
  imageSrc?: string;
  imageAlt?: string;
  disabled?: boolean;
};

const tiles: DashboardTile[] = [
  {
    title: "Suggestions",
    subtitle: "AI plans & events",
    href: "/suggestions",
    accent: "from-primary/25 via-primary/5 to-transparent",
    badge: "Live ideas",
    cols: "lg:col-span-2",
    rows: "lg:row-span-2",
    hero: "image",
    imageSrc: "/evergreen.png",
    imageAlt: "Evergreen logo",
  },
  {
    title: "Calendar",
    subtitle: "Ritual anchors",
    href: "/calendar",
    accent: "from-cyan-400/20 via-cyan-400/10 to-transparent",
    cols: "lg:col-span-2",
    hero: "icon",
    icon: CalendarDays,
  },
  {
    title: "Loved ones",
    subtitle: "Care circles",
    href: "/relative",
    accent: "from-fuchsia-400/20 via-fuchsia-400/10 to-transparent",
    cols: "lg:col-span-2",
    hero: "icon",
    icon: HeartHandshake,
  },
  {
    title: "Health log",
    subtitle: "Vitals & meds",
    href: "/health",
    accent: "from-rose-400/20 via-rose-400/10 to-transparent",
    cols: "lg:col-span-2",
    hero: "icon",
    icon: Activity,
  },
  {
    title: "Invite team",
    subtitle: "Send links",
    href: "/invite",
    accent: "from-emerald-400/20 via-emerald-400/10 to-transparent",
    hero: "icon",
    icon: Users,
  },
  {
    title: "Activity Log",
    subtitle: "History feed",
    href: "/feed",
    accent: "from-border/60 via-card/70 to-card/80",
    badge: "Coming soon",
    hero: "icon",
    icon: NotebookPen,
    disabled: true,
  },
];

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <div className="mx-auto w-full max-w-7xl">
          <p className="text-sm text-muted-foreground">Loading your dashboard…</p>
        </div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <main>
      <section>
        <div className="space-y-6">
          <div className="space-y-2">
            <p className="text-sm font-semibold text-primary">
              Welcome back, {user.name || user.email}
            </p>
            <h1 className="text-3xl font-semibold">Command center</h1>
            <p className="text-base text-muted-foreground">
              Tap a tile to jump into planning, live events, or team rituals. Evergreen keeps the logistics stitched together while you pick the vibe.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 [grid-auto-rows:minmax(180px,_auto)]">
            {tiles.map((tile) =>
              tile.disabled ? (
                <TileCard key={tile.title} tile={tile} disabled />
              ) : (
                <TileCard key={tile.title} tile={tile} />
              )
            )}
          </div>

          <div className="rounded-3xl border border-border/60 bg-card/80 p-6 text-sm text-muted-foreground shadow-lg">
            <p>
              Looking for deeper customization? Head to the{" "}
              <Link className="font-semibold text-primary" href="/profile">
                profile studio
              </Link>{" "}
              to tweak care preferences.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

function TileCard({
  tile,
  disabled = false,
}: {
  tile: DashboardTile;
  disabled?: boolean;
}) {
  const { title, subtitle, href, accent, badge, cols, rows, hero, icon: Icon, imageSrc, imageAlt } =
    tile;

  const baseClasses = cn(
    "group relative flex h-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/90 p-5 shadow-[0_12px_30px_rgba(15,23,42,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_35px_rgba(15,23,42,0.15)]",
    disabled && "cursor-not-allowed opacity-60 hover:translate-y-0 hover:shadow-[0_12px_30px_rgba(15,23,42,0.12)]",
    cols ?? "",
    rows ?? ""
  );

  const content = (
    <>
      <div
        className={cn(
          "pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br opacity-60 transition group-hover:opacity-90",
          accent
        )}
      />
      <div className="flex flex-1 items-center justify-center">
        <div className="relative flex h-28 w-full items-center justify-center">
          <div className="absolute inset-0 m-auto h-20 w-20 rounded-full bg-primary/10 blur-2xl transition group-hover:scale-110" />
          {hero === "image" && imageSrc ? (
            <Image
              src={imageSrc}
              alt={imageAlt ?? title}
              width={500}
              height={500}
              className="relative h-60 w-60 object-contain"
              priority
            />
          ) : Icon ? (
            <Icon className="absolute inset-0 m-auto h-26 w-26 text-primary/70 transition group-hover:scale-105" />
          ) : null}
        </div>
      </div>
      <div className="absolute mt-auto space-y-1">
        <h2 className="text-xl font-semibold">{title}</h2>
        <p className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground">
          {subtitle}
        </p>
        {!disabled && (
          <p className="pt-1 text-sm font-semibold text-primary">
            Explore →
          </p>
        )}
        
      </div>

      {badge ? (
        <span className="w-fit rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
          {badge}
        </span>
      ) : null}
    </>
  );

  if (disabled) {
    return (
      <div className={baseClasses} aria-disabled>
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={baseClasses}>
      {content}
    </Link>
  );
}
