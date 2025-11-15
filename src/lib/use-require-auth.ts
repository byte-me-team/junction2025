"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/components/auth/auth-context";

export const useRequireAuth = (redirectPath = "/auth/sign-in") => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace(redirectPath);
    }
  }, [user, isLoading, router, redirectPath]);

  return { user, isLoading };
};