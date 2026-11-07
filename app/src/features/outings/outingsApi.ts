import type { DetourEvent, EventAttendance } from '@discover/shared';

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

function isAttendance(value: unknown): value is EventAttendance {
  if (typeof value !== 'object' || value === null) return false;
  const a = value as Record<string, unknown>;
  return (
    typeof a.eventId === 'string' &&
    typeof a.me === 'boolean' &&
    typeof a.others === 'number' &&
    Array.isArray(a.friends) &&
    a.friends.every((pseudo) => typeof pseudo === 'string')
  );
}

export function parseAttendance(body: unknown): EventAttendance[] | null {
  const list =
    typeof body === 'object' && body !== null
      ? (body as { attendance?: unknown }).attendance
      : null;
  return Array.isArray(list) && list.every(isAttendance) ? list : null;
}

// Needs an account: who goes is only told to the user and their friends.
export async function fetchAttendance(): Promise<SocialResult<EventAttendance[]>> {
  return toResult(await call('/events/attendance', 'GET'), parseAttendance);
}

export async function setGoing(eventId: string, going: boolean): Promise<SocialResult<true>> {
  return toResult(
    await call(`/events/${encodeURIComponent(eventId)}/going`, going ? 'PUT' : 'DELETE'),
    (): true => true,
  );
}
