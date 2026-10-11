import { mapProductId, purchasedMaps } from './mapProducts';

test('only map products become purchased maps', () => {
  expect(mapProductId('gironde-bordeaux')).toBe('map_gironde_bordeaux');
  expect(purchasedMaps(['other', 'map_gironde', 'map_gironde_bordeaux'])).toEqual([
    { areaId: 'gironde', source: 'purchased', unlockedAt: 0 },
    { areaId: 'gironde-bordeaux', source: 'purchased', unlockedAt: 0 },
  ]);
});
