-- Phase 7e: a place (spot or private place) sent by its author to friends they pick.
create table public.place_shares (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  genre text check (
    genre in ('viewpoint', 'nature', 'shop', 'food', 'beach', 'streetart', 'heritage', 'leisure')
  ),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  comment text not null default '' check (char_length(comment) <= 280),
  created_at timestamptz not null default now()
);
create table public.place_share_recipients (
  share_id uuid not null references public.place_shares (id) on delete cascade,
  recipient uuid not null references auth.users (id) on delete cascade,
  primary key (share_id, recipient)
);
create index place_share_recipients_recipient on public.place_share_recipients (recipient);
alter table public.place_shares enable row level security;
alter table public.place_share_recipients enable row level security;
