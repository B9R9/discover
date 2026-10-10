import type { PlaceId } from '@discover/shared';

import { getDiscovery } from '@/db/discoveries';
import { listPlacesWithDiscovery } from '@/db/placesCache';
import type { Db, GeoPoint } from '@/db/types';

// Called from the app, never from our server: the server must not see where the user is.
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export interface WalkingRoute {
  line: GeoJSON.LineString;
  distanceMeters: number;
  durationSeconds: number;
}

export type RouteResult =
  | { kind: 'route'; route: WalkingRoute }
  | { kind: 'not-discovered' }
  | { kind: 'no-key' }
  | { kind: 'failed' };

export async function fetchWalkingRoute(
  db: Db,
  from: GeoPoint,
  placeId: PlaceId,
  apiKey = process.env.EXPO_PUBLIC_ORS_KEY,
): Promise<RouteResult> {
  // Business rule: an undiscovered place never gets a route, whatever the caller does.
  if (!(await getDiscovery(db, placeId))) return { kind: 'not-discovered' };
  if (!apiKey) return { kind: 'no-key' };
  const place = (await listPlacesWithDiscovery(db)).find((cached) => cached.id === placeId);
  if (!place) return { kind: 'failed' };

  try {
    const response = await fetch(ORS_URL, {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        coordinates: [
          [from.longitude, from.latitude],
          [place.longitude, place.latitude],
        ],
      }),
    });
    if (!response.ok) return { kind: 'failed' };
    const route = parseRoute(await response.json());
    return route ? { kind: 'route', route } : { kind: 'failed' };
  } catch {
    return { kind: 'failed' };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isPosition(value: unknown): value is [number, number] {
  return Array.isArray(value) && value.length >= 2 && value.every((n) => typeof n === 'number');
}

export function parseRoute(body: unknown): WalkingRoute | null {
  if (!isRecord(body) || !Array.isArray(body.features)) return null;
  const [feature] = body.features as unknown[];
  if (!isRecord(feature) || !isRecord(feature.geometry) || !isRecord(feature.properties)) {
    return null;
  }
  const { geometry, properties } = feature;
  const summary = properties.summary;
  if (
    geometry.type !== 'LineString' ||
    !Array.isArray(geometry.coordinates) ||
    !geometry.coordinates.every(isPosition) ||
    !isRecord(summary) ||
    typeof summary.distance !== 'number' ||
    typeof summary.duration !== 'number'
  ) {
    return null;
  }
  return {
    line: { type: 'LineString', coordinates: geometry.coordinates },
    distanceMeters: summary.distance,
    durationSeconds: summary.duration,
  };
}
