export interface StorageAdmin {
  // A one-time URL the app sends the photo to; no other file can be written with it.
  createUploadUrl(path: string): Promise<string>;
  // Same order as `paths`; null for a file that does not exist.
  createReadUrls(paths: string[], seconds: number): Promise<(string | null)[]>;
  remove(paths: string[]): Promise<void>;
}

export const POST_BUCKET = 'post-photos';

function field(value: unknown, name: string): unknown {
  return typeof value === 'object' && value !== null && name in value
    ? (value as Record<string, unknown>)[name]
    : undefined;
}

// Supabase Storage over plain fetch, like Auth: three calls do not justify a dependency.
export function supabaseStorageAdmin(url: string, secretKey: string): StorageAdmin {
  const base = `${url}/storage/v1`;
  const headers = { apikey: secretKey, 'content-type': 'application/json' };

  async function call(path: string, method: string, body: unknown): Promise<unknown> {
    const response = await fetch(`${base}${path}`, { method, headers, body: JSON.stringify(body) });
    if (!response.ok)
      throw new Error(`Storage ${method} ${path.split('/')[2]} answered ${response.status}`);
    return response.json();
  }

  return {
    async createUploadUrl(path) {
      const answer = await call(`/object/upload/sign/${POST_BUCKET}/${path}`, 'POST', {});
      const signed = field(answer, 'url');
      if (typeof signed !== 'string') throw new Error('Storage upload URL missing');
      return `${base}${signed}`;
    },

    async createReadUrls(paths, seconds) {
      if (paths.length === 0) return [];
      const answer = await call(`/object/sign/${POST_BUCKET}`, 'POST', {
        expiresIn: seconds,
        paths,
      });
      const items: unknown[] = Array.isArray(answer) ? answer : [];
      return paths.map((path) => {
        const item = items.find((candidate) => field(candidate, 'path') === path);
        const signed = field(item, 'signedURL');
        return typeof signed === 'string' ? `${base}${signed}` : null;
      });
    },

    async remove(paths) {
      if (paths.length === 0) return;
      await call(`/object/${POST_BUCKET}`, 'DELETE', { prefixes: paths });
    },
  };
}
