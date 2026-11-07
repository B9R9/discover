import { MAX_SHARE_COMMENT, MAX_SHARE_FRIENDS, SPOT_GENRES } from '@discover/shared';

import type { ShareOutcome } from './placeSharesStore.ts';
import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';

const SHARE = /^\/place-shares\/([0-9a-f-]{36})$/;
const MAX_NAME_LENGTH = 120;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });

const CREATE_REPLIES: Record<ShareOutcome, Reply> = {
  ok: { status: 201, body: null },
  profile_required: error(409, 'profile_required'),
  not_friends: error(403, 'not_friends'),
  too_many: error(429, 'too_many_shares'),
};

function field(body: unknown, name: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[name] : null;
}

function inRange(value: unknown, limit: number): value is number {
  return typeof value === 'number' && Number.isFinite(value) && Math.abs(value) <= limit;
}

function shareOf(body: unknown) {
  const name = field(body, 'name');
  const genre = field(body, 'genre') ?? null;
  const latitude = field(body, 'latitude');
  const longitude = field(body, 'longitude');
  const comment = field(body, 'comment') ?? '';
  const pseudos = field(body, 'pseudos');
  const valid =
    typeof name === 'string' &&
    name.trim().length > 0 &&
    name.trim().length <= MAX_NAME_LENGTH &&
    (genre === null ||
      (typeof genre === 'string' && (SPOT_GENRES as readonly string[]).includes(genre))) &&
    inRange(latitude, 90) &&
    inRange(longitude, 180) &&
    typeof comment === 'string' &&
    comment.length <= MAX_SHARE_COMMENT &&
    Array.isArray(pseudos) &&
    pseudos.length > 0 &&
    pseudos.length <= MAX_SHARE_FRIENDS &&
    pseudos.every((pseudo) => typeof pseudo === 'string') &&
    new Set(pseudos).size === pseudos.length;
  return valid
    ? {
        name: name.trim(),
        genre: genre as string | null,
        latitude,
        longitude,
        comment: comment.trim(),
        pseudos: pseudos as string[],
      }
    : null;
}

// Answers the place-share routes; null when the path is not one of them.
export async function placeSharesRoute(
  { method, pathname, authorization, body }: Request,
  { auth, placeShares }: Services,
): Promise<Reply | null> {
  const share = SHARE.exec(pathname);
  if (pathname !== '/place-shares' && !share) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (pathname === '/place-shares') {
    if (method === 'GET') return { status: 200, body: { places: await placeShares.list(user) } };
    if (method !== 'POST') return error(405, 'method_not_allowed');
    const input = shareOf(body);
    return input
      ? CREATE_REPLIES[await placeShares.create(user, input)]
      : error(422, 'invalid_share');
  }
  if (method !== 'DELETE') return error(405, 'method_not_allowed');
  return (await placeShares.remove(user, share?.[1] ?? ''))
    ? { status: 204, body: null }
    : error(404, 'unknown_share');
}
