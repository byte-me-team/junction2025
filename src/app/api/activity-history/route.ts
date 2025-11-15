import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"

import { prisma } from "@/lib/prisma"
import { authOptions } from "@/lib/auth-options"

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { title, description, source, partnerName, metadata } = (await req.json().catch(
    () => ({})
  )) as {
    title?: string
    description?: string
    source?: "suggestion" | "real_event" | "relative" | "calendar"
    partnerName?: string
    metadata?: Record<string, unknown>
  }

  if (!title || !source) {
    return NextResponse.json(
      { error: "title and source are required" },
      { status: 400 }
    )
  }

  const entry = await prisma.activityHistory.create({
    data: {
      userId: session.user.id,
      title,
      description,
      source,
      partnerName,
      metadata,
    },
  })

  return NextResponse.json({ history: entry }, { status: 201 })
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const history = await prisma.activityHistory.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json({ history })
}
