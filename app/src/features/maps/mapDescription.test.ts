import type { Area } from '@discover/shared';

import { describeMap } from './mapDescription';
import type { MapEntry } from './ownership';

const square = { type: 'MultiPolygon' as const, coordinates: [] };
const area = (id: string, name: string, departmentId: string | null): Area => ({
  id,
  name,
  departmentId,
  boundary: square,
});

const gironde: MapEntry = { area: area('gironde', 'Gironde', null), status: 'locked' };
const bordeaux: MapEntry = {
  area: area('gironde-bordeaux', 'Bordeaux', 'gironde'),
  status: 'locked',
};
const merignac: MapEntry = {
  area: area('gironde-merignac', 'Mérignac', 'gironde'),
  status: 'locked',
};
const landes: MapEntry = { area: area('landes', 'Landes', null), status: 'free' };

test('a department lists its big cities, the free one says it lacks them', () => {
  const maps = [gironde, bordeaux, merignac, landes];
  expect(describeMap(gironde, maps)).toEqual({
    key: 'maps.describe.departmentWithCities',
    params: { cities: 'Bordeaux et Mérignac' },
  });
  expect(describeMap({ ...gironde, status: 'free' }, maps)).toEqual({
    key: 'maps.describe.freeWithoutCities',
    params: { cities: 'Bordeaux et Mérignac' },
  });
  expect(describeMap(landes, maps)).toEqual({ key: 'maps.describe.department' });
  expect(describeMap(bordeaux, maps)).toEqual({ key: 'maps.describe.city' });
});
