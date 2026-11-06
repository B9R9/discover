import { fetchFriends, fetchPseudo, savePseudo } from './socialApi';

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

test('sends the session token and a JSON body', async () => {
  mockFetch.mockResolvedValue(reply(204, null));
  expect(await savePseudo('lea_44')).toEqual({ ok: true, value: true });
  const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('https://api.test/me/profile');
  expect(init.method).toBe('PUT');
  expect(init.body).toBe('{"pseudo":"lea_44"}');
  expect(init.headers).toMatchObject({ authorization: 'Bearer tok' });
});

test('maps server error codes to French messages', async () => {
  mockFetch.mockResolvedValue(reply(409, { error: 'pseudo_taken' }));
  expect(await savePseudo('lea_44')).toEqual({ ok: false, error: 'circle.error.taken' });
  mockFetch.mockResolvedValue(reply(500, { error: 'internal' }));
  expect(await savePseudo('lea_44')).toEqual({ ok: false, error: 'account.error.network' });
});

test('a missing profile is not an error', async () => {
  mockFetch.mockResolvedValue(reply(404, { error: 'no_profile' }));
  expect(await fetchPseudo()).toEqual({ ok: true, value: null });
});

test('a network failure or a malformed list is reported as a network error', async () => {
  mockFetch.mockRejectedValue(new Error('offline'));
  expect(await fetchFriends()).toEqual({ ok: false, error: 'account.error.network' });
  mockFetch.mockResolvedValue(reply(200, { friends: 'x' }));
  expect(await fetchFriends()).toEqual({ ok: false, error: 'account.error.network' });
});

test('parses a friend list', async () => {
  const list = { friends: ['bob'], incoming: [], outgoing: ['zoe'] };
  mockFetch.mockResolvedValue(reply(200, list));
  expect(await fetchFriends()).toEqual({ ok: true, value: list });
});
