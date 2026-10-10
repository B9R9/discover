import type { Area, AreaId } from '@discover/shared';

import { listCachedAreas, replaceCachedAreas } from '@/db/areasCache';
import { replaceCachedPlaces } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';
import { claimFreeMap, isUnlocked } from '@/features/maps/ownership';

import { findArea } from './findArea';
import { fetchAreas, fetchAreaPlaces } from './placesApi';

type Fetch = typeof fetch;

async function loadAreas(db: Db, baseUrl: string, fetchFn: Fetch): Promise<Area[]> {
  try {
    const areas = await fetchAreas(baseUrl, fetchFn);
    await replaceCachedAreas(db, areas, Date.now());
    return areas;
  } catch (error) {
    console.warn('Areas not refreshed, using the cache', error);
    return listCachedAreas(db);
  }
}

export type SyncResult = { kind: 'synced'; areaId: AreaId } | { kind: 'locked'; area: Area };

// Refreshes places_cache for the area the phone is in, if the user owns its map.
// Offline or server down: the cache stays as is.
// Returns null when the phone is in no known area or the refresh failed.
export async function syncPlaces(
  db: Db,
  position: GeoPoint,
  baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  fetchFn: Fetch = fetch,
): Promise<SyncResult | null> {
  if (!baseUrl) {
    console.warn('EXPO_PUBLIC_API_URL is missing, places not refreshed');
    return null;
  }
  const area = findArea(position, await loadAreas(db, baseUrl, fetchFn));
  if (!area) return null;
  if (!isUnlocked(area, await claimFreeMap(db, area, Date.now()))) return { kind: 'locked', area };
  try {
    const places = await fetchAreaPlaces(baseUrl, area.id, fetchFn);
    await replaceCachedPlaces(db, area.id, places, Date.now());
    return { kind: 'synced', areaId: area.id };
  } catch (error) {
    console.warn(`Places of ${area.id} not refreshed, using the cache`, error);
    return null;
  }
}
