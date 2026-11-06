import type { Sql } from '../db.ts';

// Category of a published spot: street art has no category of its own on the server.
export const CATEGORY_OF_GENRE: Record<string, string> = {
  viewpoint: 'viewpoint',
  nature: 'nature',
  shop: 'shop',
  food: 'food',
  beach: 'beach',
  streetart: 'culture',
  heritage: 'heritage',
  leisure: 'leisure',
};

export interface PendingSpot {
  id: string;
  pseudo: string;
  name: string;
  genre: string;
  latitude: number;
  longitude: number;
}

export function listPending(sql: Sql): Promise<PendingSpot[]> {
  return sql<PendingSpot[]>`
    select s.id, pr.pseudo, s.name, s.genre, s.latitude, s.longitude
    from spot_submissions s join profiles pr on pr.user_id = s.author
    where s.status = 'pending' order by s.created_at`;
}

// Publishes the spot in the smallest area that covers it (a big city before its department).
// 'no_area' when no map covers the point: it stays pending.
export async function approve(sql: Sql, id: string): Promise<'ok' | 'unknown' | 'no_area'> {
  return sql.begin(async (tx) => {
    const [spot] = await tx<PendingSpot[]>`
      select id, name, genre, latitude, longitude from spot_submissions
      where id = ${id} and status = 'pending' for update`;
    if (!spot) return 'unknown';
    const [area] = await tx<{ id: string }[]>`
      select id from areas
      where ST_Covers(boundary, ST_SetSRID(ST_MakePoint(${spot.longitude}, ${spot.latitude}), 4326)::geography)
      order by department_id is null limit 1`;
    if (!area) return 'no_area';
    await tx`
      insert into places (id, area_id, name, location, category, source, updated_at)
      values (${`spot:${spot.id}`}, ${area.id}, ${spot.name},
        ST_SetSRID(ST_MakePoint(${spot.longitude}, ${spot.latitude}), 4326)::geography,
        ${CATEGORY_OF_GENRE[spot.genre] ?? 'leisure'}, 'user', now())
      on conflict (id) do nothing`;
    await tx`update spot_submissions set status = 'approved' where id = ${id}`;
    return 'ok';
  });
}

export async function reject(sql: Sql, id: string): Promise<boolean> {
  const rows = await sql`
    update spot_submissions set status = 'rejected' where id = ${id} and status = 'pending'
    returning 1`;
  return rows.length > 0;
}
