import type { DetourEvent } from '@discover/shared';

import { call, toResult, type SocialResult } from '@/features/social/apiClient';

function isEvent(value: unknown): value is DetourEvent {
  if (typeof value !== 'object' || value === null) return false;
  const e = value as Record<string, unknown>;
  return (
    [
      'id',
      'title',
      'kind',
      'theme',
      'description',
      'placeName',
      'area',
      'startsAt',
      'priceNote',
    ].every((key) => typeof e[key] === 'string') &&
    typeof e.latitude === 'number' &&
    typeof e.longitude === 'number' &&
    typeof e.free === 'boolean' &&
    (e.endsAt === null || typeof e.endsAt === 'string') &&
    !Number.isNaN(Date.parse(e.startsAt as string))
  );
}

export function parseEvents(body: unknown): DetourEvent[] | null {
  const events =
    typeof body === 'object' && body !== null ? (body as { events?: unknown }).events : null;
  return Array.isArray(events) && events.every(isEvent) ? events : null;
}

// Open to everyone: no session needed, and no position sent (the distance filter runs on the phone).
export async function fetchEvents(): Promise<SocialResult<DetourEvent[]>> {
  return toResult(await call('/events', 'GET', undefined, true), parseEvents);
}
