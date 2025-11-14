"use client";

import {
  clearCurrentUser,
  getCurrentUser,
  setCurrentUser,
  type CurrentUser,
} from "@/lib/auth";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

type AuthContextValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  signIn: (email: string, payload?: Partial<CurrentUser>) => CurrentUser;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = getCurrentUser();
    if (stored) {
      setUser(stored);
    }
    setIsLoading(false);
  }, []);

  const signIn = useCallback(
    (email: string, payload?: Partial<CurrentUser>) => {
      setIsLoading(false);
      const baseline = user ?? getCurrentUser();
      const nextUser: CurrentUser = {
        email,
        name: payload?.name ?? baseline?.name ?? undefined,
        onboarding: payload?.onboarding ?? baseline?.onboarding ?? undefined,
      };
      setUser(nextUser);
      setCurrentUser(nextUser);
      return nextUser;
    },
    [user]
  );

  const signOut = useCallback(() => {
    clearCurrentUser();
    setUser(null);
    setIsLoading(false);
  }, []);

  const value = useMemo(
    () => ({ user, isLoading, signIn, signOut }),
    [user, isLoading, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
};
