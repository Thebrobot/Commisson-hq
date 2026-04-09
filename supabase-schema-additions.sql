-- Commission HQ Schema Additions
-- Run this in the Supabase SQL Editor to enable new features.

-- 1. Add internal notes field to deals (for rep notes per client)
ALTER TABLE deals ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Add per-rep monthly goal override (falls back to app config if null)
ALTER TABLE reps ADD COLUMN IF NOT EXISTS monthly_goal NUMERIC;

-- 3. Grant reps read access to their own monthly_goal
-- (Already covered by existing RLS if your reps policy allows SELECT on own row)

-- Optional: verify the changes
-- SELECT column_name, data_type FROM information_schema.columns
--   WHERE table_name IN ('deals', 'reps') AND column_name IN ('notes', 'monthly_goal')
--   ORDER BY table_name, column_name;
