import assert from 'node:assert/strict';
import { mock, test } from 'node:test';

import { supabaseStorageAdmin } from './storageAdmin.ts';

function answer(body: unknown, status = 200) {
  return Promise.resolve(new Response(JSON.stringify(body), { status }));
}

test('builds full upload and read URLs from the relative ones Storage returns', async () => {
  const calls: { url: string; init: RequestInit }[] = [];
  mock.method(globalThis, 'fetch', (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return url.includes('/upload/sign/')
      ? answer({ url: '/object/upload/sign/post-photos/a/1.jpg?token=up' })
      : answer([{ path: 'a/1.jpg', signedURL: '/object/sign/post-photos/a/1.jpg?token=rd' }]);
  });
  const storage = supabaseStorageAdmin('https://p.supabase.co', 'sb_secret_x');

  assert.equal(
    await storage.createUploadUrl('a/1.jpg'),
    'https://p.supabase.co/storage/v1/object/upload/sign/post-photos/a/1.jpg?token=up',
  );
  assert.deepEqual(await storage.createReadUrls(['a/1.jpg', 'a/2.jpg'], 3600), [
    'https://p.supabase.co/storage/v1/object/sign/post-photos/a/1.jpg?token=rd',
    null,
  ]);
  assert.equal(calls[0]?.init.method, 'POST');
  assert.deepEqual(
    calls[1]?.init.body,
    JSON.stringify({ expiresIn: 3600, paths: ['a/1.jpg', 'a/2.jpg'] }),
  );
  mock.restoreAll();
});

test('a Storage failure is an error, and nothing is called for an empty list', async () => {
  mock.method(globalThis, 'fetch', () => answer({}, 500));
  const storage = supabaseStorageAdmin('https://p.supabase.co', 'sb_secret_x');
  await assert.rejects(storage.createUploadUrl('a/1.jpg'));
  await storage.remove([]);
  assert.deepEqual(await storage.createReadUrls([], 60), []);
  assert.equal(
    (globalThis.fetch as unknown as { mock: { calls: unknown[] } }).mock.calls.length,
    1,
  );
  mock.restoreAll();
});
