-- Allow managers to INSERT new rep rows in their tenant (Add Rep in Commission HQ).
-- Requires get_my_rep() from supabase-reps-update-policies.sql.
-- Run in Supabase SQL Editor.

-- If you already ran this once and need to replace the policy:
-- DROP POLICY IF EXISTS "rep_insert_manager" ON reps;

CREATE POLICY "rep_insert_manager" ON reps FOR INSERT
  WITH CHECK (
    tenant_id IN (SELECT tenant_id FROM get_my_rep())
    AND EXISTS (SELECT 1 FROM get_my_rep() g WHERE g.role = 'manager')
  );
