import type { AuthAdmin } from './authAdmin.ts';
import type { PlacesStore } from './placesStore.ts';

export interface Reply {
  status: number;
  body: unknown;
}

// Only method, path and the Authorization header are read: the query string is ignored,
// so no position can reach the server through it.
export interface Request {
  method: string;
  pathname: string;
  authorization?: string | undefined;
}

export interface Services {
  store: PlacesStore;
  // null when the server runs without Supabase Auth settings (local places-only setup).
  auth: AuthAdmin | null;
}

const AREA_PLACES = /^\/areas\/([a-z0-9-]+)\/places$/;
const BEARER = /^Bearer (\S+)$/;

async function deleteMe(authorization: string | undefined, auth: AuthAdmin | null): Promise<Reply> {
  if (!auth) return { status: 503, body: { error: 'auth_unavailable' } };
  const token = authorization ? BEARER.exec(authorization)?.[1] : undefined;
  const userId = token ? await auth.userIdFromToken(token) : null;
  if (!userId) return { status: 401, body: { error: 'unauthorized' } };
  await auth.deleteUser(userId);
  return { status: 204, body: null };
}

async function getRoute(pathname: string, store: PlacesStore): Promise<Reply> {
  if (pathname === '/health') return { status: 200, body: { status: 'ok' } };
  if (pathname === '/areas') return { status: 200, body: await store.listAreas() };

  const areaId = AREA_PLACES.exec(pathname)?.[1];
  if (areaId) {
    const places = await store.listPlaces(areaId);
    return places
      ? { status: 200, body: places }
      : { status: 404, body: { error: 'unknown_area' } };
  }
  return { status: 404, body: { error: 'not_found' } };
}

export function route(
  { method, pathname, authorization }: Request,
  services: Services,
): Promise<Reply> {
  if (pathname === '/me') {
    return method === 'DELETE'
      ? deleteMe(authorization, services.auth)
      : Promise.resolve({ status: 405, body: { error: 'method_not_allowed' } });
  }
  if (method !== 'GET')
    return Promise.resolve({ status: 405, body: { error: 'method_not_allowed' } });
  return getRoute(pathname, services.store);
}
