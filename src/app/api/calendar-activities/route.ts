import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { startOfWeek } from "date-fns"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth-options"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const userId = session.user.id
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })

  const overdue = await prisma.calendarActivity.findMany({
    where: {
      userId,
      dueDate: { lt: start },
    },
  })

  if (overdue.length) {
    await prisma.$transaction(async (tx) => {
      for (const entry of overdue) {
        await tx.activityHistory.create({
          data: {
            userId,
            title: entry.title,
            description: entry.note,
            partnerName: entry.partnerName,
            source: entry.source ?? "calendar",
            metadata: entry.metadata,
          },
        })
        await tx.calendarActivity.delete({ where: { id: entry.id } })
      }
    })
  }

  const activities = await prisma.calendarActivity.findMany({
    where: { userId },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  })

  return NextResponse.json({ activities })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, note, partnerName, dueDate, source, sourceId, metadata } = (await req.json().catch(
    () => ({})
  )) as {
    title?: string
    note?: string
    partnerName?: string
    dueDate?: string | null
    source?: string
    sourceId?: string
    metadata?: Record<string, unknown>
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  const parsedDate = dueDate ? new Date(dueDate) : null

  const activity = await prisma.calendarActivity.create({
    data: {
      userId: session.user.id,
      title,
      note,
      partnerName,
      dueDate: parsedDate,
      source: source ? (source as any) : undefined,
      sourceId,
      metadata,
    },
  })

  return NextResponse.json({ activity }, { status: 201 })
}
