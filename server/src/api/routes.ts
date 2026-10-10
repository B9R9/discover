import type { PlacesStore } from './placesStore.ts';

export interface Reply {
  status: number;
  body: unknown;
}

const CITY_PLACES = /^\/cities\/([a-z0-9-]+)\/places$/;

// Only the path is read: the query string is ignored, so no position can reach the server through it.
export async function route(method: string, pathname: string, store: PlacesStore): Promise<Reply> {
  if (method !== 'GET') return { status: 405, body: { error: 'method_not_allowed' } };
  if (pathname === '/health') return { status: 200, body: { status: 'ok' } };
  if (pathname === '/cities') return { status: 200, body: await store.listCities() };

  const cityId = CITY_PLACES.exec(pathname)?.[1];
  if (cityId) {
    const places = await store.listPlaces(cityId);
    return places
      ? { status: 200, body: places }
      : { status: 404, body: { error: 'unknown_city' } };
  }
  return { status: 404, body: { error: 'not_found' } };
}
