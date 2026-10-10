import type { Area, AreaId, Place } from '@discover/shared';

import { fetchWithTimeout } from '@/lib/fetchWithTimeout';

type Fetch = typeof fetch;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isArea(value: unknown): value is Area {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.name === 'string' &&
    (typeof value.departmentId === 'string' || value.departmentId === null) &&
    isRecord(value.boundary) &&
    value.boundary.type === 'MultiPolygon' &&
    Array.isArray(value.boundary.coordinates)
  );
}

function isPlace(value: unknown): value is Place {
  return (
    isRecord(value) &&
    typeof value.id === 'string' &&
    typeof value.areaId === 'string' &&
    typeof value.name === 'string' &&
    typeof value.latitude === 'number' &&
    typeof value.longitude === 'number' &&
    (typeof value.category === 'string' || value.category === null)
  );
}

async function getList<T>(
  baseUrl: string,
  path: string,
  isItem: (value: unknown) => value is T,
  fetchFn: Fetch,
): Promise<T[]> {
  const response = await fetchWithTimeout(`${baseUrl}${path}`, {}, fetchFn);
  if (!response.ok) throw new Error(`GET ${path} answered ${response.status}`);
  const body: unknown = JSON.parse(response.text);
  if (!Array.isArray(body) || !body.every(isItem)) throw new Error(`GET ${path}: unexpected reply`);
  return body;
}

// No position is ever sent: only the area id, in the path.
export function fetchAreas(baseUrl: string, fetchFn: Fetch = fetch): Promise<Area[]> {
  return getList(baseUrl, '/areas', isArea, fetchFn);
}

export function fetchAreaPlaces(
  baseUrl: string,
  areaId: AreaId,
  fetchFn: Fetch = fetch,
): Promise<Place[]> {
  return getList(baseUrl, `/areas/${encodeURIComponent(areaId)}/places`, isPlace, fetchFn);
}
