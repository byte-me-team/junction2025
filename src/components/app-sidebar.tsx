"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import * as React from "react"

import {
  Bell,
  CalendarDays,
  HeartHandshake,
  LayoutDashboard,
  LifeBuoy,
  LogIn,
  LogOut,
  NotebookPen,
  Sparkles,
  UserPlus,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"

type NavItem = {
  title: string
  url: string
  disabled?: boolean
  match?: (path: string) => boolean
  icon?: LucideIcon
}

type NavSection = {
  title: string
  items: NavItem[]
}

const baseSections: NavSection[] = [
  {
    title: "Your spaces",
    items: [
      { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
      { title: "Calendar", url: "/calendar", icon: CalendarDays },
    ],
  },
  {
    title: "Suggestions",
    items: [
      { title: "All suggestions", url: "/suggestions", icon: Sparkles },
      { title: "Activity feed", url: "/feed", icon: NotebookPen },
      { title: "Shared plans", url: "/plans", icon: HeartHandshake },
    ],
  },
  {
    title: "Care circle",
    items: [
      { title: "Invite a relative", url: "/invite", icon: UserPlus },
      { title: "Loved Ones", url: "/relative", icon: HeartHandshake },
      { title: "Reminders", url: "/reminders", icon: Bell },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const user = session?.user

  const sections = React.useMemo<NavSection[]>(() => {
    const accountItems: NavItem[] = user
      ? [{ title: "Sign out", url: "/auth/sign-out", icon: LogOut }]
      : [
          { title: "Sign in", url: "/auth/sign-in", icon: LogIn },
          { title: "Support", url: "#support", disabled: true, icon: LifeBuoy },
        ]
    return [...baseSections, { title: "Account", items: accountItems }]
  }, [user])

  const isActive = React.useCallback(
    (item: NavItem) => {
      if (item.match) return item.match(pathname)
      if (item.url.includes("#")) {
        return pathname === item.url.split("#")[0]
      }
      return pathname === item.url || pathname.startsWith(`${item.url}/`)
    },
    [pathname]
  )

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3 text-white transition-all group-data-[state=collapsed]/sidebar-wrapper:justify-center group-data-[state=collapsed]/sidebar-wrapper:px-0">
          <Sparkles className="h-6 w-6 text-white" aria-hidden />
          <div className="group-data-[state=collapsed]:hidden">
            <p className="text-lg font-semibold tracking-wide text-white">
              EverGreen
            </p>
            <p className="text-xs text-white/70">Beyond Dystopia</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {sections.slice(0, -1).map((section) => (
          <SidebarGroup key={section.title} className="pb-1 first:pt-2">
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={!item.disabled}
                      aria-disabled={item.disabled}
                      isActive={!item.disabled && isActive(item)}
                      tooltip={item.title}
                    >
                      {item.disabled ? (
                        <span className="flex items-center gap-3 text-muted-foreground/70">
                          {item.icon ? (
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                          ) : null}
                          <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">
                            {item.title}
                          </span>
                        </span>
                      ) : (
                        <Link
                          href={item.url}
                          className="flex items-center gap-3"
                        >
                          {item.icon ? (
                            <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                          ) : null}
                          <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">
                            {item.title}
                          </span>
                        </Link>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border/30 px-4 py-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              tooltip="Sign out"
              isActive={false}
            >
              {user ? (
                <Link href="/auth/sign-out" className="flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">
                    Sign out
                  </span>
                </Link>
              ) : (
                <Link href="/auth/sign-in" className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span className="group-data-[state=collapsed]/sidebar-wrapper:hidden">
                    Sign in
                  </span>
                </Link>
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-3 rounded-2xl bg-sidebar-accent/40 p-3 text-xs text-white group-data-[state=collapsed]:hidden">
          <p className="font-semibold flex items-center gap-2">
            <Sparkles className="h-3 w-3" aria-hidden />
            Stay inspired
          </p>
          <p className="text-sm">{user?.email ?? "Guest session"}</p>
          <p className="mt-1 opacity-70">See fresh nudges daily.</p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
