-- Run this in Supabase SQL Editor to allow profile updates from the app.
-- Reps can update their own profile; managers can update any rep in their tenant.

CREATE POLICY "rep_update_own" ON reps FOR UPDATE
  USING (id IN (SELECT rep_id FROM get_my_rep()));

CREATE POLICY "rep_update_manager" ON reps FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM get_my_rep())
    AND EXISTS (SELECT 1 FROM get_my_rep() g WHERE g.role = 'manager')
  );
