import { MAX_WALK_METERS, MAX_WALK_POINTS } from '@discover/shared';

export type WalkPath = [number, number][];

const EARTH_RADIUS_METERS = 6_371_000;
const WALK_SPEED_METERS_PER_SECOND = 1.25;
const radians = (degrees: number) => (degrees * Math.PI) / 180;

function haversine([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const a =
    Math.sin(radians(lat2 - lat1) / 2) ** 2 +
    Math.cos(radians(lat1)) * Math.cos(radians(lat2)) * Math.sin(radians(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

// A list of [longitude, latitude] pairs, or null when it is not one or is too long.
export function parsePath(value: unknown): WalkPath | null {
  if (!Array.isArray(value) || value.length < 2 || value.length > MAX_WALK_POINTS) return null;
  const path: WalkPath = [];
  for (const point of value) {
    if (!Array.isArray(point) || point.length !== 2) return null;
    const [lon, lat] = point as unknown[];
    if (typeof lon !== 'number' || typeof lat !== 'number') return null;
    if (
      !Number.isFinite(lon) ||
      !Number.isFinite(lat) ||
      Math.abs(lon) > 180 ||
      Math.abs(lat) > 90
    ) {
      return null;
    }
    path.push([lon, lat]);
  }
  return path;
}

export interface WalkMetrics {
  distanceMeters: number;
  durationSeconds: number;
}

// Computed here, never taken from the client. Null when the walk is empty or longer than the limit.
export function measure(path: WalkPath): WalkMetrics | null {
  let meters = 0;
  for (let i = 1; i < path.length; i++) meters += haversine(path[i - 1]!, path[i]!);
  const distanceMeters = Math.round(meters);
  if (distanceMeters < 1 || distanceMeters > MAX_WALK_METERS) return null;
  return {
    distanceMeters,
    durationSeconds: Math.round(distanceMeters / WALK_SPEED_METERS_PER_SECOND),
  };
}
