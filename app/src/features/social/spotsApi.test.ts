import { parseSpotStatuses, proposeSpot } from './spotsApi';

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

test('proposes the name, genre and position of the spot, nothing else', async () => {
  mockFetch.mockResolvedValue({ ok: true, status: 201, text: '' });
  await proposeSpot({
    id: 'personal:1000',
    name: 'Belvédère',
    latitude: 44.39,
    longitude: -1.16,
    visibility: 'public',
    genre: 'viewpoint',
    createdAt: 1000,
    photoId: 7,
  });
  const [, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(JSON.parse(init.body as string)).toEqual({
    placeId: 'personal:1000',
    name: 'Belvédère',
    genre: 'viewpoint',
    latitude: 44.39,
    longitude: -1.16,
  });
});

test('reads the statuses and refuses unknown ones', () => {
  expect(parseSpotStatuses({ spots: [{ placeId: 'personal:1', status: 'approved' }] })).toEqual({
    'personal:1': 'approved',
  });
  expect(parseSpotStatuses({ spots: [{ placeId: 'personal:1', status: 'nope' }] })).toBeNull();
  expect(parseSpotStatuses(null)).toBeNull();
});
