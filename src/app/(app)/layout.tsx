"use client";

import { PropsWithChildren } from "react";

import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function CalendarLayout({
  children,
}: PropsWithChildren) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background">
        <TopBar />
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
