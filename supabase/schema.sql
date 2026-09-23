-- RAVEN2 Guild Manager
-- Run this entire file in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  job text default '',
  power integer not null default 0,
  defense integer not null default 0,
  accuracy integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.boss_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week integer not null default 1 check (week between 1 and 5),
  date date not null default current_date,
  boss text not null,
  score integer not null default 0,
  participants text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.boss_records enable row level security;

drop policy if exists "members_select_authenticated" on public.members;
drop policy if exists "members_insert_authenticated" on public.members;
drop policy if exists "members_update_authenticated" on public.members;
drop policy if exists "members_delete_authenticated" on public.members;
drop policy if exists "boss_select_authenticated" on public.boss_records;
drop policy if exists "boss_insert_authenticated" on public.boss_records;
drop policy if exists "boss_update_authenticated" on public.boss_records;
drop policy if exists "boss_delete_authenticated" on public.boss_records;

-- All logged-in guild users share the same guild data.
create policy "members_select_authenticated" on public.members for select to authenticated using (true);
create policy "members_insert_authenticated" on public.members for insert to authenticated with check (auth.uid() = user_id);
create policy "members_update_authenticated" on public.members for update to authenticated using (true) with check (true);
create policy "members_delete_authenticated" on public.members for delete to authenticated using (true);

create policy "boss_select_authenticated" on public.boss_records for select to authenticated using (true);
create policy "boss_insert_authenticated" on public.boss_records for insert to authenticated with check (auth.uid() = user_id);
create policy "boss_update_authenticated" on public.boss_records for update to authenticated using (true) with check (true);
create policy "boss_delete_authenticated" on public.boss_records for delete to authenticated using (true);

create index if not exists members_name_idx on public.members(name);
create index if not exists boss_records_date_idx on public.boss_records(date desc);
create index if not exists boss_records_week_idx on public.boss_records(week);

-- Optional: enable live updates in the dashboard for all logged-in users.
alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.boss_records;
