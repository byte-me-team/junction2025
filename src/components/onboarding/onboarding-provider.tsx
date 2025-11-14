"use client";

import {
  BasicInfo,
  OnboardingState,
  PreferenceInfo,
  createEmptyOnboardingState,
} from "@/lib/onboarding-store";
import {
  Dispatch,
  PropsWithChildren,
  SetStateAction,
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";

type OnboardingContextValue = {
  state: OnboardingState;
  setState: Dispatch<SetStateAction<OnboardingState>>;
  updateBasicInfo: (updates: Partial<BasicInfo>) => void;
  updatePreferences: (updates: Partial<PreferenceInfo>) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined
);

export const OnboardingProvider = ({ children }: PropsWithChildren) => {
  const [state, setState] = useState<OnboardingState>(
    () => createEmptyOnboardingState()
  );

  const updateBasicInfo = useCallback((updates: Partial<BasicInfo>) => {
    setState((prev) => ({
      ...prev,
      basicInfo: {
        ...prev.basicInfo,
        ...updates,
      },
    }));
  }, []);

  const updatePreferences = useCallback(
    (updates: Partial<PreferenceInfo>) => {
      setState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          ...updates,
        },
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setState(createEmptyOnboardingState());
  }, []);

  const value = useMemo(
    () => ({ state, setState, updateBasicInfo, updatePreferences, reset }),
    [state, updateBasicInfo, updatePreferences, reset]
  );

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return ctx;
};
