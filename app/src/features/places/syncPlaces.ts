import type { City, CityId } from '@discover/shared';

import { listCachedCities, replaceCachedCities } from '@/db/citiesCache';
import { replaceCachedPlaces } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

import { findCity } from './findCity';
import { fetchCities, fetchCityPlaces } from './placesApi';

type Fetch = typeof fetch;

async function loadCities(db: Db, baseUrl: string, fetchFn: Fetch): Promise<City[]> {
  try {
    const cities = await fetchCities(baseUrl, fetchFn);
    await replaceCachedCities(db, cities, Date.now());
    return cities;
  } catch (error) {
    console.warn('Cities not refreshed, using the cache', error);
    return listCachedCities(db);
  }
}

// Refreshes places_cache for the city the phone is in. Offline or server down: the cache stays as is.
// Returns the city id, or null when the phone is in no known city or the refresh failed.
export async function syncPlaces(
  db: Db,
  position: GeoPoint,
  baseUrl: string | undefined = process.env.EXPO_PUBLIC_API_URL,
  fetchFn: Fetch = fetch,
): Promise<CityId | null> {
  if (!baseUrl) {
    console.warn('EXPO_PUBLIC_API_URL is missing, places not refreshed');
    return null;
  }
  const city = findCity(position, await loadCities(db, baseUrl, fetchFn));
  if (!city) return null;
  try {
    const places = await fetchCityPlaces(baseUrl, city.id, fetchFn);
    await replaceCachedPlaces(db, city.id, places, Date.now());
    return city.id;
  } catch (error) {
    console.warn(`Places of ${city.id} not refreshed, using the cache`, error);
    return null;
  }
}
