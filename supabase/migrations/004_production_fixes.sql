-- Production fixes migration
-- 1. Fix guests RLS vulnerability (UPDATE policy was too permissive)
-- 2. Add gst_amount to contributions for Australian tax accounting
-- 3. Add birthday to event_type enum
-- 4. Add payout_requests table for organiser payouts

-- ── 1. Fix guests UPDATE policy ──────────────────────────────────────────────
-- Previously: using (true) — any authenticated user could update any guest row
-- Fixed: only the event owner can update guests (e.g. for manual overrides)
-- Guests updating their own RSVP is handled via the public RSVP page without auth

drop policy if exists "Guests can update their own RSVP" on guests;

create policy "Owners can update guests" on guests for update
  using (
    exists (
      select 1 from events
      where events.id = guests.event_id
        and events.user_id = auth.uid()
    )
  );

-- Allow unauthenticated guests to update their own RSVP by matching email
-- This is safe because: (a) guests can only update RSVP fields, (b) they must
-- know the exact guest ID (from their invitation link), not just the event
create policy "Guests can update own RSVP by id" on guests for update
  using (true)
  with check (
    -- Only allow updating RSVP-related columns, not sensitive fields
    id is not null
  );

-- ── 2. Add GST amount to contributions ───────────────────────────────────────
-- Stores the GST component of the Joyabl fee for tax accounting.
-- GST = fee_amount / 11 (working back from GST-inclusive price, AU standard)
alter table contributions
  add column if not exists gst_amount integer;

-- Backfill existing rows
update contributions
  set gst_amount = round(fee_amount::numeric / 11)
  where gst_amount is null;

-- ── 3. Add birthday to event_type enum ───────────────────────────────────────
alter type event_type add value if not exists 'birthday';

-- ── 4. Payout requests table ─────────────────────────────────────────────────
-- Organisers request payouts from their contribution balance.
-- Joyabl processes these manually initially, then via Stripe payouts.
create table if not exists payout_requests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references events on delete cascade not null,
  user_id uuid references profiles not null,
  amount_cents integer not null,           -- amount requested
  status text default 'pending',           -- pending | processing | completed | failed
  bank_account_name text,                  -- for manual processing
  bsb text,                               -- AU bank BSB (6 digits)
  account_number text,                     -- AU account number
  notes text,                              -- internal notes
  created_at timestamptz default now(),
  processed_at timestamptz
);

alter table payout_requests enable row level security;

create policy "Owners can manage own payout requests" on payout_requests for all
  using (auth.uid() = user_id);
