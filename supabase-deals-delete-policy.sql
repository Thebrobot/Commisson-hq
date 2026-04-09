-- Run this in Supabase SQL Editor to allow delete operations on deals.
-- Reps can delete their own deals; managers can delete any deal in their tenant.
--
-- Prerequisite: get_my_rep() must exist (see supabase-reps-update-policies.sql).

-- DROP existing policies first if re-running:
-- DROP POLICY IF EXISTS "rep_delete_own_deals" ON deals;
-- DROP POLICY IF EXISTS "manager_delete_tenant_deals" ON deals;

CREATE POLICY "rep_delete_own_deals" ON deals FOR DELETE
  USING (rep_id IN (SELECT rep_id FROM get_my_rep()));

CREATE POLICY "manager_delete_tenant_deals" ON deals FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM get_my_rep())
    AND EXISTS (SELECT 1 FROM get_my_rep() g WHERE g.role = 'manager')
  );
