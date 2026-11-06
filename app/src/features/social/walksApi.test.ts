import { parseWalks, publishWalk } from './walksApi';

jest.mock('@/features/account/supabase', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'tok' } } }) },
  },
}));
const mockFetch = jest.fn();
jest.mock('@/lib/fetchWithTimeout', () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
});

const walk = {
  id: 'w1',
  name: 'Tour du lac',
  pseudo: null,
  mine: false,
  path: [
    [0, 0],
    [0, 1],
  ],
  distanceMeters: 1000,
  durationSeconds: 800,
  createdAt: '2026-11-07T10:00:00Z',
};

test('sends only the name and the path', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 201, text: '{"id":"x"}' });
  await publishWalk('Tour du lac', [
    [0, 0],
    [0, 1],
  ]);
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(JSON.parse(init.body as string)).toEqual({
    name: 'Tour du lac',
    path: [
      [0, 0],
      [0, 1],
    ],
  });
});

test('reads walks and refuses malformed ones', () => {
  expect(parseWalks({ walks: [walk] })).toEqual([walk]);
  expect(parseWalks({ walks: [{ ...walk, path: [[0]] }] })).toBeNull();
  expect(parseWalks(null)).toBeNull();
});
