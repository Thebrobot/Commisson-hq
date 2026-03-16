-- Run this in Supabase SQL Editor to allow profile updates from the app.
-- Reps can update their own profile; managers can update any rep in their tenant.
--
-- IMPORTANT: If your rep row was added before signup, auth_user_id may be null.
-- Run this first to link your account (get your user id from Auth > Users):
--   UPDATE reps SET auth_user_id = 'YOUR-AUTH-USER-UUID' WHERE email = 'your@email.com';

-- 1. Create get_my_rep() if it doesn't exist (links auth.uid() to your rep row)
CREATE OR REPLACE FUNCTION get_my_rep()
RETURNS TABLE (rep_id uuid, tenant_id uuid, role text) AS $$
  SELECT r.id, r.tenant_id, r.role
  FROM reps r
  WHERE r.auth_user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 2. RLS policies (if you get "already exists", run the DROP lines first)
-- DROP POLICY IF EXISTS "rep_update_own" ON reps;
-- DROP POLICY IF EXISTS "rep_update_manager" ON reps;
CREATE POLICY "rep_update_own" ON reps FOR UPDATE
  USING (id IN (SELECT rep_id FROM get_my_rep()));

CREATE POLICY "rep_update_manager" ON reps FOR UPDATE
  USING (
    tenant_id IN (SELECT tenant_id FROM get_my_rep())
    AND EXISTS (SELECT 1 FROM get_my_rep() g WHERE g.role = 'manager')
  );
