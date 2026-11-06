-- Phase 7b: photos and comments shared with friends, reports and blocks.
create table public.place_posts (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users (id) on delete cascade,
  place_id text not null check (char_length(place_id) between 1 and 120),
  comment text not null check (char_length(comment) <= 280),
  photo_path text not null,
  -- Visible only once the photo reached Storage.
  uploaded boolean not null default false,
  -- Set after enough different reports.
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index place_posts_author on public.place_posts (author, created_at desc);

create table public.post_reports (
  post_id uuid not null references public.place_posts (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, reporter)
);

create table public.blocks (
  blocker uuid not null references auth.users (id) on delete cascade,
  blocked uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker, blocked),
  check (blocker <> blocked)
);

alter table public.place_posts enable row level security;
alter table public.post_reports enable row level security;
alter table public.blocks enable row level security;

-- Private bucket. Skipped where Storage is not running (local development without it).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public) values ('post-photos', 'post-photos', false)
    on conflict (id) do nothing;
  end if;
end $$;
