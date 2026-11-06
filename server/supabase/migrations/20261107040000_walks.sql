-- Phase 7d-2: walks drawn by users (seen by their friends) or made by Détour (author null, seen by all).
create table public.walks (
  id uuid primary key default gen_random_uuid(),
  author uuid references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  -- [[longitude, latitude], ...], checked by the API.
  path jsonb not null,
  distance_m integer not null check (distance_m between 1 and 25000),
  duration_s integer not null check (duration_s > 0),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index walks_author on public.walks (author, created_at desc);

create table public.walk_reports (
  walk_id uuid not null references public.walks (id) on delete cascade,
  reporter uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (walk_id, reporter)
);

alter table public.walks enable row level security;
alter table public.walk_reports enable row level security;
