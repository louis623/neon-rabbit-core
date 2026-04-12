-- Fix infinite recursion in reps_admin_full_access policy.
-- The original policy queries the reps table itself, which triggers its own
-- RLS policies in an infinite loop. Use JWT email claim instead.

DROP POLICY IF EXISTS "reps_admin_full_access" ON reps;

CREATE POLICY "reps_admin_full_access" ON reps
  FOR ALL
  USING (auth.jwt() ->> 'email' = 'louis@neonrabbit.net');
