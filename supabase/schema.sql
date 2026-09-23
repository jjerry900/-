-- RAVEN2 Guild Manager - shared data, no login
create extension if not exists pgcrypto;

create table if not exists public.members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  job text default '',
  power integer not null default 0,
  defense integer not null default 0,
  accuracy integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.boss_records (
  id uuid primary key default gen_random_uuid(),
  week integer not null default 1 check (week between 1 and 5),
  date date not null default current_date,
  boss text not null,
  score integer not null default 0,
  participants text[] not null default '{}',
  created_at timestamptz not null default now()
);

alter table public.members enable row level security;
alter table public.boss_records enable row level security;

drop policy if exists "members_public_select" on public.members;
drop policy if exists "members_public_insert" on public.members;
drop policy if exists "members_public_update" on public.members;
drop policy if exists "members_public_delete" on public.members;
drop policy if exists "boss_public_select" on public.boss_records;
drop policy if exists "boss_public_insert" on public.boss_records;
drop policy if exists "boss_public_update" on public.boss_records;
drop policy if exists "boss_public_delete" on public.boss_records;

create policy "members_public_select" on public.members for select to anon, authenticated using (true);
create policy "members_public_insert" on public.members for insert to anon, authenticated with check (true);
create policy "members_public_update" on public.members for update to anon, authenticated using (true) with check (true);
create policy "members_public_delete" on public.members for delete to anon, authenticated using (true);

create policy "boss_public_select" on public.boss_records for select to anon, authenticated using (true);
create policy "boss_public_insert" on public.boss_records for insert to anon, authenticated with check (true);
create policy "boss_public_update" on public.boss_records for update to anon, authenticated using (true) with check (true);
create policy "boss_public_delete" on public.boss_records for delete to anon, authenticated using (true);

create index if not exists members_name_idx on public.members(name);
create index if not exists boss_records_date_idx on public.boss_records(date desc);
create index if not exists boss_records_week_idx on public.boss_records(week);

alter publication supabase_realtime add table public.members;
alter publication supabase_realtime add table public.boss_records;
