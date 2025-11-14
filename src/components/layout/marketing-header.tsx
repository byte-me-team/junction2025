"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/auth-context";
import { ModeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Onboarding", href: "/onboarding" },
  { label: "Dashboard", href: "/dashboard" },
];

export const MarketingHeader = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header className="border-b border-border/50 bg-card/60 backdrop-blur supports-[backdrop-filter]:bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="text-lg font-semibold">
          Aging with AI
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "transition hover:text-foreground",
                pathname === link.href && "text-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ModeToggle />
          {user ? (
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">Open app</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/sign-in">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
