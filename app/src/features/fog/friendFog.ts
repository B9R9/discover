import type { Place } from '@discover/shared';

import { placeShapes } from './fogArea';
import { FogGrid } from './fogGrid';
import type { FogData } from './useFog';

// A friend's map: fog lifted around each of their places, no walked paths and no animation.
export function friendFog(places: readonly Place[]): FogData {
  const grid = new FogGrid();
  grid.add(placeShapes(places));
  return {
    fog: grid.fog(),
    edges: grid.edges(),
    walked: { type: 'MultiLineString', coordinates: [] },
    fresh: [],
  };
}

// [west, south, east, north] around the places with a margin, or null without any place.
export function boundsOf(
  places: readonly Place[],
  margin = 0.01,
): [number, number, number, number] | null {
  if (places.length === 0) return null;
  const longitudes = places.map((place) => place.longitude);
  const latitudes = places.map((place) => place.latitude);
  return [
    Math.min(...longitudes) - margin,
    Math.min(...latitudes) - margin,
    Math.max(...longitudes) + margin,
    Math.max(...latitudes) + margin,
  ];
}
