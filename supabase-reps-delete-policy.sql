-- Allow managers to DELETE rep rows in their tenant (Remove from team in Commission HQ).
-- Requires get_my_rep() from supabase-reps-update-policies.sql.
-- Prevents deleting your own row via RLS (extra safety on top of the app).
--
-- Run in Supabase SQL Editor.
-- DROP POLICY IF EXISTS "rep_delete_manager" ON reps;

CREATE POLICY "rep_delete_manager" ON reps FOR DELETE
  USING (
    tenant_id IN (SELECT tenant_id FROM get_my_rep())
    AND EXISTS (SELECT 1 FROM get_my_rep() g WHERE g.role = 'manager')
    AND id NOT IN (SELECT rep_id FROM get_my_rep())
  );
