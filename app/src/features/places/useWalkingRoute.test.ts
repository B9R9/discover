import { renderHook, waitFor } from '@testing-library/react-native';

import { migrate } from '@/db/migrations';
import { openTestDb } from '@/db/testDb';

import type { NearbyPlace } from './nearbyPlaces';
import { useWalkingRoute } from './useWalkingRoute';
import { fetchWalkingRoute } from './walkingRoute';

jest.mock('./walkingRoute', () => ({ fetchWalkingRoute: jest.fn() }));
const fetchMock = jest.mocked(fetchWalkingRoute);

const HOME = { latitude: 44.39, longitude: -1.15 };
const base = { id: 'p', category: null, distance: 100, bearing: 0 };
const hidden: NearbyPlace = { ...base, discovered: false };
const found: NearbyPlace = { ...base, discovered: true, name: 'P', position: HOME };
const ROUTE = {
  kind: 'route' as const,
  route: {
    line: { type: 'LineString' as const, coordinates: [] },
    distanceMeters: 1,
    durationSeconds: 1,
  },
};

test('never asks nor returns a route for an undiscovered place', async () => {
  const db = openTestDb();
  await migrate(db);
  fetchMock.mockResolvedValue(ROUTE);

  const { result, rerender } = await renderHook(
    ({ place }: { place: NearbyPlace }) => useWalkingRoute(db, place, HOME),
    { initialProps: { place: found } },
  );
  await waitFor(() => expect(result.current).toEqual(ROUTE));

  // Same id, but now undiscovered (for example after a data reset): the old route must vanish.
  await rerender({ place: hidden });
  expect(result.current).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(1);
});
