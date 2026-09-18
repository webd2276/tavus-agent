create extension if not exists pgcrypto;

create table if not exists public.pals (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  tavus_pal_id text not null unique,
  name text not null,
  short_description text,
  identity_role text,
  greeting text,
  guardrails text[] not null default '{}',
  objectives text,
  face_id text,
  voice_id text,
  conferencing_username text,
  allowed_websites text[] not null default '{}',
  calls_per_day integer,
  calls_per_visitor integer,
  longest_call_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.meetings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  pal_id uuid not null references public.pals(id) on delete cascade,
  tavus_conversation_id text not null,
  join_url text not null,
  created_at timestamptz not null default now()
);

alter table public.pals enable row level security;
alter table public.meetings enable row level security;

create policy "Users manage their own pals" on public.pals
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "Users manage their own meetings" on public.meetings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
