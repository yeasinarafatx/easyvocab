-- Allow admin users to read all payment requests for review UI.
-- Run this once in Supabase SQL Editor after 001_manual_payment_foundation.sql.

begin;

drop policy if exists payment_requests_select_admin on public.payment_requests;
create policy payment_requests_select_admin
  on public.payment_requests
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.admin_users a
      where a.user_id = auth.uid()
    )
  );

commit;
