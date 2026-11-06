import { MAX_SHARED_PLACES, type SharedMap } from '@discover/shared';

import type { Reply, Request, Services } from './routes.ts';
import { authenticate } from './session.ts';

const FRIEND_MAP = /^\/friends\/([a-z0-9_]+)\/map$/;
const MAX_PLACE_ID_LENGTH = 120;

const error = (status: number, code: string): Reply => ({ status, body: { error: code } });
const NO_CONTENT: Reply = { status: 204, body: null };

// Valid ids only, without duplicates; null when the body is not a list of ids or is too long.
function placeIdsOf(body: unknown): string[] | null {
  const value =
    typeof body === 'object' && body !== null ? (body as Record<string, unknown>).placeIds : null;
  if (!Array.isArray(value) || value.length > MAX_SHARED_PLACES) return null;
  const ids = value.every(
    (id) => typeof id === 'string' && id.length > 0 && id.length <= MAX_PLACE_ID_LENGTH,
  );
  // Personal places never leave the phone: refuse them instead of silently dropping them.
  return ids && !value.some((id: string) => id.startsWith('personal:'))
    ? [...new Set(value)]
    : null;
}

// Answers the shared-map routes; null when the path is not one of them.
export async function mapsRoute(
  { method, pathname, authorization, body }: Request,
  { auth, maps }: Services,
): Promise<Reply | null> {
  const friend = FRIEND_MAP.exec(pathname);
  if (pathname !== '/me/map' && !friend) return null;

  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;

  if (friend) {
    if (method !== 'GET') return error(405, 'method_not_allowed');
    const map = await maps.getFriend(user, friend[1] ?? '');
    if (!map) return error(404, 'no_map');
    const shared: SharedMap = map;
    return { status: 200, body: shared };
  }

  if (method === 'GET') {
    const map = await maps.get(user);
    return map
      ? { status: 200, body: { count: map.placeIds.length, updatedAt: map.updatedAt } }
      : error(404, 'no_map');
  }
  if (method === 'PUT') {
    const placeIds = placeIdsOf(body);
    if (!placeIds) return error(422, 'invalid_map');
    return (await maps.save(user, placeIds)) ? NO_CONTENT : error(409, 'profile_required');
  }
  if (method === 'DELETE') {
    await maps.remove(user);
    return NO_CONTENT;
  }
  return error(405, 'method_not_allowed');
}
