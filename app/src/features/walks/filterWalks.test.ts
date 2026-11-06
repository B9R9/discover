import type { SharedWalk } from '@discover/shared';

import { filterWalks } from './filterWalks';

const walk = (id: string, lon: number, durationSeconds: number): SharedWalk => ({
  id,
  name: id,
  pseudo: null,
  mine: false,
  path: [
    [lon, 60],
    [lon, 60.01],
  ],
  distanceMeters: 1000,
  durationSeconds,
  createdAt: '2026-11-07T10:00:00Z',
});

const walks = [walk('far', 25, 5000), walk('near', 10, 1800)];

test('keeps the walks under an hour', () => {
  expect(filterWalks(walks, 'short', null).map((w) => w.id)).toEqual(['near']);
});

test('sorts by the distance to the start, and keeps the order without a position', () => {
  expect(filterWalks(walks, 'near', [24.9, 60]).map((w) => w.id)).toEqual(['far', 'near']);
  expect(filterWalks(walks, 'near', null).map((w) => w.id)).toEqual(['far', 'near']);
  expect(filterWalks(walks, 'all', null)).toHaveLength(2);
});
