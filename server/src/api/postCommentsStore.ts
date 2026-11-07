import type { Sql } from '../db.ts';

export interface CommentRow {
  id: string;
  pseudo: string;
  text: string;
  createdAt: string;
  mine: boolean;
  byPostAuthor: boolean;
}

export interface PostCommentsStore {
  // null when the user cannot see the post (not theirs or a friend's, hidden, blocked).
  list(userId: string, postId: string): Promise<CommentRow[] | null>;
  // 'unknown' when the post is not visible to the user, null when the user has no pseudo yet.
  add(userId: string, postId: string, text: string): Promise<CommentRow | 'unknown' | null>;
  // The commenter or the post's author may remove a comment.
  remove(userId: string, commentId: string): Promise<boolean>;
}

const COMMENT_LIMIT = 100;

export function postgresPostCommentsStore(sql: Sql): PostCommentsStore {
  // Same rule as the feed: own posts and accepted friends', not hidden, no block either way.
  const canSee = (userId: string, postId: string) => sql`
    select p.author from place_posts p
    where p.id = ${postId} and p.uploaded and not p.hidden
      and (p.author = ${userId} or exists (
        select 1 from friendships f
        where f.accepted_at is not null
          and ((f.requester = ${userId} and f.addressee = p.author)
            or (f.addressee = ${userId} and f.requester = p.author))))
      and not exists (
        select 1 from blocks b
        where (b.blocker = ${userId} and b.blocked = p.author)
          or (b.blocker = p.author and b.blocked = ${userId}))`;

  return {
    async list(userId, postId) {
      if ((await canSee(userId, postId)).length === 0) return null;
      return sql<CommentRow[]>`
        select c.id, pr.pseudo, c.text, c.created_at as "createdAt",
          c.author = ${userId} as mine, c.author = p.author as "byPostAuthor"
        from post_comments c
        join place_posts p on p.id = c.post_id
        join profiles pr on pr.user_id = c.author
        where c.post_id = ${postId}
          and not exists (
            select 1 from blocks b
            where (b.blocker = ${userId} and b.blocked = c.author)
              or (b.blocker = c.author and b.blocked = ${userId}))
        order by c.created_at
        limit ${COMMENT_LIMIT}`;
    },

    async add(userId, postId, text) {
      const [post] = await canSee(userId, postId);
      if (!post) return 'unknown';
      const [profile] = await sql<{ pseudo: string }[]>`
        select pseudo from profiles where user_id = ${userId}`;
      if (!profile) return null;
      const [row] = await sql<{ id: string; createdAt: string }[]>`
        insert into post_comments (post_id, author, text) values (${postId}, ${userId}, ${text})
        returning id, created_at as "createdAt"`;
      if (!row) return null;
      return {
        id: row.id,
        pseudo: profile.pseudo,
        text,
        createdAt: row.createdAt,
        mine: true,
        byPostAuthor: post.author === userId,
      };
    },

    async remove(userId, commentId) {
      const rows = await sql`
        delete from post_comments c
        using place_posts p
        where c.id = ${commentId} and p.id = c.post_id
          and (c.author = ${userId} or p.author = ${userId})
        returning 1`;
      return rows.length > 0;
    },
  };
}
