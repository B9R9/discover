import { HIDE_AFTER_REPORTS, type SharedWalk } from '@discover/shared';

import type { Sql } from '../db.ts';
import type { WalkMetrics, WalkPath } from './walkMetrics.ts';

export interface WalksStore {
  // null when the user has no pseudo yet.
  create(
    userId: string,
    name: string,
    path: WalkPath,
    metrics: WalkMetrics,
  ): Promise<string | null>;
  // Walks made by Détour, then the user's and their friends', without hidden walks or blocked users.
  // `null` for a visitor without a session: only the walks made by Détour.
  list(userId: string | null): Promise<SharedWalk[]>;
  // False when the walk is not this user's.
  remove(userId: string, walkId: string): Promise<boolean>;
  report(userId: string, walkId: string): Promise<'ok' | 'unknown' | 'own'>;
}

const LIST_LIMIT = 100;

interface WalkRow {
  id: string;
  name: string;
  pseudo: string | null;
  mine: boolean;
  path: WalkPath;
  distanceMeters: number;
  durationSeconds: number;
  createdAt: string;
}

export function postgresWalksStore(sql: Sql): WalksStore {
  return {
    async create(userId, name, path, metrics) {
      const [profile] = await sql`select 1 from profiles where user_id = ${userId}`;
      if (!profile) return null;
      const [row] = await sql<{ id: string }[]>`
        insert into walks (author, name, path, distance_m, duration_s)
        values (${userId}, ${name}, ${sql.json(path)}, ${metrics.distanceMeters}, ${metrics.durationSeconds})
        returning id`;
      return row?.id ?? null;
    },

    list(userId) {
      return sql<WalkRow[]>`
        select w.id, w.name, pr.pseudo, w.author = ${userId} as mine, w.path,
          w.distance_m as "distanceMeters", w.duration_s as "durationSeconds", w.created_at as "createdAt"
        from walks w
        left join profiles pr on pr.user_id = w.author
        where not w.hidden
          and (w.author is null or w.author = ${userId} or exists (
            select 1 from friendships f
            where f.accepted_at is not null
              and ((f.requester = ${userId} and f.addressee = w.author)
                or (f.addressee = ${userId} and f.requester = w.author))))
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = w.author)
              or (b.blocker = w.author and b.blocked = ${userId}))
        order by w.author is null desc, w.created_at desc
        limit ${LIST_LIMIT}`;
    },

    async remove(userId, walkId) {
      const rows =
        await sql`delete from walks where id = ${walkId} and author = ${userId} returning 1`;
      return rows.length > 0;
    },

    async report(userId, walkId) {
      const [walk] = await sql<
        { author: string | null }[]
      >`select author from walks where id = ${walkId}`;
      // A walk made by Détour cannot be reported: it is ours.
      if (!walk?.author) return 'unknown';
      if (walk.author === userId) return 'own';
      await sql`insert into walk_reports (walk_id, reporter) values (${walkId}, ${userId}) on conflict do nothing`;
      await sql`
        update walks set hidden = true
        where id = ${walkId}
          and (select count(*) from walk_reports where walk_id = ${walkId}) >= ${HIDE_AFTER_REPORTS}`;
      return 'ok';
    },
  };
}
