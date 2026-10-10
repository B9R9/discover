create extension if not exists postgis with schema extensions;

create table public.cities (
  id text primary key,
  name text not null,
  osm_relation bigint not null unique,
  boundary extensions.geography(MultiPolygon, 4326) not null,
  updated_at timestamptz not null default now()
);

create table public.places (
  id text primary key,
  city_id text not null references public.cities (id) on delete cascade,
  name text not null,
  location extensions.geography(Point, 4326) not null,
  category text not null check (
    category in ('culture', 'heritage', 'nature', 'viewpoint', 'beach', 'leisure', 'food', 'shop')
  ),
  source text not null,
  updated_at timestamptz not null default now()
);

create index places_city_id on public.places (city_id);
create index places_location on public.places using gist (location);

-- RLS on and no policy: the Supabase REST API (anon, authenticated) reads nothing.
-- Only our Node server reads and writes, through a direct Postgres connection.
alter table public.cities enable row level security;
alter table public.places enable row level security;
