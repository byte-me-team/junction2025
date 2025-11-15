import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth-options"

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id?: string }> | { id?: string } }
) {
  const rawParams = context.params
  const resolvedParams = rawParams instanceof Promise ? await rawParams : rawParams
  const activityId = resolvedParams?.id

  if (!activityId) {
    return NextResponse.json({ error: "Activity id required" }, { status: 400 })
  }

  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = (await req.json().catch(() => ({}))) as {
    title?: string
    note?: string
    partnerName?: string
    dueDate?: string | null
  }

  const parsedDate = body.dueDate === undefined ? undefined : body.dueDate ? new Date(body.dueDate) : null

  const activity = await prisma.calendarActivity.updateMany({
    where: { id: activityId, userId: session.user.id },
    data: {
      title: body.title,
      note: body.note,
      partnerName: body.partnerName,
      dueDate: parsedDate,
    },
  })

  if (activity.count === 0) {
    return NextResponse.json({ error: "Activity not found" }, { status: 404 })
  }

  const updated = await prisma.calendarActivity.findUnique({ where: { id: activityId } })
  return NextResponse.json({ activity: updated })
}
