import type { SharedWalk } from '@discover/shared';

export type WalkFilter = 'all' | 'short' | 'near';

const SHORT_SECONDS = 3600;
const EARTH_RADIUS_METERS = 6_371_000;

function metersBetween([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]): number {
  const rad = (d: number) => (d * Math.PI) / 180;
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lon2 - lon1) / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

// "near" sorts by the distance from `here` to where the walk starts; without a position the order is kept.
export function filterWalks(
  walks: readonly SharedWalk[],
  filter: WalkFilter,
  here: [number, number] | null,
): SharedWalk[] {
  if (filter === 'short') return walks.filter((walk) => walk.durationSeconds < SHORT_SECONDS);
  if (filter === 'near' && here) {
    const gap = (walk: SharedWalk) => (walk.path[0] ? metersBetween(here, walk.path[0]) : Infinity);
    return [...walks].sort((a, b) => gap(a) - gap(b));
  }
  return [...walks];
}
