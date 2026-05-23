-- =========================================================
--  follows.sql
--  Sistema de seguir / dejar de seguir entre usuarios.
-- =========================================================

create table if not exists public.follows (
  follower_id uuid not null references auth.users (id) on delete cascade,
  followed_id uuid not null references auth.users (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  primary key (follower_id, followed_id),
  constraint follows_no_self check (follower_id <> followed_id)
);

create index if not exists follows_followed_idx on public.follows (followed_id, created_at desc);
create index if not exists follows_follower_idx on public.follows (follower_id, created_at desc);

alter table public.follows enable row level security;

drop policy if exists "Authenticated users can read follows" on public.follows;
create policy "Authenticated users can read follows"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "Users can follow as themselves" on public.follows;
create policy "Users can follow as themselves"
on public.follows
for insert
to authenticated
with check ((select auth.uid()) = follower_id);

drop policy if exists "Users can unfollow as themselves" on public.follows;
create policy "Users can unfollow as themselves"
on public.follows
for delete
to authenticated
using ((select auth.uid()) = follower_id);
