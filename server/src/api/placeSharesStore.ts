import type { SharedPlace } from '@discover/shared';

import type { Sql } from '../db.ts';

export interface PlaceShareInput {
  name: string;
  genre: string | null;
  latitude: number;
  longitude: number;
  comment: string;
  pseudos: string[];
}

export type ShareOutcome = 'ok' | 'profile_required' | 'not_friends' | 'too_many';

export const MAX_SENT_SHARES = 50;
const LIST_LIMIT = 100;

export interface PlaceSharesStore {
  // Every recipient must be an accepted friend, not blocked either way.
  create(userId: string, input: PlaceShareInput): Promise<ShareOutcome>;
  // What the user sent and what was sent to them, newest first, without blocked users.
  list(userId: string): Promise<SharedPlace[]>;
  // The author deletes the share for everyone; a recipient only drops their own copy.
  remove(userId: string, shareId: string): Promise<boolean>;
}

export function postgresPlaceSharesStore(sql: Sql): PlaceSharesStore {
  return {
    async create(userId, input) {
      const [profile] = await sql`select 1 from profiles where user_id = ${userId}`;
      if (!profile) return 'profile_required';
      const [{ sent = 0 } = {}] = await sql<{ sent: number }[]>`
        select count(*)::int as sent from place_shares where author = ${userId}`;
      if (sent >= MAX_SENT_SHARES) return 'too_many';
      const friends = await sql<{ userId: string }[]>`
        select pr.user_id as "userId" from profiles pr
        where pr.pseudo = any(${input.pseudos}) and exists (
          select 1 from friendships f
          where f.accepted_at is not null
            and ((f.requester = ${userId} and f.addressee = pr.user_id)
              or (f.addressee = ${userId} and f.requester = pr.user_id)))
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = pr.user_id)
              or (b.blocker = pr.user_id and b.blocked = ${userId}))`;
      if (friends.length !== input.pseudos.length) return 'not_friends';
      await sql.begin(async (tx) => {
        const [share] = await tx<{ id: string }[]>`
          insert into place_shares (author, name, genre, latitude, longitude, comment)
          values (${userId}, ${input.name}, ${input.genre}, ${input.latitude}, ${input.longitude}, ${input.comment})
          returning id`;
        for (const friend of friends) {
          await tx`
            insert into place_share_recipients (share_id, recipient)
            values (${share?.id ?? ''}, ${friend.userId})`;
        }
      });
      return 'ok';
    },

    list(userId) {
      return sql<SharedPlace[]>`
        select s.id, s.name, s.genre, s.latitude, s.longitude, s.comment, pr.pseudo,
          s.author = ${userId} as mine, s.created_at as "createdAt",
          case when s.author = ${userId} then coalesce((
            select array_agg(rp.pseudo order by rp.pseudo)
            from place_share_recipients r join profiles rp on rp.user_id = r.recipient
            where r.share_id = s.id), '{}') else '{}' end as "to"
        from place_shares s
        join profiles pr on pr.user_id = s.author
        where (s.author = ${userId} or exists (
            select 1 from place_share_recipients r
            where r.share_id = s.id and r.recipient = ${userId}))
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = s.author)
              or (b.blocker = s.author and b.blocked = ${userId}))
        order by s.created_at desc
        limit ${LIST_LIMIT}`;
    },

    async remove(userId, shareId) {
      const own =
        await sql`delete from place_shares where id = ${shareId} and author = ${userId} returning 1`;
      if (own.length > 0) return true;
      const copy = await sql`
        delete from place_share_recipients where share_id = ${shareId} and recipient = ${userId} returning 1`;
      return copy.length > 0;
    },
  };
}
