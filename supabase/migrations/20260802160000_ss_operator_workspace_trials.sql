CREATE TABLE IF NOT EXISTS workspace_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL UNIQUE REFERENCES reps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  duration_days SMALLINT NOT NULL DEFAULT 5,
  provisioned_by_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  launch_build_id UUID REFERENCES sparkle_suite_launch_builds(id) ON DELETE SET NULL,
  provisioned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  first_signed_in_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT workspace_trials_status_check
    CHECK (status IN ('pending', 'active', 'revoked')),
  CONSTRAINT workspace_trials_fixed_duration_check
    CHECK (duration_days = 5),
  CONSTRAINT workspace_trials_activation_dates_check
    CHECK (
      (status = 'pending' AND first_signed_in_at IS NULL AND expires_at IS NULL)
      OR
      (
        status IN ('active', 'revoked')
        AND first_signed_in_at IS NOT NULL
        AND expires_at IS NOT NULL
        AND expires_at = first_signed_in_at + interval '5 days'
      )
    ),
  CONSTRAINT workspace_trials_revocation_date_check
    CHECK (
      (status = 'revoked' AND revoked_at IS NOT NULL)
      OR
      (status <> 'revoked' AND revoked_at IS NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_workspace_trials_status_expires
  ON workspace_trials(status, expires_at)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_workspace_trials_launch_build
  ON workspace_trials(launch_build_id)
  WHERE launch_build_id IS NOT NULL;

ALTER TABLE workspace_trials ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON workspace_trials TO authenticated;

DROP POLICY IF EXISTS "workspace_trials_own_read" ON workspace_trials;
CREATE POLICY "workspace_trials_own_read" ON workspace_trials
  FOR SELECT
  TO authenticated
  USING (
    rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "workspace_trials_operator_admin" ON workspace_trials;
CREATE POLICY "workspace_trials_operator_admin" ON workspace_trials
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

CREATE OR REPLACE FUNCTION activate_workspace_trial(p_rep_id UUID)
RETURNS SETOF workspace_trials
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_activated_at TIMESTAMPTZ := statement_timestamp();
BEGIN
  IF auth.role() <> 'service_role' AND NOT EXISTS (
    SELECT 1
    FROM reps
    WHERE id = p_rep_id
      AND auth_user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'WORKSPACE_TRIAL_ACTIVATION_FORBIDDEN'
      USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  UPDATE workspace_trials
  SET
    status = 'active',
    first_signed_in_at = v_activated_at,
    expires_at = v_activated_at + interval '5 days',
    updated_at = v_activated_at
  WHERE rep_id = p_rep_id
    AND status = 'pending'
  RETURNING workspace_trials.*;

  IF FOUND THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT *
  FROM workspace_trials
  WHERE rep_id = p_rep_id;
END;
$$;

REVOKE ALL ON FUNCTION activate_workspace_trial(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION activate_workspace_trial(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION activate_workspace_trial(UUID) TO service_role;
