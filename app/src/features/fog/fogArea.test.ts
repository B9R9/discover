import type { GeoPoint } from '@/db/types';

import { buildFog, walkShapes } from './fogArea';
import type { FogGrid } from './fogGrid';
import { distanceMeters } from '@/lib/geo';

const BISCARROSSE = { latitude: 44.3944, longitude: -1.1636 };
const METERS_PER_DEGREE = 111_320;

function north(point: GeoPoint, meters: number): GeoPoint {
  return { ...point, latitude: point.latitude + meters / METERS_PER_DEGREE };
}

function east(point: GeoPoint, meters: number): GeoPoint {
  const cos = Math.cos((point.latitude * Math.PI) / 180);
  return { ...point, longitude: point.longitude + meters / (METERS_PER_DEGREE * cos) };
}

function insideRing(ring: GeoJSON.Position[], { longitude: x, latitude: y }: GeoPoint): boolean {
  let inside = false;
  let previous = ring[ring.length - 1];
  for (const current of ring) {
    const [xi = 0, yi = 0] = current;
    const [xj = 0, yj = 0] = previous ?? current;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    previous = current;
  }
  return inside;
}

function isFogged(grid: FogGrid, point: GeoPoint): boolean {
  return grid
    .fog()
    .coordinates.some(
      ([outer = [], ...holes]) =>
        insideRing(outer, point) && !holes.some((hole) => insideRing(hole, point)),
    );
}

test('a discovered place reveals 150 m around it, nothing more', () => {
  const fog = buildFog([BISCARROSSE], []);
  expect(isFogged(fog, BISCARROSSE)).toBe(false);
  expect(isFogged(fog, north(BISCARROSSE, 140))).toBe(false);
  expect(isFogged(fog, east(BISCARROSSE, 140))).toBe(false);
  expect(isFogged(fog, north(BISCARROSSE, 160))).toBe(true);
  expect(isFogged(fog, east(BISCARROSSE, 160))).toBe(true);
  expect(isFogged(fog, { latitude: 48.85, longitude: 2.35 })).toBe(true);
});

test('everything is fogged without discoveries', () => {
  const fog = buildFog([], []);
  expect(isFogged(fog, BISCARROSSE)).toBe(true);
});

test('soft edges follow only the outline of overlapping zones, across tiles', () => {
  const centers = [BISCARROSSE, north(BISCARROSSE, 100), east(BISCARROSSE, 120)];
  const fog = buildFog(centers, []);
  expect(isFogged(fog, north(BISCARROSSE, 50))).toBe(false);
  const points = fog.edges().coordinates.flat();
  expect(points.length).toBeGreaterThan(0);
  for (const [longitude = 0, latitude = 0] of points) {
    const nearest = Math.min(...centers.map((c) => distanceMeters(c, { latitude, longitude })));
    expect(nearest).toBeGreaterThan(149);
    expect(nearest).toBeLessThan(150.01);
  }
});

test('a walk reveals a 30 m band on each side', () => {
  const walk = [0, 20, 40, 60, 80, 100].map((meters) => east(BISCARROSSE, meters));
  const fog = buildFog([], walk);
  const middle = east(BISCARROSSE, 50);
  expect(isFogged(fog, middle)).toBe(false);
  expect(isFogged(fog, north(middle, 25))).toBe(false);
  expect(isFogged(fog, north(middle, 35))).toBe(true);
});

test('a gap in the walk is not revealed', () => {
  const fog = buildFog([], [BISCARROSSE, east(BISCARROSSE, 500)]);
  expect(isFogged(fog, BISCARROSSE)).toBe(false);
  expect(isFogged(fog, east(BISCARROSSE, 250))).toBe(true);
  expect(isFogged(fog, east(BISCARROSSE, 500))).toBe(false);
});

// Deterministic wandering walk inside a 10 km square, one point every 20 m.
function wanderingWalk(count: number): GeoPoint[] {
  let seed = 1;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  let x = 0;
  let y = 0;
  let heading = 0;
  return Array.from({ length: count }, () => {
    heading += (random() - 0.5) * 0.8;
    x += 20 * Math.cos(heading);
    y += 20 * Math.sin(heading);
    if (Math.abs(x) > 5000 || Math.abs(y) > 5000) heading += Math.PI;
    return east(north(BISCARROSSE, y), x);
  });
}

test('stays fast with 500 places and 20 000 walked points', () => {
  const places = Array.from({ length: 500 }, (_, i) =>
    east(north(BISCARROSSE, (i % 25) * 400 - 5000), Math.floor(i / 25) * 400 - 5000),
  );
  const walked = wanderingWalk(20_001);

  let start = performance.now();
  const fog = buildFog(places, walked.slice(0, -1));
  const build = performance.now() - start;

  start = performance.now();
  fog.add(walkShapes(walked.slice(-2)));
  fog.fog();
  fog.edges();
  const step = performance.now() - start;

  expect(build).toBeLessThan(1500);
  expect(step).toBeLessThan(50);
});
