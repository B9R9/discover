import type { Sql } from '../db.ts';

export interface MapRow {
  placeIds: string[];
  updatedAt: string;
}

export interface MapsStore {
  // Replaces the user's snapshot; false when the user has no pseudo yet.
  save(userId: string, placeIds: string[]): Promise<boolean>;
  remove(userId: string): Promise<void>;
  // The user's own snapshot, if any.
  get(userId: string): Promise<MapRow | null>;
  // A friend's snapshot: null unless the pseudo is an accepted, unblocked friend with a snapshot.
  getFriend(userId: string, pseudo: string): Promise<(MapRow & { pseudo: string }) | null>;
}

export function postgresMapsStore(sql: Sql): MapsStore {
  return {
    async save(userId, placeIds) {
      const [profile] = await sql`select 1 from profiles where user_id = ${userId}`;
      if (!profile) return false;
      await sql`
        insert into shared_maps (user_id, place_ids) values (${userId}, ${placeIds})
        on conflict (user_id) do update set place_ids = excluded.place_ids, updated_at = now()`;
      return true;
    },

    async remove(userId) {
      await sql`delete from shared_maps where user_id = ${userId}`;
    },

    async get(userId) {
      const [row] = await sql<MapRow[]>`
        select place_ids as "placeIds", updated_at as "updatedAt"
        from shared_maps where user_id = ${userId}`;
      return row ?? null;
    },

    async getFriend(userId, pseudo) {
      const [row] = await sql<(MapRow & { pseudo: string })[]>`
        select pr.pseudo, m.place_ids as "placeIds", m.updated_at as "updatedAt"
        from profiles pr
        join shared_maps m on m.user_id = pr.user_id
        where pr.pseudo = ${pseudo}
          and exists (
            select 1 from friendships f
            where f.accepted_at is not null
              and ((f.requester = ${userId} and f.addressee = pr.user_id)
                or (f.addressee = ${userId} and f.requester = pr.user_id)))
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = pr.user_id)
              or (b.blocker = pr.user_id and b.blocked = ${userId}))`;
      return row ?? null;
    },
  };
}
