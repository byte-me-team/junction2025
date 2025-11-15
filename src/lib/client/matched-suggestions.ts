export type MatchedSuggestion = {
  id: string;
  eventId: string;
  reason: string;
  confidence: number;
  createdAt: string;
  event: {
    id: string;
    title: string;
    summary: string | null;
    startTime: string;
    endTime: string | null;
    location: string | null;
    price: string | null;
    sourceUrl: string | null;
  };
};

export type SuggestionMeta = {
  target: number;
  status: "idle" | "running";
  missing: number;
  refreshedAt: number | null;
};

export async function fetchMatchedSuggestions(email: string): Promise<{
  recommendations: MatchedSuggestion[];
  meta: SuggestionMeta;
}> {
  const response = await fetch("/api/suggestions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(payload?.error ?? "Failed to load suggestions");
  }

  const json = (await response.json()) as {
    recommendations: MatchedSuggestion[];
    meta: SuggestionMeta;
  };

  return {
    recommendations: [...json.recommendations].sort(
      (a, b) => b.confidence - a.confidence
    ),
    meta: {
      target: json.meta?.target ?? json.recommendations.length,
      status: (json.meta?.status ?? "idle") as SuggestionMeta["status"],
      missing: json.meta?.missing ?? 0,
      refreshedAt: json.meta?.refreshedAt ?? null,
    },
  };
}
