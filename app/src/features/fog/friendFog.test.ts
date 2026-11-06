import type { Place } from '@discover/shared';

import { boundsOf, friendFog } from './friendFog';

const place = (id: string, latitude: number, longitude: number): Place => ({
  id,
  areaId: 'landes',
  name: id,
  latitude,
  longitude,
  category: 'viewpoint',
});

test('lifts the fog around the places, without paths or animation', () => {
  const data = friendFog([place('a', 44.39, -1.16)]);
  expect(data.walked.coordinates).toEqual([]);
  expect(data.fresh).toEqual([]);
  expect(data.edges.coordinates.length).toBeGreaterThan(0);
});

test('bounds surround the places, and are null without any', () => {
  expect(boundsOf([])).toBeNull();
  const bounds = boundsOf([place('a', 44, -1), place('b', 45, 0)], 0.5);
  expect(bounds).toEqual([-1.5, 43.5, 0.5, 45.5]);
});
