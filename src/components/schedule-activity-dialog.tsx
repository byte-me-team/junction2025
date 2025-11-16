"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarDays } from "lucide-react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"

export type ScheduleRelative = { id: string; name: string }

type ScheduleActivityDialogProps = {
  triggerLabel: string
  defaultTitle: string
  defaultDescription?: string
  defaultPartner?: string
  source: "suggestion" | "real_event" | "relative" | "calendar"
  sourceId?: string
  relatives: ScheduleRelative[]
  onScheduled?: () => void
  triggerVariant?: React.ComponentProps<typeof Button>["variant"]
  triggerSize?: React.ComponentProps<typeof Button>["size"]
  triggerClassName?: string
}

export function ScheduleActivityDialog({
  triggerLabel,
  defaultTitle,
  defaultDescription,
  defaultPartner,
  source,
  sourceId,
  relatives,
  onScheduled,
  triggerVariant = "outline",
  triggerSize = "sm",
  triggerClassName,
}: ScheduleActivityDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [title, setTitle] = React.useState(defaultTitle)
  const [note, setNote] = React.useState(defaultDescription ?? "")
  const [partnerId, setPartnerId] = React.useState<string>("")
  const [partnerName, setPartnerName] = React.useState(defaultPartner ?? "")
  const [date, setDate] = React.useState<Date>()
  const [submitting, setSubmitting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = React.useState(false)
  const disableBefore = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  }, [])

  React.useEffect(() => {
    setTitle(defaultTitle)
    setNote(defaultDescription ?? "")
    setPartnerName(defaultPartner ?? "")
    setDate(undefined)
    setCalendarOpen(false)
  }, [defaultTitle, defaultDescription, defaultPartner, open])

  const handleSubmit = async () => {
    if (!title.trim() || !date) {
      setError("Please add a title and pick a date")
      return
    }
    if (!partnerName.trim()) {
      setError("Please add a partner")
      return
    }
    setSubmitting(true)
    setError(null)
    const partner = partnerId
      ? relatives.find((rel) => rel.id === partnerId)?.name ?? partnerName
      : partnerName
    const formattedDate = new Date(format(date, "yyyy-MM-dd")).toISOString()
    try {
      const res = await fetch("/api/calendar-activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          note: note.trim() || undefined,
          partnerName: partner?.trim() || undefined,
          dueDate: formattedDate,
          source,
          sourceId,
        }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => null)
        throw new Error(payload?.error ?? "Unable to schedule activity")
      }
      setOpen(false)
      setDate(undefined)
      setPartnerId("")
      setPartnerName(defaultPartner ?? "")
      if (onScheduled) onScheduled()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type="button"
          variant={triggerVariant}
          size={triggerSize}
          className={cn(triggerClassName)}
        >
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="space-y-4">
        <DialogHeader>
          <DialogTitle>Schedule activity</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Title</label>
          <input
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Partner</label>
          <select
            value={partnerId}
            onChange={(event) => {
              const id = event.target.value
              setPartnerId(id)

              if (id) {
                const selected = relatives.find((r) => r.id === id)
                setPartnerName(selected?.name ?? "")
              } else {
                setPartnerName("")
              }
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Custom</option>
            {relatives.map((relative) => (
              <option key={relative.id} value={relative.id}>
                {relative.name}
              </option>
            ))}
          </select>
          {partnerId === "" ? (
            <input
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
              value={partnerName}
              onChange={(event) => setPartnerName(event.target.value)}
              placeholder="Alto, family, etc"
            />
          ) : null}
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Notes</label>
          <textarea
            className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Optional context"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground">Date</label>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-muted/30 px-4 py-3 text-left text-sm font-medium text-foreground shadow-sm transition hover:border-primary/60"
            onClick={() => setCalendarOpen((prev) => !prev)}
          >
            <span className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-wide">Pick a day</span>
              <span>{date ? format(date, "PPP") : "Tap to select a future date"}</span>
            </span>
            <CalendarDays className="h-5 w-5 text-primary" />
          </button>
          {calendarOpen ? (
            <div
              className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
              onClick={() => setCalendarOpen(false)}
            >
              <div
                className="inline-block rounded-3xl border border-border/60 bg-popover p-4 text-popover-foreground shadow-2xl shadow-primary/25"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Pick a day
                  </p>
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-wide text-primary hover:text-primary/80"
                    onClick={() => setCalendarOpen(false)}
                  >
                    Close
                  </button>
                </div>
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(day) => {
                    setDate(day ?? undefined)
                    if (day) setCalendarOpen(false)
                  }}
                  disabled={{ before: disableBefore }}
                  initialFocus
                  className="rounded-2xl border border-border/60 bg-background p-4"
                />
              </div>
            </div>
          ) : null}
          <div className="pt-2 text-xs text-muted-foreground">
            {date ? `Scheduled for ${format(date, "PPP")}` : "Select a future date to continue."}
          </div>
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : "Save to calendar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
