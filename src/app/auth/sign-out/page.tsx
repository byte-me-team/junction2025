"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-context";

export default function SignOutPage() {
  const router = useRouter();
  const { signOut } = useAuth();

  useEffect(() => {
    signOut();
    router.replace("/");
  }, [signOut, router]);

  return (
    <main className="px-6 py-10">
      <p className="text-sm text-muted-foreground">Signing you out…</p>
    </main>
  );
}
