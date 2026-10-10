import type { Area } from '@discover/shared';

import { findArea } from './findArea';

// A 2 by 2 degree square with a 1 by 1 hole in the middle, coordinates as [longitude, latitude].
const donut: Area = {
  id: 'donut',
  name: 'Donut',
  departmentId: null,
  boundary: {
    type: 'MultiPolygon',
    coordinates: [
      [
        [
          [0, 0],
          [2, 0],
          [2, 2],
          [0, 2],
          [0, 0],
        ],
        [
          [0.5, 0.5],
          [1.5, 0.5],
          [1.5, 1.5],
          [0.5, 1.5],
          [0.5, 0.5],
        ],
      ],
    ],
  },
};

test('findArea finds the area around a point', () => {
  expect(findArea({ latitude: 0.2, longitude: 1.8 }, [donut])?.id).toBe('donut');
});

test('findArea returns null outside every area and inside a hole', () => {
  expect(findArea({ latitude: 3, longitude: 1 }, [donut])).toBeNull();
  expect(findArea({ latitude: 1, longitude: 1 }, [donut])).toBeNull();
  expect(findArea({ latitude: 1, longitude: 1 }, [])).toBeNull();
});
