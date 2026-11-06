import { fetchFriendMap, fetchMyMapStatus, parseSharedMap, shareMap } from './mapsApi';

jest.mock('@/features/account/supabase', () => ({
  supabase: {
    auth: { getSession: () => Promise.resolve({ data: { session: { access_token: 'tok' } } }) },
  },
}));
const mockFetch = jest.fn();
jest.mock('@/lib/fetchWithTimeout', () => ({
  fetchWithTimeout: (...args: unknown[]) => mockFetch(...args),
}));

const reply = (status: number, body: unknown) => ({
  ok: status < 300,
  status,
  text: body === null ? '' : JSON.stringify(body),
});

beforeEach(() => {
  mockFetch.mockReset();
  process.env.EXPO_PUBLIC_API_URL = 'https://api.test';
});

test('sends only the place ids', async () => {
  mockFetch.mockResolvedValue(reply(204, null));
  expect(await shareMap(['osm:node/1'])).toEqual({ ok: true, value: true });
  const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('https://api.test/me/map');
  expect(init.body).toBe('{"placeIds":["osm:node/1"]}');
});

test('no shared map is not an error', async () => {
  mockFetch.mockResolvedValue(reply(404, { error: 'no_map' }));
  expect(await fetchMyMapStatus()).toEqual({ ok: true, value: null });
  expect(await fetchFriendMap('bob')).toEqual({ ok: true, value: null });
});

test('reads a friend map and refuses a malformed one', async () => {
  const body = { pseudo: 'bob', placeIds: ['osm:node/1'], updatedAt: '2026-11-07T10:00:00Z' };
  mockFetch.mockResolvedValue(reply(200, body));
  expect(await fetchFriendMap('bob')).toEqual({ ok: true, value: body });
  expect(parseSharedMap({ pseudo: 'bob', placeIds: [1], updatedAt: 'x' })).toBeNull();
  expect(parseSharedMap(null)).toBeNull();
});
