import type { City } from '@discover/shared';

import { findCity } from './findCity';

// A 2 by 2 degree square with a 1 by 1 hole in the middle, coordinates as [longitude, latitude].
const donut: City = {
  id: 'donut',
  name: 'Donut',
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

test('findCity finds the city around a point', () => {
  expect(findCity({ latitude: 0.2, longitude: 1.8 }, [donut])?.id).toBe('donut');
});

test('findCity returns null outside every city and inside a hole', () => {
  expect(findCity({ latitude: 3, longitude: 1 }, [donut])).toBeNull();
  expect(findCity({ latitude: 1, longitude: 1 }, [donut])).toBeNull();
  expect(findCity({ latitude: 1, longitude: 1 }, [])).toBeNull();
});
