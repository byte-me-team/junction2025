"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { useAuth } from "@/components/auth/auth-context"
import { SearchForm } from "@/components/search-form"
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
}

type NavSection = {
  title: string
  items: NavItem[]
}

const baseSections: NavSection[] = [
  {
    title: "Your spaces",
    items: [
      { title: "Dashboard", url: "/dashboard" },
      { title: "Calendar (soon)", url: "#calendar", disabled: true },
    ],
  },
  {
    title: "Suggestions",
    items: [
      { title: "Activity feed", url: "#feed", disabled: true },
      { title: "Shared plans", url: "#plans", disabled: true },
    ],
  },
  {
    title: "Care circle",
    items: [
      { title: "Invite a relative", url: "/dashboard#invite" },
      { title: "Reminders", url: "/dashboard#reminders" },
    ],
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const { user } = useAuth()

  const sections = React.useMemo<NavSection[]>(() => {
    const accountItems: NavItem[] = user
      ? [{ title: "Sign out", url: "/auth/sign-out" }]
      : [{ title: "Sign in", url: "/auth/sign-in" }]
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
    <Sidebar {...props}>
      <SidebarHeader className="gap-3">
        <div className="space-y-0.5 px-2">
          <p className="text-sm font-semibold">Aging with AI</p>
          <p className="text-xs text-muted-foreground">
            Activity planning for seniors & families
          </p>
        </div>
        <SearchForm placeholder="Search activities (soon)" />
      </SidebarHeader>
      <SidebarContent>
        {sections.map((section) => (
          <SidebarGroup key={section.title}>
            <SidebarGroupLabel>{section.title}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    {item.disabled ? (
                      <SidebarMenuButton asChild aria-disabled>
                        <span className="cursor-not-allowed opacity-60">
                          {item.title}
                        </span>
                      </SidebarMenuButton>
                    ) : (
                      <SidebarMenuButton asChild isActive={isActive(item)}>
                        <Link href={item.url}>{item.title}</Link>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-border/40 px-4 py-4">
        <div className="rounded-2xl border border-border/50 bg-sidebar p-4 text-sm">
          <p className="font-semibold text-foreground">Signed in as</p>
          <p className="text-muted-foreground">{user?.email ?? "Guest"}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            We&apos;ll sync this info with the backend onboarding API soon.
          </p>
        </div>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
