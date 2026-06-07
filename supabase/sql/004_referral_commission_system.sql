-- Referral commission system for Easy Vocab
-- Additive migration only. Existing auth and premium payment flow stay intact.

begin;

create extension if not exists citext;

create table if not exists public.referral_creators (
  id uuid primary key default gen_random_uuid(),
  creator_name text not null,
  phone_number text not null,
  total_sales_count bigint not null default 0,
  total_sales_amount numeric(12,2) not null default 0,
  total_commission_amount numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_codes (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.referral_creators(id) on delete restrict,
  code citext not null unique,
  commission_rate numeric(5,2) not null default 10.00 check (commission_rate = 10.00),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.referral_sales (
  id bigint generated always as identity primary key,
  payment_request_id bigint not null unique references public.payment_requests(id) on delete restrict,
  creator_id uuid not null references public.referral_creators(id) on delete restrict,
  referral_code_id uuid not null references public.referral_codes(id) on delete restrict,
  payment_amount numeric(12,2) not null,
  commission_amount numeric(12,2) not null,
  status text not null default 'unpaid' check (status in ('unpaid', 'paid')),
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_referral_sales_creator_created_at
  on public.referral_sales (creator_id, created_at desc);

create index if not exists idx_referral_sales_status_created_at
  on public.referral_sales (status, created_at desc);

create unique index if not exists ux_referral_codes_creator_id
  on public.referral_codes (creator_id);

drop trigger if exists trg_referral_creators_updated_at on public.referral_creators;
create trigger trg_referral_creators_updated_at
before update on public.referral_creators
for each row execute function public.set_updated_at();

drop trigger if exists trg_referral_codes_updated_at on public.referral_codes;
create trigger trg_referral_codes_updated_at
before update on public.referral_codes
for each row execute function public.set_updated_at();

alter table public.referral_creators enable row level security;
alter table public.referral_codes enable row level security;
alter table public.referral_sales enable row level security;

revoke all on public.referral_creators from anon, authenticated;
revoke all on public.referral_codes from anon, authenticated;
revoke all on public.referral_sales from anon, authenticated;

grant select, insert, update, delete on public.referral_creators to authenticated;
grant select, insert, update, delete on public.referral_codes to authenticated;
grant select on public.referral_sales to authenticated;

drop policy if exists referral_creators_select_admin on public.referral_creators;
create policy referral_creators_select_admin
  on public.referral_creators
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists referral_creators_mutate_admin on public.referral_creators;
create policy referral_creators_mutate_admin
  on public.referral_creators
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists referral_codes_select_active on public.referral_codes;
create policy referral_codes_select_admin
  on public.referral_codes
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists referral_codes_mutate_admin on public.referral_codes;
create policy referral_codes_mutate_admin
  on public.referral_codes
  for all
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists referral_sales_select_admin on public.referral_sales;
create policy referral_sales_select_admin
  on public.referral_sales
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

drop policy if exists referral_sales_insert_admin on public.referral_sales;
create policy referral_sales_insert_admin
  on public.referral_sales
  for insert
  to authenticated
  with check (false);

drop policy if exists referral_sales_update_admin on public.referral_sales;
create policy referral_sales_update_admin
  on public.referral_sales
  for update
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

alter table public.payment_requests
  add column if not exists referral_code citext,
  add column if not exists referral_code_id uuid references public.referral_codes(id) on delete set null;

create index if not exists idx_payment_requests_referral_code_id
  on public.payment_requests (referral_code_id);

create or replace function public.resolve_referral_code(
  p_referral_code text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code_id uuid;
begin
  if nullif(trim(coalesce(p_referral_code, '')), '') is null then
    return null;
  end if;

  select rc.id
  into v_code_id
  from public.referral_codes rc
  where rc.code = trim(p_referral_code)
    and rc.is_active = true;

  return v_code_id;
end;
$$;

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
  v_creator_id uuid;
  v_commission_amount numeric(12,2);
  v_code_id uuid;
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
      premium_unlocked_at = now(),
      premium_expires_at = null
    where id = v_request.user_id;

    if v_request.referral_code_id is not null then
      select id, creator_id into v_code_id, v_creator_id
      from public.referral_codes
      where id = v_request.referral_code_id
      limit 1;
    elsif nullif(trim(coalesce(v_request.referral_code::text, '')), '') is not null then
      select rc.id, rc.creator_id
      into v_code_id, v_creator_id
      from public.referral_codes rc
      where rc.code = trim(v_request.referral_code::text)
        and rc.is_active = true
      limit 1;
    end if;

    if v_code_id is not null and v_creator_id is not null then
      v_commission_amount := round((v_request.amount::numeric * 0.10)::numeric, 2);

      insert into public.referral_sales (
        payment_request_id,
        creator_id,
        referral_code_id,
        payment_amount,
        commission_amount,
        status
      ) values (
        v_request.id,
        v_creator_id,
        v_code_id,
        v_request.amount,
        v_commission_amount,
        'unpaid'
      )
      on conflict (payment_request_id) do nothing;

      update public.referral_creators
      set
        total_sales_count = total_sales_count + 1,
        total_sales_amount = total_sales_amount + v_request.amount,
        total_commission_amount = total_commission_amount + v_commission_amount
      where id = v_creator_id;
    end if;
  end if;

  insert into public.admin_actions (actor_user_id, action, target_table, target_id, details)
  values (
    v_actor,
    'review_payment_request',
    'payment_requests',
    p_request_id::text,
    jsonb_build_object(
      'decision', p_decision,
      'note', p_review_note,
      'referral_code_id', v_request.referral_code_id,
      'referral_code', v_request.referral_code
    )
  );

  return v_request;
end;
$$;

create or replace function public.mark_referral_payout_paid(
  p_creator_id uuid,
  p_period_type text,
  p_period_start date,
  p_period_end date,
  p_payout_note text default null
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
  v_is_admin boolean;
  v_sales_count integer;
  v_sales_amount numeric(12,2);
  v_commission_amount numeric(12,2);
  v_updated_count integer;
begin
  if v_actor is null then
    raise exception 'Not authenticated';
  end if;

  select exists(
    select 1 from public.admin_users a where a.user_id = v_actor
  ) into v_is_admin;

  if not v_is_admin then
    raise exception 'Only admin can mark payouts paid';
  end if;

  if p_period_type not in ('weekly', 'monthly') then
    raise exception 'Invalid period type';
  end if;

  select count(*), coalesce(sum(payment_amount), 0)::numeric(12,2), coalesce(sum(commission_amount), 0)::numeric(12,2)
  into v_sales_count, v_sales_amount, v_commission_amount
  from public.referral_sales
  where creator_id = p_creator_id
    and status = 'unpaid'
    and created_at::date >= p_period_start
    and created_at::date <= p_period_end;

  if coalesce(v_sales_count, 0) = 0 then
    raise exception 'No unpaid sales found for the selected period';
  end if;

  update public.referral_sales
  set status = 'paid',
      paid_at = now()
  where creator_id = p_creator_id
    and status = 'unpaid'
    and created_at::date >= p_period_start
    and created_at::date <= p_period_end
  ;

  get diagnostics v_updated_count = row_count;

  insert into public.admin_actions (actor_user_id, action, target_table, target_id, details)
  values (
    v_actor,
    'mark_referral_payout_paid',
    'referral_sales',
    p_creator_id::text,
    jsonb_build_object(
      'payout_note', p_payout_note,
      'period_type', p_period_type,
      'period_start', p_period_start,
      'period_end', p_period_end,
      'sales_count', v_sales_count,
      'sales_amount', v_sales_amount,
      'commission_amount', v_commission_amount
    )
  );

  return v_updated_count;
end;
$$;

grant execute on function public.resolve_referral_code(text) to authenticated;
grant execute on function public.mark_referral_payout_paid(uuid, text, date, date, text) to authenticated;
grant execute on function public.review_payment_request(bigint, text, text) to authenticated;

commit;