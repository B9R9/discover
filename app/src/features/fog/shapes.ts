import type { GeoPoint } from '@/db/types';
import { fromMeters, toMeters } from '@/lib/geo';

// GeoJSON order: [longitude, latitude].
export type Position = [number, number];
export type Ring = Position[];

// Sides of a full circle. A side strays from the true circle by radius × (1 - cos(π / sides)): under 1 m here.
const CIRCLE_SIDES = 32;
const CAPSULE_SIDES = 16;

function arc(
  center: GeoPoint,
  origin: GeoPoint,
  radius: number,
  sides: number,
  [from, to]: [number, number],
): Ring {
  const offset = toMeters(origin, center);
  const steps = Math.ceil((sides * (to - from)) / (2 * Math.PI));
  const ring: Ring = [];
  for (let i = 0; i <= steps; i++) {
    const angle = from + ((to - from) * i) / steps;
    ring.push(
      fromMeters(origin, offset.x + radius * Math.cos(angle), offset.y + radius * Math.sin(angle)),
    );
  }
  return ring;
}

function closed(ring: Ring): Ring {
  const [start] = ring;
  return start ? [...ring, start] : ring;
}

export function circle(center: GeoPoint, radius: number): Ring {
  // The arc ends where it starts, up to float error: replace its last point by the exact first one.
  return closed(arc(center, center, radius, CIRCLE_SIDES, [0, 2 * Math.PI]).slice(0, -1));
}

// Stadium shape: every point within `radius` of the segment [a, b].
export function capsule(a: GeoPoint, b: GeoPoint, radius: number): Ring {
  const { x, y } = toMeters(a, b);
  if (x === 0 && y === 0) return circle(a, radius);
  const half = Math.PI / 2;
  const heading = Math.atan2(y, x);
  return closed([
    ...arc(b, a, radius, CAPSULE_SIDES, [heading - half, heading + half]),
    ...arc(a, a, radius, CAPSULE_SIDES, [heading + half, heading + 3 * half]),
  ]);
}
