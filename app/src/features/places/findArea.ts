import type { Area } from '@discover/shared';
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
function insideArea(point: GeoPoint, area: Area): boolean {
  return area.boundary.coordinates.some(
    ([outer = [], ...holes]) =>
      insideRing(point, outer) && !holes.some((hole) => insideRing(point, hole)),
  );
}

// Runs on the phone: the position never leaves it, only the area id does.
export function findArea(point: GeoPoint, areas: readonly Area[]): Area | null {
  return areas.find((area) => insideArea(point, area)) ?? null;
}
