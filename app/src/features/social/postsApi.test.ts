import { parseFeed, sharePost } from './postsApi';

// Keeps the real Supabase client (and its native storage) out of the test.
jest.mock('@/features/account/supabase', () => ({ supabase: {} }));
const mockCall = jest.fn();
jest.mock('./apiClient', () => ({
  ...jest.requireActual('./apiClient'),
  call: (...args: unknown[]) => mockCall(...args),
}));
const mockBytes = jest.fn();
jest.mock('expo-file-system', () => ({
  File: class {
    arrayBuffer() {
      return mockBytes();
    }
  },
}));
const mockFetch = jest.fn();
global.fetch = mockFetch as unknown as typeof fetch;

const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0x00, 0x04, 1, 2, 0xff, 0xd9]).buffer;

beforeEach(() => {
  jest.resetAllMocks();
  mockBytes.mockResolvedValue(jpeg);
});

test('shares in three steps: create, upload the cleaned photo, confirm', async () => {
  mockCall
    .mockResolvedValueOnce({ status: 201, body: { id: 'p1', uploadUrl: 'https://s/up' } })
    .mockResolvedValueOnce({ status: 204, body: null });
  mockFetch.mockResolvedValue({ ok: true });
  expect(await sharePost('osm:node/1', 'Le phare', 'Beau', 'file:///photo.jpg')).toEqual({
    ok: true,
    value: true,
  });
  expect(mockCall.mock.calls.map((c) => `${c[1]} ${c[0]}`)).toEqual([
    'POST /posts',
    'POST /posts/p1/uploaded',
  ]);
  const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
  expect(url).toBe('https://s/up');
  expect(init.method).toBe('PUT');
});

test('a failed upload deletes the post and reports an error', async () => {
  mockCall
    .mockResolvedValueOnce({ status: 201, body: { id: 'p1', uploadUrl: 'https://s/up' } })
    .mockResolvedValueOnce({ status: 204, body: null });
  mockFetch.mockResolvedValue({ ok: false });
  expect(await sharePost('x', 'Nom', '', 'file:///photo.jpg')).toEqual({
    ok: false,
    error: 'circle.error.upload',
  });
  expect(mockCall.mock.calls[1]?.slice(0, 2)).toEqual(['/posts/p1', 'DELETE']);
});

test('a photo that is not a JPEG is never sent', async () => {
  mockCall
    .mockResolvedValueOnce({ status: 201, body: { id: 'p1', uploadUrl: 'https://s/up' } })
    .mockResolvedValueOnce({ status: 204, body: null });
  mockBytes.mockResolvedValue(new Uint8Array([1, 2, 3, 4]).buffer);
  expect((await sharePost('x', 'Nom', '', 'file:///photo.png')).ok).toBe(false);
  expect(mockFetch).not.toHaveBeenCalled();
});

test('the server refusing the comment is reported with its own message', async () => {
  mockCall.mockResolvedValueOnce({ status: 422, body: { error: 'invalid_post' } });
  expect(await sharePost('x', 'Nom', 'y', 'file:///photo.jpg')).toEqual({
    ok: false,
    error: 'circle.error.invalidPost',
  });
});

test('parseFeed accepts well-formed posts only', () => {
  const post = {
    id: 'a',
    pseudo: 'b',
    placeId: 'c',
    placeName: 'n',
    comment: 'd',
    createdAt: 'e',
    mine: false,
    photoUrl: 'f',
  };
  expect(parseFeed({ posts: [post] })).toEqual([post]);
  expect(parseFeed({ posts: [{ ...post, mine: 'no' }] })).toBeNull();
  expect(parseFeed({})).toBeNull();
});
