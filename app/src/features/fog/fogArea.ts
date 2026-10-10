import type { GeoPoint } from '@/db/types';

import { FogGrid } from './fogGrid';
import { splitWalks, simplify } from './paths';
import { capsule, circle, type Position, type Ring } from './shapes';

export const PLACE_RADIUS_METERS = 150;
export const PATH_RADIUS_METERS = 30;

export function walkLines(points: readonly GeoPoint[]): Position[][] {
  return splitWalks(points)
    .filter((walk) => walk.length > 1)
    .map((walk) => simplify(walk).map((point): Position => [point.longitude, point.latitude]));
}

export function walkShapes(points: readonly GeoPoint[]): Ring[] {
  const shapes: Ring[] = [];
  for (const walk of splitWalks(points)) {
    const [first, ...rest] = simplify(walk);
    if (!first) continue;
    if (rest.length === 0) shapes.push(circle(first, PATH_RADIUS_METERS));
    let previous = first;
    for (const point of rest) {
      shapes.push(capsule(previous, point, PATH_RADIUS_METERS));
      previous = point;
    }
  }
  return shapes;
}

export function placeShapes(places: readonly GeoPoint[]): Ring[] {
  return places.map((place) => circle(place, PLACE_RADIUS_METERS));
}

export function buildFog(places: readonly GeoPoint[], walkedPoints: readonly GeoPoint[]): FogGrid {
  const grid = new FogGrid();
  grid.add([...placeShapes(places), ...walkShapes(walkedPoints)]);
  return grid;
}
