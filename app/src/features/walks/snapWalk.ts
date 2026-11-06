import { MAX_WALK_POINTS } from '@discover/shared';

import { parseRoute } from '@/features/places/walkingRoute';

// Called from the app, like the route to a place: our server never sees the drawn points before the user publishes.
const ORS_URL = 'https://api.openrouteservice.org/v2/directions/foot-walking/geojson';

export type Stop = [longitude: number, latitude: number];

export interface SnappedWalk {
  path: Stop[];
  distanceMeters: number;
  durationSeconds: number;
}

export type SnapResult =
  | { kind: 'walk'; walk: SnappedWalk }
  | { kind: 'too-few-points' }
  | { kind: 'no-key' }
  | { kind: 'failed' };

// Keeps the first and last point and spreads the others evenly: the server refuses more than MAX_WALK_POINTS.
export function limitPoints(path: readonly Stop[], max = MAX_WALK_POINTS): Stop[] {
  if (path.length <= max) return [...path];
  const step = (path.length - 1) / (max - 1);
  return Array.from({ length: max }, (_, i) => path[Math.round(i * step)]!);
}

export async function snapWalk(
  stops: readonly Stop[],
  apiKey = process.env.EXPO_PUBLIC_ORS_KEY,
): Promise<SnapResult> {
  if (stops.length < 2) return { kind: 'too-few-points' };
  if (!apiKey) return { kind: 'no-key' };
  try {
    const response = await fetch(ORS_URL, {
      method: 'POST',
      headers: { Authorization: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: stops }),
    });
    if (!response.ok) return { kind: 'failed' };
    const route = parseRoute(await response.json());
    if (!route) return { kind: 'failed' };
    const path = limitPoints(route.line.coordinates.map(([lon, lat]): Stop => [lon!, lat!]));
    return {
      kind: 'walk',
      walk: { path, distanceMeters: route.distanceMeters, durationSeconds: route.durationSeconds },
    };
  } catch {
    return { kind: 'failed' };
  }
}
