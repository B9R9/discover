import { SPOT_GENRES } from '@discover/shared';

import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';
import type { SubmitOutcome } from './spotsStore.ts';

const SPOT = /^\/spots\/([^/]{1,120})$/;
const MAX_NAME_LENGTH = 120;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });
const NO_CONTENT: Reply = { status: 204, body: null };

const SUBMIT_REPLIES: Record<SubmitOutcome, Reply> = {
  ok: { status: 201, body: null },
  profile_required: error(409, 'profile_required'),
  exists: error(409, 'already_proposed'),
  too_many: error(429, 'too_many_pending'),
};

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : null;
}

function inRange(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

function spotOf(body: unknown) {
  const placeId = field(body, 'placeId');
  const name = field(body, 'name');
  const genre = field(body, 'genre');
  const latitude = field(body, 'latitude');
  const longitude = field(body, 'longitude');
  const valid =
    typeof placeId === 'string' &&
    placeId.startsWith('personal:') &&
    placeId.length <= 120 &&
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.trim().length <= MAX_NAME_LENGTH &&
    typeof genre === 'string' &&
    (SPOT_GENRES as readonly string[]).includes(genre) &&
    inRange(latitude, 90) &&
    inRange(longitude, 180);
  return valid ? { placeId, name: name.trim(), genre, latitude, longitude } : null;
}

// Answers the spot routes; null when the path is not one of them.
export async function spotsRoute(
  { method, pathname, authorization, body }: Request,
  { auth, spots }: Services,
): Promise<Reply | null> {
  const spot = SPOT.exec(pathname);
  if (pathname !== '/spots' && pathname !== '/spots/mine' && !spot) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (pathname === '/spots') {
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const input = spotOf(body);
    return input ? SUBMIT_REPLIES[await spots.submit(user, input)] : error(422, 'invalid_spot');
  }
  if (pathname === '/spots/mine') {
    return method === 'GET'
      ? { status: 200, body: { spots: await spots.listMine(user) } }
      : error(405, 'method_not_allowed');
  }
  const placeId = decodeURIComponent(spot?.[1] ?? '');
  if (method !== 'DELETE') return error(405, 'method_not_allowed');
  return (await spots.withdraw(user, placeId)) ? NO_CONTENT : error(404, 'no_proposal');
}
