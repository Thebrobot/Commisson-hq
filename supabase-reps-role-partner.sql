-- Allow reps.role = 'partner' (sales partners: MRR/book visibility, no in-app commission UI).
-- Run in Supabase SQL Editor after your base schema exists.
--
-- RLS follow-up (optional): If you expose commission columns or payout tables to the client,
-- add policies so role = 'partner' cannot SELECT those fields, while managers retain full access.
-- This app currently relies on UI gating; tighten RLS when you split sensitive data.

-- Drop legacy check if present (name may differ — inspect pg_constraint for reps)
ALTER TABLE reps DROP CONSTRAINT IF EXISTS reps_role_check;

ALTER TABLE reps
  ADD CONSTRAINT reps_role_check
  CHECK (role IN ('manager', 'rep', 'partner'));
