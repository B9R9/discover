import type { Sql } from '../db.ts';

export interface EventSeed {
  title: string;
  kind: string;
  theme: string;
  description: string;
  placeName: string;
  area: string;
  latitude: number;
  longitude: number;
  startsAt: string;
  endsAt: string | null;
  free: boolean;
  priceNote: string;
}

const text = (value: unknown, max: number, fallback?: string): string | null => {
  if (value === undefined && fallback !== undefined) return fallback;
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
    ? value.trim()
    : value === '' && fallback !== undefined
      ? ''
      : null;
};

const date = (value: unknown): string | null =>
  typeof value === 'string' &&
  !Number.isNaN(Date.parse(value)) &&
  /[zZ]|[+-]\d\d:?\d\d$/.test(value)
    ? value
    : null;

// One event of a seed file; null when something is missing or out of range.
export function parseEvent(value: unknown): EventSeed | null {
  if (typeof value !== 'object' || value === null) return null;
  const raw = value as Record<string, unknown>;
  const title = text(raw.title, 120);
  const kind = text(raw.kind, 40);
  const placeName = text(raw.placeName, 120);
  const theme = text(raw.theme, 80, '');
  const description = text(raw.description, 1000, '');
  const area = text(raw.area, 80, '');
  const priceNote = text(raw.priceNote, 80, '');
  const startsAt = date(raw.startsAt);
  const endsAt = raw.endsAt === undefined || raw.endsAt === null ? null : date(raw.endsAt);
  const { latitude, longitude, free } = raw;
  const valid =
    title !== null &&
    kind !== null &&
    placeName !== null &&
    theme !== null &&
    description !== null &&
    area !== null &&
    priceNote !== null &&
    startsAt !== null &&
    (raw.endsAt === undefined || raw.endsAt === null || endsAt !== null) &&
    typeof latitude === 'number' &&
    Math.abs(latitude) <= 90 &&
    typeof longitude === 'number' &&
    Math.abs(longitude) <= 180 &&
    (free === undefined || typeof free === 'boolean');
  if (!valid) return null;
  if (endsAt !== null && Date.parse(endsAt) <= Date.parse(startsAt)) return null;
  return {
    title,
    kind,
    theme,
    description,
    placeName,
    area,
    latitude,
    longitude,
    startsAt,
    endsAt,
    free: free ?? false,
    priceNote,
  };
}

export function parseEvents(value: unknown): EventSeed[] | null {
  if (!Array.isArray(value)) return null;
  const events = value.map(parseEvent);
  return events.every((event) => event !== null) ? (events as EventSeed[]) : null;
}

// Same title at the same start replaces the previous row, so a seed file can be run again after a fix.
export async function seedEvent(sql: Sql, e: EventSeed): Promise<void> {
  await sql`
    insert into events (title, kind, theme, description, place_name, area, latitude, longitude,
      starts_at, ends_at, free, price_note)
    values (${e.title}, ${e.kind}, ${e.theme}, ${e.description}, ${e.placeName}, ${e.area},
      ${e.latitude}, ${e.longitude}, ${e.startsAt}, ${e.endsAt}, ${e.free}, ${e.priceNote})
    on conflict (title, starts_at) do update set kind = excluded.kind, theme = excluded.theme,
      description = excluded.description, place_name = excluded.place_name, area = excluded.area,
      latitude = excluded.latitude, longitude = excluded.longitude, ends_at = excluded.ends_at,
      free = excluded.free, price_note = excluded.price_note`;
}
