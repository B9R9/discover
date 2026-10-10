import assert from 'node:assert/strict';
import { test } from 'node:test';

import { dedupePlaces } from './dedupe.ts';

const place = (id: string, name: string, latitude: number, longitude: number) => ({
  id,
  name,
  latitude,
  longitude,
  category: 'culture',
});

test('dedupePlaces drops a same-name place closer than 50 m', () => {
  const result = dedupePlaces([
    place('a', 'Église Saint-Martin', 44.3941, -1.16756),
    place('b', 'eglise saint martin', 44.3942, -1.16756), // about 11 m north
  ]);
  assert.deepEqual(
    result.map((p) => p.id),
    ['a'],
  );
});

test('dedupePlaces keeps same-name places far apart', () => {
  const result = dedupePlaces([
    place('a', 'Aire de jeux', 44.3941, -1.16756),
    place('b', 'Aire de jeux', 44.3951, -1.16756), // about 110 m north
  ]);
  assert.equal(result.length, 2);
});

test('dedupePlaces keeps different names at the same spot', () => {
  const result = dedupePlaces([
    place('a', 'Mairie', 44.3941, -1.16756),
    place('b', 'Médiathèque', 44.3941, -1.16756),
  ]);
  assert.equal(result.length, 2);
});
