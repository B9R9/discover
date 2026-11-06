-- Phase 7c: a snapshot of the places a user chose to show to friends. Ids only: no dates, no paths.
create table public.shared_maps (
  user_id uuid primary key references auth.users (id) on delete cascade,
  place_ids text[] not null check (cardinality(place_ids) <= 5000),
  updated_at timestamptz not null default now()
);
alter table public.shared_maps enable row level security;
