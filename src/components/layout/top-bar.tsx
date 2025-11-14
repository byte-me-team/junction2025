"use client"

import Link from "next/link"

import { useAuth } from "@/components/auth/auth-context"
import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"

export const TopBar = () => {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" aria-label="Toggle navigation" />
        <div className="leading-tight">
          <p className="text-sm font-semibold">Aging with AI</p>
          <p className="text-xs text-muted-foreground">
            Hackathon frontend scaffold
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <p>{user ? user.email : "Guest session"}</p>
          <p>{user ? "Ready for suggestions" : "Start onboarding"}</p>
        </div>
        <ModeToggle />
        {user ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/sign-out">Sign out</Link>
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
