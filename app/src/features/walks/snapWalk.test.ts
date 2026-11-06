import { limitPoints, snapWalk, type Stop } from './snapWalk';

const line = (n: number): Stop[] => Array.from({ length: n }, (_, i) => [i, 44]);

test('keeps short walks and thins long ones, keeping both ends', () => {
  expect(limitPoints(line(5), 10)).toEqual(line(5));
  const thin = limitPoints(line(5000), 2000);
  expect(thin).toHaveLength(2000);
  expect(thin[0]).toEqual([0, 44]);
  expect(thin.at(-1)).toEqual([4999, 44]);
});

test('needs two stops and a key', async () => {
  expect(await snapWalk([[0, 0]], 'key')).toEqual({ kind: 'too-few-points' });
  expect(
    await snapWalk(
      [
        [0, 0],
        [1, 1],
      ],
      undefined,
    ),
  ).toEqual({ kind: 'no-key' });
});

test('snaps through OpenRouteService', async () => {
  const body = {
    features: [
      {
        geometry: {
          type: 'LineString',
          coordinates: [
            [0, 0, 5],
            [0, 1, 5],
          ],
        },
        properties: { summary: { distance: 111000, duration: 80000 } },
      },
    ],
  };
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(body) });
  global.fetch = fetchMock as unknown as typeof fetch;
  const result = await snapWalk(
    [
      [0, 0],
      [0, 1],
    ],
    'key',
  );
  expect(result).toEqual({
    kind: 'walk',
    walk: {
      path: [
        [0, 0],
        [0, 1],
      ],
      distanceMeters: 111000,
      durationSeconds: 80000,
    },
  });
});
