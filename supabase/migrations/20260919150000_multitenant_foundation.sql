-- Multi-tenant foundation. Existing personal PALs are preserved by assigning
-- each existing owner a personal organization during the migration.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 200),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  logo_url text,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id and user_id = auth.uid()
  );
$$;

create or replace function public.is_organization_admin(target_organization_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = target_organization_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

insert into public.profiles (id)
select id from auth.users on conflict (id) do nothing;

insert into public.organizations (name, slug)
select coalesce(nullif(split_part(email, '@', 1), ''), 'Personal') || '''s workspace',
       'personal-' || replace(id::text, '-', '')
from auth.users
on conflict (slug) do nothing;

insert into public.organization_members (organization_id, user_id, role)
select organizations.id, users.id, 'owner'
from auth.users users
join public.organizations organizations on organizations.slug = 'personal-' || replace(users.id::text, '-', '')
on conflict (organization_id, user_id) do nothing;

alter table public.pals add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
update public.pals pals
set organization_id = members.organization_id
from public.organization_members members
where members.user_id = pals.owner_id and members.role = 'owner' and pals.organization_id is null;
alter table public.pals alter column organization_id set not null;
create index if not exists pals_organization_id_idx on public.pals (organization_id, created_at desc);

alter table public.meetings add column if not exists organization_id uuid references public.organizations(id) on delete restrict;
alter table public.meetings add column if not exists kind text not null default 'instant' check (kind in ('instant', 'scheduled'));
update public.meetings meetings
set organization_id = pals.organization_id
from public.pals pals
where pals.id = meetings.pal_id and meetings.organization_id is null;
alter table public.meetings alter column organization_id set not null;
create index if not exists meetings_organization_id_idx on public.meetings (organization_id, created_at desc);

create table if not exists public.agents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references auth.users(id) on delete restrict,
  name text not null check (char_length(name) between 1 and 200),
  slug text not null check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  description text,
  type text not null check (type in ('voice', 'video')),
  provider text not null check (provider in ('vapi', 'tavus')),
  provider_agent_id text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  system_prompt text,
  greeting text,
  language text not null default 'en',
  voice_configuration jsonb not null default '{}'::jsonb,
  video_configuration jsonb not null default '{}'::jsonb,
  knowledge_configuration jsonb not null default '{}'::jsonb,
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);
create index if not exists agents_organization_status_idx on public.agents (organization_id, status, updated_at desc);

create table if not exists public.agent_versions (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  version integer not null check (version > 0),
  state text not null check (state in ('draft', 'published')),
  configuration jsonb not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  unique (agent_id, version)
);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  agent_id uuid references public.agents(id) on delete set null,
  provider text not null check (provider in ('vapi', 'tavus')),
  provider_conversation_id text,
  channel text not null check (channel in ('voice', 'video')),
  status text not null default 'started',
  visitor_id text,
  started_at timestamptz,
  ended_at timestamptz,
  duration_seconds integer check (duration_seconds >= 0),
  transcript_reference text,
  summary text,
  created_at timestamptz not null default now(),
  unique (provider, provider_conversation_id)
);
create index if not exists conversations_organization_created_idx on public.conversations (organization_id, created_at desc);

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider text not null check (provider in ('google_calendar', 'google_drive', 'google_sheets', 'n8n')),
  status text not null default 'disconnected',
  encrypted_credentials_reference text,
  scopes text[] not null default '{}',
  connected_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, provider)
);

create table if not exists public.automation_runs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  source text not null check (source in ('vapi', 'tavus', 'n8n')),
  event_type text not null,
  external_event_id text not null,
  status text not null default 'received' check (status in ('received', 'forwarded', 'failed')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  last_error text,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, external_event_id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.agents enable row level security;
alter table public.agent_versions enable row level security;
alter table public.conversations enable row level security;
alter table public.integrations enable row level security;
alter table public.automation_runs enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles are self managed" on public.profiles for all using (id = auth.uid()) with check (id = auth.uid());
create policy "members can view organizations" on public.organizations for select using (public.is_organization_member(id));
create policy "authenticated users can create organizations" on public.organizations for insert to authenticated with check (true);
create policy "admins can update organizations" on public.organizations for update using (public.is_organization_admin(id)) with check (public.is_organization_admin(id));
create policy "members can view organization members" on public.organization_members for select using (public.is_organization_member(organization_id));
create policy "users can create their owner membership" on public.organization_members for insert to authenticated with check (user_id = auth.uid() and role = 'owner');
create policy "admins manage memberships" on public.organization_members for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));

create policy "members can read agents" on public.agents for select using (public.is_organization_member(organization_id));
create policy "admins manage agents" on public.agents for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members can read agent versions" on public.agent_versions for select using (public.is_organization_member(organization_id));
create policy "admins manage agent versions" on public.agent_versions for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members can read conversations" on public.conversations for select using (public.is_organization_member(organization_id));
create policy "admins manage integrations" on public.integrations for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "members can view audit logs" on public.audit_logs for select using (public.is_organization_member(organization_id));

-- Keep legacy PAL and meeting access working while adding tenant-scoped RLS.
create policy "organization members can view pals" on public.pals for select using (public.is_organization_member(organization_id));
create policy "organization admins manage pals" on public.pals for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
create policy "organization members can view meetings" on public.meetings for select using (public.is_organization_member(organization_id));
create policy "organization admins manage meetings" on public.meetings for all using (public.is_organization_admin(organization_id)) with check (public.is_organization_admin(organization_id));
