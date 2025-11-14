import { OnboardingState } from "./onboarding-store";

export type CurrentUser = {
  email: string;
  name?: string;
  onboarding?: OnboardingState;
};

const STORAGE_KEY = "aging_with_ai_current_user";

const isBrowser = () => typeof window !== "undefined";

export const getCurrentUser = (): CurrentUser | null => {
  if (!isBrowser()) return null;
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as CurrentUser;
  } catch (error) {
    console.warn("Failed to parse current user", error);
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
};

export const setCurrentUser = (user: CurrentUser) => {
  if (!isBrowser()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
};

export const clearCurrentUser = () => {
  if (!isBrowser()) return;
  window.localStorage.removeItem(STORAGE_KEY);
};
