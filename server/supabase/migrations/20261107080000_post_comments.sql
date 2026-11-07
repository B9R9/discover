-- Phase 7f: short comments (« mots doux ») under a post, visible to whoever can see the post.
create table public.post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.place_posts (id) on delete cascade,
  author uuid not null references auth.users (id) on delete cascade,
  text text not null check (char_length(text) between 1 and 140),
  created_at timestamptz not null default now()
);
create index post_comments_post on public.post_comments (post_id, created_at);

alter table public.post_comments enable row level security;
