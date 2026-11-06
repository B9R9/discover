-- Phase 7d-1: spots proposed to the community, validated by hand before they join `places`.
create table public.spot_submissions (
  id uuid primary key default gen_random_uuid(),
  author uuid not null references auth.users (id) on delete cascade,
  -- The id of the spot on the author's phone.
  place_id text not null check (char_length(place_id) between 1 and 120),
  name text not null check (char_length(name) between 1 and 120),
  genre text not null check (
    genre in ('viewpoint', 'nature', 'shop', 'food', 'beach', 'streetart', 'heritage', 'leisure')
  ),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  unique (author, place_id)
);
alter table public.spot_submissions enable row level security;
