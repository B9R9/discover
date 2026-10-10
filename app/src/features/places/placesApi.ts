import type { City, CityId, Place } from '@discover/shared';

type Fetch = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isCity(value: unknown): value is City {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    isRecord(value.boundary) &&
    value.boundary.type === 'MultiPolygon' &&
    Array.isArray(value.boundary.coordinates)
  );
}

function isPlace(value: unknown): value is Place {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.cityId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    (typeof value.category === 'string' || value.category === null)
  );
}

// fetch has no timeout of its own: on a bad network it can hang for good.
const TIMEOUT_MS = 10_000;

async function getList<T>(
  baseUrl: string,
  path: string,
  isItem: (value: unknown) => value is T,
  fetchFn: Fetch,
): Promise<T[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let body: unknown;
  try {
    const response = await fetchFn(`${baseUrl}${path}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
    body = await response.json();
  } finally {
    clearTimeout(timer);
  }
  if (!Array.isArray(body) || !body.every(isItem)) throw new Error(`GET ${path}: unexpected reply`);
  return body;
}

// No position is ever sent: only the city id, in the path.
export function fetchCities(baseUrl: string, fetchFn: Fetch = fetch): Promise<City[]> {
  return getList(baseUrl, '/cities', isCity, fetchFn);
}

export function fetchCityPlaces(
  baseUrl: string,
  cityId: CityId,
  fetchFn: Fetch = fetch,
): Promise<Place[]> {
  return getList(baseUrl, `/cities/${encodeURIComponent(cityId)}/places`, isPlace, fetchFn);
}
