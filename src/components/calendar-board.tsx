"use client"

import * as React from "react"
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  parseISO,
  startOfToday,
  startOfWeek,
} from "date-fns"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { logActivityHistory } from "@/lib/log-activity-history"
import { ScheduleActivityDialog } from "@/components/schedule-activity-dialog"

export type CalendarActivity = {
  id: string
  title: string
  note?: string | null
  partnerName?: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  source?: string | null
}

type CalendarBoardProps = { userId: string }

export function CalendarBoard({ userId }: CalendarBoardProps) {
  const today = startOfToday()
  const [activities, setActivities] = React.useState<CalendarActivity[]>([])
  const [draggedId, setDraggedId] = React.useState<string | null>(null)
  const [weekStart, setWeekStart] = React.useState<Date>(startOfWeek(today, { weekStartsOn: 1 }))
  const [selectedDate, setSelectedDate] = React.useState<Date>(weekStart)
  const [relatives, setRelatives] = React.useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = React.useState(false)

  const fetchActivities = React.useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/calendar-activities")
      const data = (await res.json().catch(() => null)) as { activities?: CalendarActivity[] }
      if (res.ok) {
        setActivities(data?.activities ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRelatives = React.useCallback(async () => {
    const res = await fetch(`/api/relative?userId=${userId}`)
    if (!res.ok) return
    const data = await res.json().catch(() => null)
    if (Array.isArray(data)) {
      setRelatives(data.map((item: any) => ({ id: item.id, name: item.name })))
    }
  }, [userId])

  React.useEffect(() => {
    fetchActivities()
    fetchRelatives()
  }, [fetchActivities, fetchRelatives])

  const weekDates = React.useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index))
  }, [weekStart])

  const tasksByDate = React.useMemo(() => {
    const map = new Map<string, CalendarActivity[]>()
    weekDates.forEach((date) => map.set(date.toDateString(), []))
    const unscheduled: CalendarActivity[] = []

    activities.forEach((activity) => {
      if (!activity.dueDate) {
        unscheduled.push(activity)
        return
      }
      const date = parseISO(activity.dueDate)
      const key = date.toDateString()
      if (!map.has(key)) {
        map.set(key, [])
      }
      map.set(key, [...(map.get(key) ?? []), activity])
    })

    return { map, unscheduled }
  }, [activities, weekDates])

  const handleDrop = React.useCallback(
    async (targetDate: Date | null) => {
      if (!draggedId) return
      const previous = activities
      const formatted = targetDate ? new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate()) : null
      setActivities((current) =>
        current.map((activity) =>
          activity.id === draggedId
            ? {
                ...activity,
                dueDate: formatted ? formatted.toISOString() : null,
              }
            : activity
        )
      )
      setDraggedId(null)
      try {
        await fetch(`/api/calendar-activities/${draggedId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dueDate: formatted ? formatted.toISOString() : null }),
        })
        fetchActivities()
      } catch {
        setActivities(previous)
      }
    },
    [activities, draggedId, fetchActivities]
  )

  const weekRangeLabel = React.useMemo(() => {
    const end = addDays(weekStart, 6)
    const sameMonth = weekStart.getMonth() === end.getMonth()
    return sameMonth
      ? `${format(weekStart, "MMM d")} – ${format(end, "d, yyyy")}`
      : `${format(weekStart, "MMM d")} – ${format(end, "MMM d, yyyy")}`
  }, [weekStart])

  const goToWeek = (delta: number) => setWeekStart((current) => addWeeks(current, delta))

  const goToToday = () => {
    const start = startOfWeek(today, { weekStartsOn: 1 })
    setWeekStart(start)
    setSelectedDate(start)
  }

  React.useEffect(() => {
    const end = addDays(weekStart, 6)
    if (!(selectedDate >= weekStart && selectedDate <= end)) {
      setSelectedDate(weekStart)
    }
  }, [selectedDate, weekStart])

  const todayKey = today.toDateString()
  const { map: dateMap, unscheduled } = tasksByDate
  const selectedTasks = React.useMemo(
    () => dateMap.get(selectedDate.toDateString()) ?? [],
    [dateMap, selectedDate]
  )

  const handleSendInvite = async (activity: CalendarActivity) => {
    await logActivityHistory({
      title: activity.title,
      description: activity.note ?? undefined,
      source: "calendar",
      partnerName: activity.partnerName ?? undefined,
      metadata: { scheduled: activity.dueDate },
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
          <p className="text-sm text-muted-foreground">
            Drag activities between days to reschedule. Drop into "Unscheduled" to clear a date.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => goToWeek(-1)}>
            Previous
          </Button>
          <Button variant="outline" size="sm" onClick={goToToday}>
            Today
          </Button>
          <Button variant="outline" size="sm" onClick={() => goToWeek(1)}>
            Next
          </Button>
        </div>
      </div>

      <div className="rounded-3xl border border-border/60 bg-card/80 p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-muted-foreground">Create</p>
            <p className="text-sm text-muted-foreground">Add an activity and drop it onto a day.</p>
          </div>
          <ScheduleActivityDialog
            triggerLabel="New activity"
            defaultTitle=""
            relatives={relatives}
            source="calendar"
            onScheduled={fetchActivities}
          />
        </div>
      </div>

      <div className="rounded-md border bg-card px-4 py-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{weekRangeLabel}</h2>
          <span className="text-sm text-muted-foreground">
            {activities.filter((task) => task.dueDate).length} scheduled | {unscheduled.length} unscheduled
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="grid min-w-[960px] grid-cols-[220px_repeat(7,minmax(0,1fr))] gap-3 pr-2">
          <div
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => handleDrop(null)}
            className="flex h-full min-h-[240px] flex-col rounded-md border border-dashed border-border bg-muted/40 p-3"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">Unscheduled</p>
              <span className="text-xs text-muted-foreground">{unscheduled.length}</span>
            </div>
            <div className="mt-3 space-y-2">
              {unscheduled.length === 0 ? (
                <p className="text-xs text-muted-foreground">Drag an activity here to clear its date.</p>
              ) : (
                unscheduled.map((task) => (
                  <button
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedId(task.id)}
                    onDragEnd={() => setDraggedId(null)}
                    className="w-full rounded-md bg-background px-3 py-2 text-left text-xs shadow-sm"
                  >
                    <p className="font-semibold text-foreground">{task.title}</p>
                    <p className="text-muted-foreground">
                      {task.partnerName ? `With ${task.partnerName}` : "Drag to assign a day"}
                    </p>
                  </button>
                ))
              )}
            </div>

          </div>

          {weekDates.map((date) => {
            const key = date.toDateString()
            const tasksForDate = dateMap.get(key) ?? []
            const isToday = key === todayKey
            const isSelected = isSameDay(date, selectedDate)

            return (
              <div
                key={key}
                onDragOver={(event) => event.preventDefault()}
                onDrop={() => handleDrop(date)}
                onClick={() => setSelectedDate(date)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    setSelectedDate(date)
                  }
                }}
                className={cn(
                  "flex h-full min-h-[240px] flex-col rounded-md border p-2 sm:p-3 transition",
                  draggedId ? "border-dashed" : "border-border",
                  isToday ? "bg-primary/5" : "bg-muted/20",
                  isSelected ? " border-primary shadow-sm ring-1 ring-primary" : "hover:bg-muted"
                )}
              >
                <div className="flex w-full items-center justify-between rounded-md px-1 py-1 text-left">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {format(date, "EEE")}
                    </p>
                    <p className="text-sm font-semibold text-foreground">
                      {format(date, "MMM d")}
                    </p>
                  </div>
                  <span className="text-xs text-muted-foreground">{tasksForDate.length}</span>
                </div>
                <div className="mt-3 flex-1 space-y-2">
                  {tasksForDate.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Drag activities here</p>
                  ) : (
                    tasksForDate.map((task) => (
                      <button
                        key={task.id}
                        draggable
                        onDragStart={() => setDraggedId(task.id)}
                        onDragEnd={() => setDraggedId(null)}
                        className="w-full rounded-md bg-background px-3 py-2 text-left text-xs shadow-sm"
                      >
                        <p className="font-semibold text-foreground">{task.title}</p>
                        <p className="text-muted-foreground">
                          {task.partnerName ? `With ${task.partnerName}` : task.note || "No details"}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )
          })
        }

        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans for {format(selectedDate, "PPP")}</CardTitle>
          <CardDescription>Tap “Send invite” to log the activity once you commit.</CardDescription>
        </CardHeader>
        <CardContent>
          {selectedTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing scheduled for this date.</p>
          ) : (
            <div className="space-y-3">
              {selectedTasks.map((activity) => (
                <div
                  key={activity.id}
                  className="rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold">{activity.title}</p>
                      {activity.partnerName ? (
                        <p className="text-xs text-muted-foreground">With {activity.partnerName}</p>
                      ) : null}
                      {activity.note ? (
                        <p className="text-xs text-muted-foreground">{activity.note}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Button size="sm" variant="outline" onClick={() => handleSendInvite(activity)}>
                        Send invite
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
