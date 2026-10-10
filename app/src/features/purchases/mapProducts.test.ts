import { mapProductId, purchasedMaps } from './mapProducts';

test('only map products become purchased maps', () => {
  expect(mapProductId('gironde-bordeaux')).toBe('map_gironde-bordeaux');
  expect(purchasedMaps(['lifetime', 'map_gironde', 'map_gironde-bordeaux'])).toEqual([
    { areaId: 'gironde', source: 'purchased', unlockedAt: 0 },
    { areaId: 'gironde-bordeaux', source: 'purchased', unlockedAt: 0 },
  ]);
});
