CREATE TABLE IF NOT EXISTS team_management_entitlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL UNIQUE REFERENCES reps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'manual_beta',
  source TEXT NOT NULL DEFAULT 'manual_beta',
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  stripe_customer_id TEXT,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT team_management_entitlements_status_check
    CHECK (status IN ('manual_beta', 'active', 'past_due', 'disabled')),
  CONSTRAINT team_management_entitlements_source_check
    CHECK (source IN ('manual_beta', 'stripe_addon'))
);

CREATE INDEX IF NOT EXISTS idx_team_management_entitlements_stripe_subscription
  ON team_management_entitlements(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS team_onboarding_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'invited',
  access_slug TEXT NOT NULL UNIQUE,
  access_token_hash TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  last_activity_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  CONSTRAINT team_onboarding_participants_display_name_not_blank
    CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT team_onboarding_participants_status_check
    CHECK (status IN ('invited', 'started', 'needs_help', 'completed', 'archived')),
  CONSTRAINT team_onboarding_participants_email_check
    CHECK (contact_email IS NULL OR position('@' in contact_email) > 1)
);

CREATE INDEX IF NOT EXISTS idx_team_onboarding_participants_owner_status
  ON team_onboarding_participants(owner_rep_id, status, created_at DESC);

CREATE TABLE IF NOT EXISTS team_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES team_onboarding_participants(id) ON DELETE CASCADE,
  step_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'not_started',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT team_onboarding_progress_step_id_not_blank
    CHECK (length(btrim(step_id)) > 0),
  CONSTRAINT team_onboarding_progress_status_check
    CHECK (status IN ('not_started', 'done', 'needs_help')),
  UNIQUE (participant_id, step_id)
);

CREATE INDEX IF NOT EXISTS idx_team_onboarding_progress_participant
  ON team_onboarding_progress(participant_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS team_onboarding_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID NOT NULL REFERENCES team_onboarding_participants(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT team_onboarding_messages_sender_type_check
    CHECK (sender_type IN ('participant', 'team_lead')),
  CONSTRAINT team_onboarding_messages_body_not_blank
    CHECK (length(btrim(body)) > 0)
);

CREATE INDEX IF NOT EXISTS idx_team_onboarding_messages_participant_created
  ON team_onboarding_messages(participant_id, created_at);

ALTER TABLE team_management_entitlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_onboarding_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_onboarding_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_onboarding_messages ENABLE ROW LEVEL SECURITY;

GRANT SELECT ON team_management_entitlements TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_onboarding_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_onboarding_progress TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON team_onboarding_messages TO authenticated;

DROP POLICY IF EXISTS "team_management_entitlements_own_data" ON team_management_entitlements;
CREATE POLICY "team_management_entitlements_own_data" ON team_management_entitlements
  FOR SELECT
  TO authenticated
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "team_onboarding_participants_own_data" ON team_onboarding_participants;
CREATE POLICY "team_onboarding_participants_own_data" ON team_onboarding_participants
  FOR ALL
  TO authenticated
  USING (owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()))
  WITH CHECK (owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "team_onboarding_progress_own_data" ON team_onboarding_progress;
CREATE POLICY "team_onboarding_progress_own_data" ON team_onboarding_progress
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM team_onboarding_participants participant
      WHERE participant.id = team_onboarding_progress.participant_id
      AND participant.owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM team_onboarding_participants participant
      WHERE participant.id = team_onboarding_progress.participant_id
      AND participant.owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "team_onboarding_messages_own_data" ON team_onboarding_messages;
CREATE POLICY "team_onboarding_messages_own_data" ON team_onboarding_messages
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM team_onboarding_participants participant
      WHERE participant.id = team_onboarding_messages.participant_id
      AND participant.owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM team_onboarding_participants participant
      WHERE participant.id = team_onboarding_messages.participant_id
      AND participant.owner_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "team_management_entitlements_admin_full_access" ON team_management_entitlements;
CREATE POLICY "team_management_entitlements_admin_full_access" ON team_management_entitlements
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );

INSERT INTO team_management_entitlements (
  rep_id,
  status,
  source,
  stripe_subscription_id,
  stripe_price_id,
  stripe_customer_id
)
SELECT
  reps.id,
  'manual_beta',
  'manual_beta',
  NULL,
  NULL,
  reps.stripe_customer_id
FROM reps
WHERE reps.public_site_slug = 'brittwithbling'
ON CONFLICT (rep_id) DO UPDATE
SET
  status = EXCLUDED.status,
  source = EXCLUDED.source,
  stripe_customer_id = EXCLUDED.stripe_customer_id,
  updated_at = now();
