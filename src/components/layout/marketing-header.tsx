"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  CalendarDays,
  Home,
  LayoutDashboard,
  NotebookPen,
  Sparkles,
  UserPlus,
  Users,
  HeartHandshake,
} from "lucide-react";

import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";

const navLinks = [
  { label: "Home", href: "/", icon: Home },
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

export const MarketingHeader = () => {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  return (
    <header className="relative border-b border-primary/20 bg-gradient-to-r from-primary/15 via-card/70 to-background/80 shadow-lg shadow-primary/10 backdrop-blur supports-[backdrop-filter]:bg-transparent">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.3),_transparent)] opacity-80" />
      <div className="relative flex w-full items-center justify-between gap-6 px-6 py-5">
        <div className="flex min-w-0 flex-1">
          <Link
            href="/"
            className="group flex flex-wrap items-center gap-3 text-2xl font-black uppercase tracking-[0.4em] text-primary transition hover:opacity-90"
          >
            <Sparkles className="h-6 w-6 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
            <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
              Evergreen
            </span>
          </Link>
        </div>
        <nav className="flex flex-1 justify-center gap-3 overflow-x-auto text-base font-semibold text-muted-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-full border border-transparent px-4 py-2 transition hover:border-primary/40 hover:text-foreground whitespace-nowrap",
                pathname === link.href && "border-primary/60 text-foreground shadow-sm shadow-primary/10"
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" aria-hidden />
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-1 items-center justify-end gap-3">
          <Link
            href={isAuthenticated ? "/dashboard" : "/auth/sign-in"}
            className={cn(
              "flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-base font-semibold text-foreground shadow-sm shadow-primary/20 transition hover:border-primary/60 hover:-translate-y-0.5",
              !isAuthenticated && "text-primary"
            )}
          >
            {isAuthenticated ? "Open app" : "Sign in"}
          </Link>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
};
