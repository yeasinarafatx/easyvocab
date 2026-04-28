# Manual Payment Ops (bKash/Nagad)

This guide is for the owner/admin to run the manual premium workflow safely.

## Scope
- Auth (login/signup/forgot-password): unchanged
- Premium unlock: manual approve/reject only
- Free access rule for learning modules: Level 1 free, Level 2+ premium gate (implemented in app phase)

## 1) Run SQL setup (one-time)
1. Open Supabase project.
2. Go to SQL Editor.
3. Run `supabase/sql/001_manual_payment_foundation.sql`.
4. Then run `supabase/sql/002_admin_review_read_policy.sql`.

This creates:
- `profiles`
- `payment_requests`
- `admin_users`
- `admin_actions`
- RLS policies
- `review_payment_request(...)` RPC

## 2) Add yourself as admin
Run in SQL editor:

```sql
insert into public.admin_users (user_id)
values ('YOUR_AUTH_USER_UUID')
on conflict (user_id) do nothing;
```

How to get your UUID:
- Supabase Dashboard -> Authentication -> Users -> copy your user id.

## 3) User payment request flow (app side)
Expected data from user:
- payment method (`bkash` / `nagad`)
- sender mobile number
- transaction id
- amount (current offer: 399)

After submit:
- status should show `processing` (from `pending`)

## 4) Admin review flow
### Option A: SQL quick review

List pending:

```sql
select id, user_id, method, sender_mobile, trx_id, amount, created_at
from public.payment_requests
where status = 'pending'
order by created_at asc;
```

Approve:

```sql
select * from public.review_payment_request(
  p_request_id := 123,
  p_decision := 'approved',
  p_review_note := 'Verified on bKash app'
);
```

Reject:

```sql
select * from public.review_payment_request(
  p_request_id := 123,
  p_decision := 'rejected',
  p_review_note := 'TRX not found'
);
```

### Option B: Admin UI (next phase)
- Open `/admin/reviews`
- Pending queue page
- Approve / Reject buttons
- Reason field for reject

## 5) Important safeguards already included
- Unique `trx_id` (no reuse)
- One pending request per user
- Only admins can approve/reject via RPC
- User cannot self-approve
- Audit log in `admin_actions`

## 6) Daily maintenance routine
1. Open pending list.
2. Verify payment in your bKash/Nagad app.
3. Approve or reject with note.
4. Done (profile premium auto-updates on approve).

## 7) Troubleshooting
- "already reviewed": request status not `pending` anymore.
- "Only admin can review": your user is not in `admin_users`.
- Duplicate trx error: same trx submitted before.

## 8) Logo asset specs (send before UI payment card phase)
Use these files for best mobile/desktop quality:

- Format: PNG with transparent background
- Color profile: sRGB
- Variants: normal + white/dark compatible (optional)
- Recommended dimensions:
  - Main payment card logo: 240 x 72 px
  - Compact button/icon logo: 120 x 36 px
  - High-res backup: 480 x 144 px
- Max file size per PNG: <= 200 KB

Naming:
- `bkash-logo.png`
- `nagad-logo.png`
- optional: `bkash-logo-dark.png`, `nagad-logo-dark.png`
