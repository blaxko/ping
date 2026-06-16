create extension if not exists pgcrypto;

create table if not exists public.pings (
  id uuid primary key default gen_random_uuid(),
  created_by text not null,
  recipient_name text not null,
  recipient_email text,
  recipient_phone text,
  task_description text not null,
  due_date timestamptz not null,
  status text not null default 'notified' check (status in ('notified', 'seen', 'overdue', 'resolved')),
  notification_channels text not null check (notification_channels in ('email', 'sms', 'both')),
  public_token text not null unique,
  seen_at timestamptz,
  resolved_at timestamptz,
  last_notified_at timestamptz,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table if not exists public.ping_events (
  id uuid primary key default gen_random_uuid(),
  ping_id uuid not null references public.pings(id) on delete cascade,
  event_type text not null,
  message_sent text not null,
  channel text check (channel in ('email', 'sms')),
  provider_message_id text,
  metadata jsonb not null default '{}'::jsonb,
  timestamp timestamptz not null default now()
);

create index if not exists pings_created_by_idx on public.pings(created_by);
create index if not exists pings_due_date_idx on public.pings(due_date);
create index if not exists pings_public_token_idx on public.pings(public_token);
create index if not exists ping_events_ping_id_idx on public.ping_events(ping_id);

alter table public.pings enable row level security;
alter table public.ping_events enable row level security;

drop policy if exists "pings_select_own" on public.pings;
create policy "pings_select_own"
  on public.pings
  for select
  using (coalesce(auth.jwt() ->> 'sub', '') = created_by);

drop policy if exists "pings_insert_own" on public.pings;
create policy "pings_insert_own"
  on public.pings
  for insert
  with check (coalesce(auth.jwt() ->> 'sub', '') = created_by);

drop policy if exists "pings_update_own" on public.pings;
create policy "pings_update_own"
  on public.pings
  for update
  using (coalesce(auth.jwt() ->> 'sub', '') = created_by)
  with check (coalesce(auth.jwt() ->> 'sub', '') = created_by);

drop policy if exists "ping_events_select_own" on public.ping_events;
create policy "ping_events_select_own"
  on public.ping_events
  for select
  using (
    exists (
      select 1
      from public.pings
      where public.pings.id = public.ping_events.ping_id
        and coalesce(auth.jwt() ->> 'sub', '') = public.pings.created_by
    )
  );

drop policy if exists "ping_events_insert_own" on public.ping_events;
create policy "ping_events_insert_own"
  on public.ping_events
  for insert
  with check (
    exists (
      select 1
      from public.pings
      where public.pings.id = public.ping_events.ping_id
        and coalesce(auth.jwt() ->> 'sub', '') = public.pings.created_by
    )
  );
