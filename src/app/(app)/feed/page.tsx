"use client"

import { useEffect, useMemo, useState } from "react"

import { useRequireAuth } from "@/lib/use-require-auth"

type ActivityHistory = {
  id: string
  title: string
  description?: string | null
  partnerName?: string | null
  source: "suggestion" | "real_event" | "relative" | "calendar"
  createdAt: string
  metadata?: Record<string, unknown> | null
}

const sourceLabels: Record<ActivityHistory["source"], string> = {
  suggestion: "AI suggestion",
  real_event: "Live event",
  relative: "Relative match",
  calendar: "Calendar",
}

export default function FeedPage() {
  const { isLoading, user } = useRequireAuth()
  const [items, setItems] = useState<ActivityHistory[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      setLoadingHistory(true)
      setError(null)
      try {
        const res = await fetch("/api/activity-history")
        if (!res.ok) {
          const payload = await res.json().catch(() => null)
          throw new Error(payload?.error ?? "Unable to load history")
        }
        const data = (await res.json().catch(() => null)) as {
          history?: ActivityHistory[]
        } | null
        setItems(data?.history ?? [])
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load history")
      } finally {
        setLoadingHistory(false)
      }
    }
    load()
  }, [user])

  const grouped = useMemo(() => {
    return items.reduce<Record<string, ActivityHistory[]>>((acc, item) => {
      const date = new Date(item.createdAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
      acc[date] = acc[date] ? [...acc[date], item] : [item]
      return acc
    }, {})
  }, [items])

  const stats = useMemo(() => {
    const total = items.length
    const perSource = items.reduce<Record<ActivityHistory["source"], number>>(
      (acc, item) => ({ ...acc, [item.source]: (acc[item.source] ?? 0) + 1 }),
      { suggestion: 0, real_event: 0, relative: 0, calendar: 0 }
    )
    return { total, perSource }
  }, [items])

  if (!user) return null

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading feed…</p>
      </main>
    )
  }

  return (
    <main className="px-6 py-10">
      <section className="space-y-6">
        <div>
          <p className="text-sm font-semibold text-primary">History</p>
          <h1 className="text-3xl font-semibold">Activity feed</h1>
          <p className="text-sm text-muted-foreground">
            Every invite or plan funnels into this log, so you can see who you reached out to and when.
          </p>
        </div>

        {loadingHistory ? (
          <p className="text-sm text-muted-foreground">Loading entries…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity yet. Generate a suggestion or invite a loved one to see it here.</p>
        ) : (
          <div className="space-y-6">
            <div className="rounded-3xl border border-border/60 bg-card/80 p-5">
              <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                Snapshot
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-4">
                <Statistic label="Total" value={stats.total} />
                <Statistic label="AI" value={stats.perSource.suggestion} />
                <Statistic label="Live events" value={stats.perSource.real_event} />
                <Statistic label="Relatives" value={stats.perSource.relative} />
              </div>
            </div>

            <div className="space-y-5">
              {Object.entries(grouped).map(([date, entries]) => (
                <div key={date}>
                  <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                    {date}
                  </p>
                  <div className="mt-2 space-y-3 border-l border-border/60 pl-6">
                    {entries.map((item) => (
                      <div
                        key={item.id}
                        className="relative rounded-3xl border border-border/50 bg-card/80 p-5 shadow-sm"
                      >
                        <span className="absolute left-[-25] top-0 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
                              {sourceLabels[item.source]}
                            </p>
                            <h2 className="text-xl font-semibold text-foreground">
                              {item.title}
                            </h2>
                            {item.partnerName ? (
                              <p className="text-sm text-muted-foreground">With {item.partnerName}</p>
                            ) : null}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {new Date(item.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        {item.description ? (
                          <p className="mt-3 text-sm text-muted-foreground">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  )
}

function Statistic({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-card/70 p-4">
      <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </div>
  )
}
