import type { Area } from '@discover/shared';

import { listOwnedMaps } from '@/db/ownedMaps';
import { migrate } from '@/db/migrations';
import { openTestDb } from '@/db/testDb';

import { claimFreeMap, isForSale, isUnlocked, listMaps, mapStatus } from './ownership';

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

test('buying the free department or the country unlocks the big cities', () => {
  const freeThenBought = [
    { areaId: 'gironde', source: 'free' as const, unlockedAt: 1 },
    { areaId: 'gironde', source: 'purchased' as const, unlockedAt: 0 },
  ];
  expect(mapStatus(gironde, freeThenBought)).toBe('purchased');
  expect(mapStatus(bordeaux, freeThenBought)).toBe('purchased');

  const country = [{ areaId: 'france', source: 'purchased' as const, unlockedAt: 0 }];
  expect(mapStatus(landes, country)).toBe('purchased');
  expect(mapStatus(bordeaux, country)).toBe('purchased');
});

test('the free department is for sale only while a big city of it is locked', () => {
  const free = (id: string) => [{ areaId: id, source: 'free' as const, unlockedAt: 1 }];
  const withFreeLandes = listMaps([gironde, bordeaux, landes], free('landes'));
  const landesEntry = withFreeLandes.find((map) => map.area.id === 'landes');
  expect(landesEntry && isForSale(landesEntry, withFreeLandes)).toBe(false);

  const withFreeGironde = listMaps([gironde, bordeaux, landes], free('gironde'));
  const girondeEntry = withFreeGironde.find((map) => map.area.id === 'gironde');
  expect(girondeEntry && isForSale(girondeEntry, withFreeGironde)).toBe(true);

  const boughtBordeaux = [
    ...free('gironde'),
    { areaId: 'gironde-bordeaux', source: 'purchased' as const, unlockedAt: 0 },
  ];
  const all = listMaps([gironde, bordeaux], boughtBordeaux);
  expect(all.filter((map) => isForSale(map, all))).toEqual([]);
});

test('claimFreeMap gives the department of the first area, once', async () => {
  const db = openTestDb();
  await migrate(db);

  await claimFreeMap(db, bordeaux, 1);
  await claimFreeMap(db, landes, 2);

  expect(await listOwnedMaps(db)).toEqual([{ areaId: 'gironde', source: 'free', unlockedAt: 1 }]);
});
