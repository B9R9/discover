import type { DetourEvent } from '@discover/shared';

import type { GeoPoint } from '@/db/types';
import { distanceMeters } from '@/lib/geo';

export interface OutingFilters {
  evening: boolean;
  weekend: boolean;
  free: boolean;
}

export interface Outing {
  event: DetourEvent;
  // Straight-line meters from the user; null when the position is unknown.
  distance: number | null;
}

export const RADIUS_METERS = 15_000;
const EVENING_FROM_HOUR = 17;
// Six days: on a Saturday, next Saturday is another weekend.
const WEEKEND_WINDOW_MS = 6 * 24 * 3_600_000;
const DEFAULT_DURATION_MS = 3 * 3_600_000;

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

function endOf(event: DetourEvent): number {
  return event.endsAt ? Date.parse(event.endsAt) : Date.parse(event.startsAt) + DEFAULT_DURATION_MS;
}

// "Ce soir": starts today from 17:00, or is on right now. "Week-end": a Saturday or Sunday within six days.
function matches(event: DetourEvent, filters: OutingFilters, now: Date): boolean {
  const start = new Date(event.startsAt);
  if (filters.free && !event.free) return false;
  if (filters.evening) {
    const onNow = start <= now && endOf(event) >= now.getTime();
    const tonight = sameDay(start, now) && start.getHours() >= EVENING_FROM_HOUR;
    if (!onNow && !tonight) return false;
  }
  if (filters.weekend) {
    const day = start.getDay();
    const soon = start.getTime() - now.getTime() < WEEKEND_WINDOW_MS;
    if ((day !== 0 && day !== 6) || !soon) return false;
  }
  return true;
}

// Events not over, inside the radius when the position is known, soonest first.
export function filterOutings(
  events: readonly DetourEvent[],
  filters: OutingFilters,
  now: Date,
  here: GeoPoint | null,
): Outing[] {
  return events
    .filter((event) => endOf(event) >= now.getTime() && matches(event, filters, now))
    .map((event) => ({
      event,
      distance: here ? distanceMeters(here, event) : null,
    }))
    .filter(({ distance }) => distance === null || distance <= RADIUS_METERS)
    .sort((a, b) => Date.parse(a.event.startsAt) - Date.parse(b.event.startsAt));
}
