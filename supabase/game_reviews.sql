create extension if not exists pgcrypto;

create table if not exists public.game_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  rawg_id bigint,
  game text not null,
  title text not null,
  subtitle text not null default '',
  comment text not null,
  rating integer not null check (rating between 1 and 10),
  author text not null,
  created_at timestamp with time zone not null default now()
);

create index if not exists game_reviews_rawg_id_idx on public.game_reviews (rawg_id, created_at desc);
create index if not exists game_reviews_user_id_idx on public.game_reviews (user_id, created_at desc);

alter table public.game_reviews enable row level security;

drop policy if exists "Authenticated users can read reviews" on public.game_reviews;
create policy "Authenticated users can read reviews"
on public.game_reviews
for select
to authenticated
using (true);

drop policy if exists "Users can insert own reviews" on public.game_reviews;
create policy "Users can insert own reviews"
on public.game_reviews
for insert
to authenticated
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can update own reviews" on public.game_reviews;
create policy "Users can update own reviews"
on public.game_reviews
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

drop policy if exists "Users can delete own reviews" on public.game_reviews;
create policy "Users can delete own reviews"
on public.game_reviews
for delete
to authenticated
using ((select auth.uid()) = user_id);
