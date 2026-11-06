-- Phase 7a: public profile (a pseudo) and friendships. Only the API reads these tables.
create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  pseudo text not null check (pseudo ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now()
);
create unique index profiles_pseudo on public.profiles (pseudo);

create table public.friendships (
  requester uuid not null references auth.users (id) on delete cascade,
  addressee uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- null while the addressee has not answered.
  accepted_at timestamptz,
  primary key (requester, addressee),
  check (requester <> addressee)
);
-- One row per pair, whoever asked first.
create unique index friendships_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
create index friendships_addressee on public.friendships (addressee);

alter table public.profiles enable row level security;
alter table public.friendships enable row level security;
