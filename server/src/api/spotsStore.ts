import type { SpotStatus } from '@discover/shared';

import type { Sql } from '../db.ts';

export interface SpotInput {
  placeId: string;
  name: string;
  genre: string;
  latitude: number;
  longitude: number;
}

export type SubmitOutcome = 'ok' | 'profile_required' | 'exists' | 'too_many';

export const MAX_PENDING_SPOTS = 20;

export interface SpotsStore {
  submit(userId: string, spot: SpotInput): Promise<SubmitOutcome>;
  listMine(userId: string): Promise<{ placeId: string; status: SpotStatus }[]>;
  // Also unpublishes the spot when it was accepted. False when there was no such proposal.
  withdraw(userId: string, placeId: string): Promise<boolean>;
}

export function postgresSpotsStore(sql: Sql): SpotsStore {
  return {
    async submit(userId, spot) {
      const [profile] = await sql`select 1 from profiles where user_id = ${userId}`;
      if (!profile) return 'profile_required';
      const [{ pending = 0 } = {}] = await sql<{ pending: number }[]>`
        select count(*)::int as pending from spot_submissions
        where author = ${userId} and status = 'pending'`;
      if (pending >= MAX_PENDING_SPOTS) return 'too_many';
      const rows = await sql`
        insert into spot_submissions (author, place_id, name, genre, latitude, longitude)
        values (${userId}, ${spot.placeId}, ${spot.name}, ${spot.genre}, ${spot.latitude}, ${spot.longitude})
        on conflict (author, place_id) do nothing returning 1`;
      return rows.length > 0 ? 'ok' : 'exists';
    },

    listMine(userId) {
      return sql<{ placeId: string; status: SpotStatus }[]>`
        select place_id as "placeId", status from spot_submissions where author = ${userId}`;
    },

    async withdraw(userId, placeId) {
      const rows = await sql<{ id: string }[]>`
        delete from spot_submissions where author = ${userId} and place_id = ${placeId}
        returning id`;
      const [row] = rows;
      if (!row) return false;
      await sql`delete from places where id = ${`spot:${row.id}`}`;
      return true;
    },
  };
}
