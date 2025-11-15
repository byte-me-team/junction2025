"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function SignOutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/" });
  }, []);

  return (
    <main className="px-6 py-10">
      <p className="text-sm text-muted-foreground">Signing you out…</p>
    </main>
  );
}
