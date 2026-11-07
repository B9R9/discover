-- Phase 8a: dated outings shown in the Sorties tab. Added by Détour (seeds now, collection later).
create table public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  kind text not null check (char_length(kind) between 1 and 40),
  theme text not null default '' check (char_length(theme) <= 80),
  description text not null default '' check (char_length(description) <= 1000),
  place_name text not null check (char_length(place_name) between 1 and 120),
  area text not null default '' check (char_length(area) <= 80),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  starts_at timestamptz not null,
  ends_at timestamptz,
  free boolean not null default false,
  price_note text not null default '' check (char_length(price_note) <= 80),
  -- Where it came from: 'seed' for the ones we add by hand, a site name once they are collected.
  source text not null default 'seed',
  unique (title, starts_at)
);
create index events_starts_at on public.events (starts_at);
alter table public.events enable row level security;
