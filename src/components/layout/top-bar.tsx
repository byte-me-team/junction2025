"use client"

import Link from "next/link"

import { ModeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { Sparkles } from "lucide-react"
import { ProfileButton } from "../ui/profile"

export const TopBar = () => {
  const { data: session } = useSession()
  const user = session?.user
  const { state } = useSidebar()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="text-muted-foreground" aria-label="Toggle navigation" />
        {state === "collapsed" ? (
          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-primary">
            <Sparkles className="h-4 w-4" aria-hidden />
            <div className="leading-tight">
              <p className="text-sm font-semibold">EverGreen</p>
              <p className="text-[11px] text-primary/80">Beyond Dystopia</p>
            </div>
          </div>
        ) : null}
      </div>
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="hidden text-right text-xs text-muted-foreground sm:block">
          <p>{user ? user.email : "Guest session"}</p>
          <p>{user ? "Ready for suggestions" : "Start onboarding"}</p>
        </div>
        {user ? (
          <Button asChild variant="outline" size="sm">
            <Link href="/auth/sign-out">Sign out</Link>
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        )}
        <ModeToggle />
        <ProfileButton />
      </div>
    </header>
  )
}
