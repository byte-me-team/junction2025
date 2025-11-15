export type ActivityHistoryPayload = {
  title: string
  description?: string
  source: "suggestion" | "real_event" | "relative" | "calendar"
  partnerName?: string
  metadata?: Record<string, unknown>
}

export async function logActivityHistory(payload: ActivityHistoryPayload) {
  try {
    await fetch("/api/activity-history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
  } catch (error) {
    console.error("Failed to record activity history", error)
  }
}
