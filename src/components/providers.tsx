"use client";

import { SessionProvider } from "next-auth/react";
import type { PropsWithChildren } from "react";

import { ThemeProvider } from "@/components/theme-provider";

export function Providers({ children }: PropsWithChildren) {
  return (
    <SessionProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
