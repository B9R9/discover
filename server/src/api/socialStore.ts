import type { FriendList } from '@discover/shared';

import type { Sql } from '../db.ts';

export type RequestOutcome = 'ok' | 'profile_required' | 'unknown' | 'self' | 'exists';

export interface SocialStore {
  getPseudo(userId: string): Promise<string | null>;
  // 'taken' when another user already has this pseudo.
  setPseudo(userId: string, pseudo: string): Promise<'ok' | 'taken'>;
  listFriends(userId: string): Promise<FriendList>;
  // Answering a request that the other user already sent accepts it.
  requestFriend(userId: string, pseudo: string): Promise<RequestOutcome>;
  // false when that pseudo sent no pending request to this user.
  acceptFriend(userId: string, pseudo: string): Promise<boolean>;
  // Removes a friend, declines an incoming request or cancels an outgoing one.
  removeFriend(userId: string, pseudo: string): Promise<boolean>;
}

const UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === UNIQUE_VIOLATION
  );
}

export function postgresSocialStore(sql: Sql): SocialStore {
  return {
    async getPseudo(userId) {
      const [row] = await sql<{ pseudo: string }[]>`
        select pseudo from profiles where user_id = ${userId}`;
      return row?.pseudo ?? null;
    },

    async setPseudo(userId, pseudo) {
      try {
        await sql`
          insert into profiles (user_id, pseudo) values (${userId}, ${pseudo})
          on conflict (user_id) do update set pseudo = excluded.pseudo`;
        return 'ok';
      } catch (error) {
        if (isUniqueViolation(error)) return 'taken';
        throw error;
      }
    },

    async listFriends(userId) {
      const rows = await sql<{ pseudo: string; outgoing: boolean; accepted: boolean }[]>`
        select p.pseudo, f.requester = ${userId} as outgoing, f.accepted_at is not null as accepted
        from friendships f
        join profiles p on p.user_id = case when f.requester = ${userId} then f.addressee else f.requester end
        where f.requester = ${userId} or f.addressee = ${userId}
        order by p.pseudo`;
      return {
        friends: rows.filter((row) => row.accepted).map((row) => row.pseudo),
        incoming: rows.filter((row) => !row.accepted && !row.outgoing).map((row) => row.pseudo),
        outgoing: rows.filter((row) => !row.accepted && row.outgoing).map((row) => row.pseudo),
      };
    },

    async requestFriend(userId, pseudo) {
      if (!(await this.getPseudo(userId))) return 'profile_required';
      const [target] = await sql<{ userId: string }[]>`
        select user_id as "userId" from profiles where pseudo = ${pseudo}`;
      if (!target) return 'unknown';
      if (target.userId === userId) return 'self';
      const [existing] = await sql<{ requester: string; accepted: boolean }[]>`
        select requester, accepted_at is not null as accepted from friendships
        where (requester = ${userId} and addressee = ${target.userId})
          or (requester = ${target.userId} and addressee = ${userId})`;
      if (existing) {
        if (existing.accepted || existing.requester === userId) return 'exists';
        await sql`
          update friendships set accepted_at = now()
          where requester = ${target.userId} and addressee = ${userId}`;
        return 'ok';
      }
      try {
        await sql`insert into friendships (requester, addressee) values (${userId}, ${target.userId})`;
        return 'ok';
      } catch (error) {
        if (isUniqueViolation(error)) return 'exists';
        throw error;
      }
    },

    async acceptFriend(userId, pseudo) {
      const rows = await sql`
        update friendships set accepted_at = now()
        where addressee = ${userId} and accepted_at is null
          and requester = (select user_id from profiles where pseudo = ${pseudo})
        returning 1`;
      return rows.length > 0;
    },

    async removeFriend(userId, pseudo) {
      const rows = await sql`
        delete from friendships
        where (requester = ${userId} and addressee = (select user_id from profiles where pseudo = ${pseudo}))
          or (addressee = ${userId} and requester = (select user_id from profiles where pseudo = ${pseudo}))
        returning 1`;
      return rows.length > 0;
    },
  };
}
