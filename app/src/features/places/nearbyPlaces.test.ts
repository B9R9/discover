import type { CachedPlace } from '@/db/placesCache';
import { bearingDegrees } from '@/lib/geo';

import { nearbyPlaces } from './nearbyPlaces';

const HOME = { latitude: 44.3944, longitude: -1.1636 };
const METERS_PER_DEGREE = 111_320;

function placeAt(
  id: string,
  northMeters: number,
  eastMeters: number,
  discovered: boolean,
): CachedPlace {
  const cos = Math.cos((HOME.latitude * Math.PI) / 180);
  return {
    id,
    cityId: 'biscarrosse',
    name: `Name ${id}`,
    latitude: HOME.latitude + northMeters / METERS_PER_DEGREE,
    longitude: HOME.longitude + eastMeters / (METERS_PER_DEGREE * cos),
    category: 'culture',
    discovered,
  };
}

test('bearings follow the compass', () => {
  expect(bearingDegrees(HOME, placeAt('n', 100, 0, false))).toBeCloseTo(0);
  expect(bearingDegrees(HOME, placeAt('e', 0, 100, false))).toBeCloseTo(90);
  expect(bearingDegrees(HOME, placeAt('s', -100, 0, false))).toBeCloseTo(180);
  expect(bearingDegrees(HOME, placeAt('w', 0, -100, false))).toBeCloseTo(270);
});

test('sorts by distance and hides name and position of undiscovered places', () => {
  const list = nearbyPlaces([placeAt('far', 500, 0, true), placeAt('near', 0, 200, false)], HOME);

  expect(list.map((place) => place.id)).toEqual(['near', 'far']);
  expect(list[0]?.distance).toBeCloseTo(200, 0);
  expect(list[0]).not.toHaveProperty('name');
  expect(list[0]).not.toHaveProperty('position');
  expect(JSON.stringify(list[0])).not.toContain('Name near');
  expect(list[1]).toMatchObject({ discovered: true, name: 'Name far' });
});
