import type { GeoPoint } from '@/db/types';

import { distanceMeters, toMeters } from '@/lib/geo';

// Above this gap, two points are not one walk (tracking paused, GPS lost): never reveal the straight line between them.
export const MAX_GAP_METERS = 200;
const SIMPLIFY_TOLERANCE_METERS = 5;

export function splitWalks(points: readonly GeoPoint[]): GeoPoint[][] {
  const walks: GeoPoint[][] = [];
  let current: GeoPoint[] = [];
  for (const point of points) {
    const previous = current[current.length - 1];
    if (previous && distanceMeters(previous, point) > MAX_GAP_METERS) {
      walks.push(current);
      current = [];
    }
    current.push(point);
  }
  if (current.length > 0) walks.push(current);
  return walks;
}

// Douglas-Peucker: drops points that deviate less than the tolerance, so long walks stay cheap to draw.
export function simplify(points: readonly GeoPoint[]): GeoPoint[] {
  if (points.length < 3) return [...points];
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const ranges: [number, number][] = [[0, points.length - 1]];
  for (let range = ranges.pop(); range; range = ranges.pop()) {
    const [first, last] = range;
    const [start, end] = [points[first], points[last]];
    if (!start || !end) continue;
    let farthest = 0;
    let farthestIndex = 0;
    for (let i = first + 1; i < last; i++) {
      const point = points[i];
      if (!point) continue;
      const distance = distanceToSegment(point, start, end);
      if (distance > farthest) {
        farthest = distance;
        farthestIndex = i;
      }
    }
    if (farthest > SIMPLIFY_TOLERANCE_METERS) {
      keep[farthestIndex] = 1;
      ranges.push([first, farthestIndex], [farthestIndex, last]);
    }
  }
  return points.filter((_, i) => keep[i] === 1);
}

function distanceToSegment(point: GeoPoint, a: GeoPoint, b: GeoPoint): number {
  const p = toMeters(a, point);
  const end = toMeters(a, b);
  const lengthSquared = end.x * end.x + end.y * end.y;
  const ratio =
    lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, (p.x * end.x + p.y * end.y) / lengthSquared));
  return Math.hypot(p.x - ratio * end.x, p.y - ratio * end.y);
}
