-- Supabase SQL Editor에서 한 번 실행하세요.
create table if not exists public.marriage_flow_data (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null default '{"projects":[],"people":[],"events":[]}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.marriage_flow_data enable row level security;
drop policy if exists "Read own marriage flow" on public.marriage_flow_data;
drop policy if exists "Insert own marriage flow" on public.marriage_flow_data;
drop policy if exists "Update own marriage flow" on public.marriage_flow_data;
create policy "Read own marriage flow" on public.marriage_flow_data for select to authenticated using ((select auth.uid()) = user_id);
create policy "Insert own marriage flow" on public.marriage_flow_data for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Update own marriage flow" on public.marriage_flow_data for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
