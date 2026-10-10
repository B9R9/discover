import type { Area } from '@discover/shared';

import { listOwnedMaps } from '@/db/ownedMaps';
import { migrate } from '@/db/migrations';
import { openTestDb } from '@/db/testDb';

import { claimFreeMap, isUnlocked, listMaps, mapStatus } from './ownership';

const square = { type: 'MultiPolygon' as const, coordinates: [] };
const gironde: Area = { id: 'gironde', name: 'Gironde', departmentId: null, boundary: square };
const bordeaux: Area = {
  id: 'gironde-bordeaux',
  name: 'Bordeaux',
  departmentId: 'gironde',
  boundary: square,
};
const landes: Area = { id: 'landes', name: 'Landes', departmentId: null, boundary: square };

test('a free department leaves its big cities locked, a bought one unlocks them', () => {
  const free = [{ areaId: 'gironde', source: 'free' as const, unlockedAt: 1 }];
  expect(isUnlocked(gironde, free)).toBe(true);
  expect(isUnlocked(bordeaux, free)).toBe(false);
  expect(isUnlocked(landes, free)).toBe(false);

  const bought = [{ areaId: 'gironde', source: 'purchased' as const, unlockedAt: 1 }];
  expect(isUnlocked(bordeaux, bought)).toBe(true);
  expect(
    isUnlocked(bordeaux, [{ areaId: 'gironde-bordeaux', source: 'purchased', unlockedAt: 1 }]),
  ).toBe(true);
});

test('listMaps puts owned departments first, each followed by its big cities', () => {
  const owned = [{ areaId: 'landes', source: 'free' as const, unlockedAt: 1 }];
  const maps = listMaps([bordeaux, gironde, landes], owned);
  expect(maps.map((map) => [map.area.id, map.status])).toEqual([
    ['landes', 'free'],
    ['gironde', 'locked'],
    ['gironde-bordeaux', 'locked'],
  ]);
  const bought = [{ areaId: 'gironde', source: 'purchased' as const, unlockedAt: 1 }];
  expect(mapStatus(bordeaux, bought)).toBe('purchased');
});

test('claimFreeMap gives the department of the first area, once', async () => {
  const db = openTestDb();
  await migrate(db);

  await claimFreeMap(db, bordeaux, 1);
  await claimFreeMap(db, landes, 2);

  expect(await listOwnedMaps(db)).toEqual([{ areaId: 'gironde', source: 'free', unlockedAt: 1 }]);
});
