export interface AuthAdmin {
  // null when the session token is missing, expired or forged.
  userIdFromToken(token: string): Promise<string | null>;
  deleteUser(userId: string): Promise<void>;
}

// Supabase Auth over plain fetch: two calls do not justify supabase-js on the server.
export function supabaseAuthAdmin(url: string, secretKey: string): AuthAdmin {
  return {
    async userIdFromToken(token) {
      const response = await fetch(`${url}/auth/v1/user`, {
        headers: { apikey: secretKey, authorization: `Bearer ${token}` },
      });
      if (response.status === 401 || response.status === 403) return null;
      if (!response.ok) throw new Error(`Auth user lookup answered ${response.status}`);
      const body: unknown = await response.json();
      const id = typeof body === 'object' && body !== null && 'id' in body ? body.id : undefined;
      return typeof id === 'string' ? id : null;
    },

    async deleteUser(userId) {
      const response = await fetch(`${url}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { apikey: secretKey },
      });
      // 404: already gone, which is what the user asked for.
      if (!response.ok && response.status !== 404) {
        throw new Error(`Auth user deletion answered ${response.status}`);
      }
    },
  };
}
