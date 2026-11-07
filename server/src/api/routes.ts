import type { AuthAdmin } from './authAdmin.ts';
import { mapsRoute } from './maps.ts';
import type { MapsStore } from './mapsStore.ts';
import { placeSharesRoute } from './placeShares.ts';
import type { PlaceSharesStore } from './placeSharesStore.ts';
import type { PlacesStore } from './placesStore.ts';
import { postsRoute } from './posts.ts';
import type { PostsStore } from './postsStore.ts';
import { authenticate } from './session.ts';
import { spotsRoute } from './spots.ts';
import type { SpotsStore } from './spotsStore.ts';
import { walksRoute } from './walks.ts';
import type { WalksStore } from './walksStore.ts';
import { socialRoute } from './social.ts';
import type { SocialStore } from './socialStore.ts';
import type { StorageAdmin } from './storageAdmin.ts';

export interface Reply {
  status: number;
  body: unknown;
}

// Method, path, the Authorization header and the JSON body are read: the query string is ignored,
// so no position can reach the server through it.
export interface Request {
  method: string;
  pathname: string;
  authorization?: string | undefined;
  // Parsed JSON, undefined when the request had none or it was not valid JSON.
  body?: unknown;
}

export interface Services {
  store: PlacesStore;
  social: SocialStore;
  posts: PostsStore;
  maps: MapsStore;
  spots: SpotsStore;
  walks: WalksStore;
  placeShares: PlaceSharesStore;
  // null when the server runs without Supabase settings: sharing is then unavailable.
  storage: StorageAdmin | null;
  // null when the server runs without Supabase Auth settings (local places-only setup).
  auth: AuthAdmin | null;
}

const AREA_PLACES = /^\/areas\/([a-z0-9-]+)\/places$/;

// The photos go first: deleting the user removes the post rows, and with them the way to find the files.
async function deleteMe(
  authorization: string | undefined,
  { auth, posts, storage }: Services,
): Promise<Reply> {
  const user = await authenticate(authorization, auth);
  if (typeof user !== 'string') return user;
  await storage?.remove(await posts.listPaths(user));
  await auth?.deleteUser(user);
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

export async function route(request: Request, services: Services): Promise<Reply> {
  const signedIn =
    (await socialRoute(request, services)) ??
    (await mapsRoute(request, services)) ??
    (await spotsRoute(request, services)) ??
    (await walksRoute(request, services)) ??
    (await placeSharesRoute(request, services)) ??
    (await postsRoute(request, services));
  if (signedIn) return signedIn;
  return placesRoute(request, services);
}

function placesRoute(
  { method, pathname, authorization }: Request,
  services: Services,
): Promise<Reply> {
  if (pathname === '/me') {
    return method === 'DELETE'
      ? deleteMe(authorization, services)
      : Promise.resolve({ status: 405, body: { error: 'method_not_allowed' } });
  }
  if (method !== 'GET')
    return Promise.resolve({ status: 405, body: { error: 'method_not_allowed' } });
  return getRoute(pathname, services.store);
}
