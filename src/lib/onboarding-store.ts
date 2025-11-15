export type PreferredTime = "morning" | "afternoon" | "evening" | "any";
export type SocialPreference = "alone" | "small_group" | "family" | "any";

export type BasicInfo = {
  name: string;
  email: string;
  password: string;
  city: string;
};

export type PreferenceInfo = {
  enjoyList: string[];
  dislikeList: string[];
  travelDistanceKm: number;
  preferredTime: PreferredTime;
  socialPreference: SocialPreference;
  adventurous: "yes" | "no" | "sometimes";
};

export type OnboardingState = {
  basicInfo: BasicInfo;
  preferences: PreferenceInfo;
};

export const createEmptyOnboardingState = (): OnboardingState => ({
  basicInfo: {
    name: "",
    email: "",
    password: "",
    city: "",
  },
  preferences: {
    enjoyList: [],
    dislikeList: [],
    travelDistanceKm: 5,
    preferredTime: "any",
    socialPreference: "any",
    adventurous: "sometimes",
  },
});
