import type { City } from '@discover/shared';
import type { Position } from 'geojson';

import type { GeoPoint } from '@/db/types';

// Ray casting: count how many ring edges a ray going east from the point crosses.
function insideRing(point: GeoPoint, ring: Position[]): boolean {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi = 0, yi = 0] = ring[i] ?? [];
    const [xj = 0, yj = 0] = ring[j] ?? [];
    const crosses =
      yi > point.latitude !== yj > point.latitude &&
      point.longitude < ((xj - xi) * (point.latitude - yi)) / (yj - yi) + xi;
    if (crosses) inside = !inside;
  }
  return inside;
}

// A polygon is an outer ring followed by its holes.
function insideCity(point: GeoPoint, city: City): boolean {
  return city.boundary.coordinates.some(
    ([outer = [], ...holes]) =>
      insideRing(point, outer) && !holes.some((hole) => insideRing(point, hole)),
  );
}

// Runs on the phone: the position never leaves it, only the city id does.
export function findCity(point: GeoPoint, cities: readonly City[]): City | null {
  return cities.find((city) => insideCity(point, city)) ?? null;
}
