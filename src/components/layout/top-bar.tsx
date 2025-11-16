"use client"

import { ModeToggle } from "@/components/theme-toggle"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { useSession } from "next-auth/react"
import { Sparkles, Home } from "lucide-react"
import { ProfileButton } from "../ui/profile"
import Link from "next/link"

export const TopBar = () => {
  const { data: session } = useSession()
  const user = session?.user
  const { state } = useSidebar()

  return (
    <header className="flex h-16 items-center justify-between border-b border-border/60 bg-background/70 px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <SidebarTrigger
          className="h-11 w-11 rounded-full border border-primary/20 bg-background/90 p-2 text-primary shadow-sm shadow-primary/20 transition hover:border-primary/60 hover:-translate-y-0.5"
          aria-label="Toggle navigation"
        />

        {state === "collapsed" ? (
          <div className="flex min-w-0 flex-1">
            <Link
              href="/"
              className="group flex flex-wrap items-center gap-3 text-xl font-black uppercase tracking-[0.4em] text-primary transition hover:opacity-90 ml-2"
            >
              <Sparkles className="h-5 w-5 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
              <span className="bg-gradient-to-r from-primary to-emerald-400 bg-clip-text text-transparent">
                Evergreen
              </span>
            </Link>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <ModeToggle />

        {/* Home button */}
        <Link
          href="/dashboard"
          className="h-10 w-10 flex items-center justify-center rounded-full border border-primary/20 bg-background/90 p-2 text-primary shadow-sm shadow-primary/20 transition hover:border-primary/60 hover:-translate-y-0.5"
          aria-label="Go to dashboard"
        >
          <Home className="h-5 w-5" />
        </Link>

        <ProfileButton />
      </div>
    </header>
  )
}
