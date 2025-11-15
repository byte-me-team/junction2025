"use client";

import type { PropsWithChildren } from "react";

export default function RelativeInviteLayout({ children }: PropsWithChildren) {
  return <div className="min-h-screen bg-background text-foreground">{children}</div>;
}
