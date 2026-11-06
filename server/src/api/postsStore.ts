import { HIDE_AFTER_REPORTS } from '@discover/shared';

import type { Sql } from '../db.ts';

export interface FeedRow {
  id: string;
  pseudo: string;
  placeId: string;
  placeName: string;
  comment: string;
  createdAt: string;
  mine: boolean;
  path: string;
}

export interface PostsStore {
  // null when the user has no pseudo yet.
  createPost(
    userId: string,
    placeId: string,
    placeName: string,
    comment: string,
  ): Promise<{ id: string; path: string } | null>;
  // false when the post is not this user's.
  confirmUpload(userId: string, postId: string): Promise<boolean>;
  // The user's posts and their friends', newest first, without hidden posts or blocked users.
  listFeed(userId: string): Promise<FeedRow[]>;
  // The photo path to remove from Storage, or null when the post is not this user's.
  deletePost(userId: string, postId: string): Promise<string | null>;
  listPaths(userId: string): Promise<string[]>;
  report(userId: string, postId: string): Promise<'ok' | 'unknown' | 'own'>;
  // Also ends the friendship, if any.
  block(userId: string, pseudo: string): Promise<'ok' | 'unknown' | 'self'>;
}

const FEED_LIMIT = 50;

export function postgresPostsStore(sql: Sql): PostsStore {
  return {
    async createPost(userId, placeId, placeName, comment) {
      const [profile] = await sql`select 1 from profiles where user_id = ${userId}`;
      if (!profile) return null;
      const id = crypto.randomUUID();
      const path = `${userId}/${id}.jpg`;
      await sql`
        insert into place_posts (id, author, place_id, place_name, comment, photo_path)
        values (${id}, ${userId}, ${placeId}, ${placeName}, ${comment}, ${path})`;
      return { id, path };
    },

    async confirmUpload(userId, postId) {
      const rows = await sql`
        update place_posts set uploaded = true
        where id = ${postId} and author = ${userId} returning 1`;
      return rows.length > 0;
    },

    listFeed(userId) {
      return sql<FeedRow[]>`
        select p.id, pr.pseudo, p.place_id as "placeId", p.place_name as "placeName", p.comment, p.created_at as "createdAt",
          p.author = ${userId} as mine, p.photo_path as path
        from place_posts p
        join profiles pr on pr.user_id = p.author
        where p.uploaded and not p.hidden
          and (p.author = ${userId} or exists (
            select 1 from friendships f
            where f.accepted_at is not null
              and ((f.requester = ${userId} and f.addressee = p.author)
                or (f.addressee = ${userId} and f.requester = p.author))))
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = p.author)
              or (b.blocker = p.author and b.blocked = ${userId}))
        order by p.created_at desc
        limit ${FEED_LIMIT}`;
    },

    async deletePost(userId, postId) {
      const [row] = await sql<{ path: string }[]>`
        delete from place_posts where id = ${postId} and author = ${userId}
        returning photo_path as path`;
      return row?.path ?? null;
    },

    async listPaths(userId) {
      const rows = await sql<{ path: string }[]>`
        select photo_path as path from place_posts where author = ${userId}`;
      return rows.map((row) => row.path);
    },

    async report(userId, postId) {
      const [post] = await sql<
        { author: string }[]
      >`select author from place_posts where id = ${postId}`;
      if (!post) return 'unknown';
      if (post.author === userId) return 'own';
      await sql`
        insert into post_reports (post_id, reporter) values (${postId}, ${userId})
        on conflict do nothing`;
      await sql`
        update place_posts set hidden = true
        where id = ${postId}
          and (select count(*) from post_reports where post_id = ${postId}) >= ${HIDE_AFTER_REPORTS}`;
      return 'ok';
    },

    async block(userId, pseudo) {
      const [target] = await sql<{ userId: string }[]>`
        select user_id as "userId" from profiles where pseudo = ${pseudo}`;
      if (!target) return 'unknown';
      if (target.userId === userId) return 'self';
      await sql`
        insert into blocks (blocker, blocked) values (${userId}, ${target.userId})
        on conflict do nothing`;
      await sql`
        delete from friendships
        where (requester = ${userId} and addressee = ${target.userId})
          or (requester = ${target.userId} and addressee = ${userId})`;
      return 'ok';
    },
  };
}
