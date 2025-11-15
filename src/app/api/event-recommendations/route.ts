import { NextRequest, NextResponse } from "next/server";

import { randomUUID } from "crypto";

import { prisma } from "@/lib/prisma";
import {
  callFeatherlessEventKeywords,
  type NormalizedPreferences,
} from "@/lib/featherless";

const LINKED_EVENTS_BASE_URL =
  "https://espooevents.prod.espoon-voltti.fi/api/events/v1/event/";

type LinkedEventsResponse = {
  data?: any[];
};

function formatRelatives(relatives: { id: string; name: string; email: string | null }[]) {
  return relatives.map((relative) => ({
    id: relative.id,
    name: relative.name,
    email:
      relative.email ??
      `${relative.name.split(" ")[0]?.toLowerCase() ?? "invitee"}@example.com`,
  }));
}

function normalizeEvent(event: any) {
  const title =
    event?.name?.en ??
    event?.name?.fi ??
    event?.name?.sv ??
    "Untitled event";
  const description =
    event?.short_description?.en ??
    event?.short_description?.fi ??
    event?.description?.intro ??
    event?.description?.en ??
    event?.description?.fi ??
    "";
  const locationName =
    (typeof event?.location_extra_info === "string"
      ? event.location_extra_info
      : null) ??
    event?.location_extra_info?.en ??
    event?.location_extra_info?.fi ??
    (typeof event?.location === "string" ? event.location : null) ??
    "Espoo";
  const infoUrl =
    event?.info_url?.en ??
    event?.info_url?.fi ??
    event?.external_links?.[0]?.link ??
    null;

  return {
    id: event?.id ?? randomUUID(),
    title,
    description,
    locationName,
    startTime: event?.start_time ?? null,
    endTime: event?.end_time ?? null,
    infoUrl,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json()) as { email?: string };

    if (!email) {
      return NextResponse.json(
        { error: "email is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: { preferences: true },
    });

    if (!user?.preferences) {
      return NextResponse.json(
        { error: "User must complete onboarding first" },
        { status: 400 }
      );
    }

    const [suggestions, relatives] = await Promise.all([
      prisma.generalSuggestion.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.relative.findMany({
        where: { userId: user.id },
        orderBy: { name: "asc" },
      }),
    ]);

    const acceptedTitles = suggestions
      .filter((item) => item.status === "accepted")
      .map((item) => item.title)
      .slice(0, 5);
    const rejectedTitles = suggestions
      .filter((item) => item.status === "rejected")
      .map((item) => item.title)
      .slice(0, 5);

    let keywordPlan;
    console.log("[events]Generating keywords for", email);
    try {
      keywordPlan = await callFeatherlessEventKeywords({
        preferences: user.preferences
          .normalizedJson as unknown as NormalizedPreferences,
        acceptedTitles,
        rejectedTitles,
      });
      console.log("[events]Keyword plan", keywordPlan);
    } catch (err) {
      console.error("Keyword generation failed, falling back to defaults:", err);
      keywordPlan = {
        keywords: ["culture", "outdoor"],
      };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    const startMs = start.getTime();
    const endMs = end.getTime();

    const params = new URLSearchParams({
      start: start.toISOString(),
      end: end.toISOString(),
      page_size: "3",
      sort: "end_time",
      language: "en",
    });

    if (user.city) {
      params.append("division", encodeURIComponent(user.city));
    }

    if (keywordPlan.keywords.length > 0) {
      params.append("q", keywordPlan.keywords.join(" "));
    }

    let remoteEvents: LinkedEventsResponse;
    try {
      console.log("[events]Calling Linked Events with params", params.toString());
      const response = await fetch(
        `${LINKED_EVENTS_BASE_URL}?${params.toString()}`,
        { cache: "no-store" }
      );
      if (!response.ok) {
        throw new Error(`Failed to query Linked Events: ${response.status}`);
      }
      remoteEvents = (await response.json()) as LinkedEventsResponse;
      console.log("[events]Linked Events returned", remoteEvents?.data?.length ?? 0);
    } catch (err) {
      console.error("Linked Events fetch failed", err);
      return NextResponse.json(
        { error: "Failed to fetch Espoo events" },
        { status: 502 }
      );
    }

    const rawEvents = remoteEvents.data ?? [];
    const withinWindow = rawEvents.filter((event) => {
      const startTime = event?.start_time ? new Date(event.start_time).getTime() : null;
      return (
        typeof startTime === "number" &&
        startTime >= startMs &&
        startTime <= endMs
      );
    });

    const selectedEvents =
      withinWindow.length > 0 ? withinWindow.slice(0, 3) : rawEvents.slice(0, 3);
    const formattedEvents = selectedEvents.map(normalizeEvent);

    return NextResponse.json(
      {
        events: formattedEvents,
        relatives: formatRelatives(relatives),
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("POST /api/event-recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to load events" },
      { status: 500 }
    );
  }
}
