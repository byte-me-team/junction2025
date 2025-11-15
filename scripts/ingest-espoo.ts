import "dotenv/config";

import { prisma } from "../src/lib/prisma";

const API_BASE = "https://api.hel.fi/linkedevents/v1/event/";
const WINDOW_DAYS = Number(process.env.ESPOO_EVENTS_WINDOW_DAYS ?? "10");
const MAX_EVENTS = Number(process.env.ESPOO_EVENTS_LIMIT ?? "200");
const RETENTION_DAYS = Number(
  process.env.ESPOO_EVENTS_RETENTION_DAYS ?? "30"
);

type LocalizedField = {
  fi?: string | null;
  en?: string | null;
  sv?: string | null;
  [key: string]: string | null | undefined;
};

type EspooEvent = {
  id: string;
  name?: LocalizedField;
  short_description?: LocalizedField;
  description?: LocalizedField;
  info_url?: LocalizedField | null;
  start_time?: string | null;
  end_time?: string | null;
  location?: {
    name?: LocalizedField;
    street_address?: LocalizedField;
    address_locality?: LocalizedField;
  } | null;
  keywords?: Array<{ name?: LocalizedField }>;
  offers?: Array<{
    price?: LocalizedField | null;
  }>;
};

const pickLocalized = (field?: LocalizedField | null) =>
  field?.en ?? field?.fi ?? field?.sv ?? null;

function buildWindowQuery() {
  const now = new Date();
  const end = new Date(now.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const params = new URLSearchParams({
    start: now.toISOString(),
    end: end.toISOString(),
    include: "location,keywords",
    sort: "start_time",
    language: "en",
    page_size: "100",
  });

  return `${API_BASE}?${params.toString()}`;
}

async function fetchEspooEvents(): Promise<EspooEvent[]> {
  let url: string | null = buildWindowQuery();
  const events: EspooEvent[] = [];

  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to fetch Espoo events: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as { data: EspooEvent[]; meta?: { next?: string | null } };
    for (const event of data.data) {
      if (!event.start_time) continue;
      if (!isEspooEvent(event)) continue;
      events.push(event);
      if (events.length >= MAX_EVENTS) {
        return events;
      }
    }

    url = data.meta?.next ?? null;
  }

  return events;
}

function isEspooEvent(event: EspooEvent) {
  const locality = pickLocalized(event.location?.address_locality)?.toLowerCase();
  if (locality?.includes("espoo")) return true;
  // fallback: if name mentions Espoo
  const locationName = pickLocalized(event.location?.name)?.toLowerCase();
  return locationName?.includes("espoo") ?? false;
}

async function main() {
  const now = new Date();
  let removed = 0;
  if (RETENTION_DAYS >= 0) {
    const cutoff = new Date(
      now.getTime() - RETENTION_DAYS * 24 * 60 * 60 * 1000
    );
    const result = await prisma.event.deleteMany({
      where: {
        startTime: { lt: cutoff },
      },
    });
    removed = result.count;
  }

  const events = await fetchEspooEvents();
  console.log(`Fetched ${events.length} Espoo events from Linked Events API`);

  let upserts = 0;
  for (const evt of events) {
    const normalized = normalizeEvent(evt);
    if (!normalized) continue;

    await prisma.event.upsert({
      where: { sourceId: normalized.sourceId },
      create: normalized,
      update: {
        title: normalized.title,
        description: normalized.description,
        summary: normalized.summary,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        locationName: normalized.locationName,
        locationAddress: normalized.locationAddress,
        city: normalized.city,
        price: normalized.price,
        tags: normalized.tags,
        sourceUrl: normalized.sourceUrl,
        rawJson: normalized.rawJson,
      },
    });
    upserts += 1;
  }

  console.log(`Upserted ${upserts} events. Removed ${removed} old events.`);
}

function normalizeEvent(event: EspooEvent) {
  if (!event.start_time) return null;

  const startTime = new Date(event.start_time);
  if (Number.isNaN(startTime.getTime())) return null;

  const title = pickLocalized(event.name) ?? "Untitled event";
  const summary = pickLocalized(event.short_description) ?? null;
  const description = pickLocalized(event.description) ?? summary ?? null;
  const locationName = pickLocalized(event.location?.name) ?? null;
  const locationAddress = pickLocalized(event.location?.street_address) ?? null;
  const city = pickLocalized(event.location?.address_locality) ?? null;
  const price = pickLocalized(event.offers?.[0]?.price) ?? null;
  const sourceUrl = pickLocalized(event.info_url) ?? null;
  const tags = (event.keywords ?? [])
    .map((kw) => pickLocalized(kw.name))
    .filter((tag): tag is string => Boolean(tag));

  const endTime = event.end_time ? new Date(event.end_time) : null;

  return {
    sourceId: event.id,
    title,
    description,
    summary,
    startTime,
    endTime: endTime && !Number.isNaN(endTime.getTime()) ? endTime : null,
    locationName,
    locationAddress,
    city,
    price,
    tags,
    sourceUrl,
    rawJson: event,
  };
}

main()
  .catch((error) => {
    console.error("Failed to ingest Espoo events", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
