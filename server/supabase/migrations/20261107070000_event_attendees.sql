-- Phase 8b: "j'y vais". Only the user and their accepted friends learn who goes; others get a count.
create table public.event_attendees (
  event_id uuid not null references public.events (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (event_id, user_id)
);
create index event_attendees_user on public.event_attendees (user_id);
alter table public.event_attendees enable row level security;
