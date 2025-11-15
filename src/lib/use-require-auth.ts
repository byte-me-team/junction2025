"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "next-auth/react";

export const useRequireAuth = (redirectPath = "/auth/sign-in") => {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectPath);
    }
  }, [status, router, redirectPath]);

  return {
    user: session?.user ?? null,
    isLoading: status === "loading",
  };
};
