-- Manual premium payment foundation for Easy Vocab
-- Safe to run in Supabase SQL Editor.
-- This setup does NOT modify existing auth login/signup/forgot-password flows.

begin;

create extension if not exists citext;

-- 1) Profiles: per-user premium state and metadata
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_premium boolean not null default false,
  premium_unlocked_at timestamptz,
  premium_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_profiles_updated_at on public.profiles;
create trigger trg_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- Create profile automatically after auth signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill profiles for existing users
insert into public.profiles (id, full_name)
select
  u.id,
  coalesce(
    nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
    split_part(u.email, '@', 1)
  )
from auth.users u
on conflict (id) do nothing;

-- 2) Admin users list: who can approve/reject requests
create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 3) Payment requests: manual bKash/Nagad review queue
create table if not exists public.payment_requests (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  method text not null check (method in ('bkash', 'nagad')),
  sender_mobile text not null,
  trx_id citext not null,
  amount numeric(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_payment_requests_updated_at on public.payment_requests;
create trigger trg_payment_requests_updated_at
before update on public.payment_requests
for each row execute function public.set_updated_at();

-- One trx id globally once used (prevents reuse fraud)
create unique index if not exists ux_payment_requests_trx_id
  on public.payment_requests (trx_id);

-- Allow only one pending request per user to keep queue clean
create unique index if not exists ux_payment_requests_one_pending_per_user
  on public.payment_requests (user_id)
  where status = 'pending';

create index if not exists ix_payment_requests_status_created_at
  on public.payment_requests (status, created_at desc);

-- 4) Optional audit log for admin actions
create table if not exists public.admin_actions (
  id bigint generated always as identity primary key,
  actor_user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  target_table text not null,
  target_id text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

-- 5) RLS policies
alter table public.profiles enable row level security;
alter table public.payment_requests enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_actions enable row level security;

-- Profiles: user can read/update own row only
revoke all on public.profiles from anon, authenticated;
grant select, update on public.profiles to authenticated;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
  on public.profiles
  for select
  to authenticated
  using (id = auth.uid());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
  on public.profiles
  for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- admin_users: user can only see self membership row
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;

drop policy if exists admin_users_select_self on public.admin_users;
create policy admin_users_select_self
  on public.admin_users
  for select
  to authenticated
  using (user_id = auth.uid());

-- payment_requests: create/read own requests, no direct status updates
revoke all on public.payment_requests from anon, authenticated;
grant select, insert on public.payment_requests to authenticated;

drop policy if exists payment_requests_select_own on public.payment_requests;
create policy payment_requests_select_own
  on public.payment_requests
  for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists payment_requests_insert_own on public.payment_requests;
create policy payment_requests_insert_own
  on public.payment_requests
  for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and status = 'pending'
    and amount > 0
  );

-- admin_actions: only admins can read their own actions
revoke all on public.admin_actions from anon, authenticated;
grant select, insert on public.admin_actions to authenticated;

drop policy if exists admin_actions_select_self on public.admin_actions;
create policy admin_actions_select_self
  on public.admin_actions
  for select
  to authenticated
  using (actor_user_id = auth.uid());

drop policy if exists admin_actions_insert_self on public.admin_actions;
create policy admin_actions_insert_self
  on public.admin_actions
  for insert
  to authenticated
  with check (actor_user_id = auth.uid());

-- 6) RPC: admin approve/reject payment safely and atomically
create or replace function public.review_payment_request(
  p_request_id bigint,
  p_decision text,
  p_review_note text default null
)
returns public.payment_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_is_admin boolean;
  v_request public.payment_requests;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.admin_users a where a.user_id = v_actor
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admin can review requests';
  end if;

  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid decision. Use approved or rejected';
  end if;

  select * into v_request
  from public.payment_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'Payment request not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This request is already reviewed';
  end if;

  update public.payment_requests
  set
    status = p_decision,
    review_note = p_review_note,
    reviewed_by = v_actor,
    reviewed_at = now()
  where id = p_request_id
  returning * into v_request;

  if p_decision = 'approved' then
    update public.profiles
    set
      is_premium = true,
      premium_unlocked_at = now()
    where id = v_request.user_id;
  end if;

  insert into public.admin_actions (actor_user_id, action, target_table, target_id, details)
  values (
    v_actor,
    'review_payment_request',
    'payment_requests',
    p_request_id::text,
    jsonb_build_object('decision', p_decision, 'note', p_review_note)
  );

  return v_request;
end;
$$;

grant execute on function public.review_payment_request(bigint, text, text) to authenticated;

commit;
