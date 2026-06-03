CREATE TABLE IF NOT EXISTS self_serve_setup_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'checkout_required'
    CHECK (status IN (
      'checkout_required',
      'payment_pending',
      'required_setup',
      'setup_blocked',
      'dashboard_unlocked'
    )),
  current_step TEXT NOT NULL DEFAULT 'account_basics',
  completed_steps TEXT[] NOT NULL DEFAULT '{}'::text[],
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_copy JSONB NOT NULL DEFAULT '{}'::jsonb,
  support_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  dashboard_unlocked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (rep_id)
);

CREATE INDEX IF NOT EXISTS idx_self_serve_setup_sessions_rep_id
  ON self_serve_setup_sessions(rep_id);

CREATE TABLE IF NOT EXISTS light_box_fulfillment_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  stripe_checkout_session_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'needs_order'
    CHECK (status IN (
      'needs_order',
      'ordered',
      'blocked',
      'cancelled'
    )),
  shipping_name TEXT,
  shipping_address JSONB NOT NULL DEFAULT '{}'::jsonb,
  due_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  alert_sent_at TIMESTAMPTZ,
  alert_error TEXT,
  ordered_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_light_box_fulfillment_tasks_rep_id
  ON light_box_fulfillment_tasks(rep_id);

CREATE INDEX IF NOT EXISTS idx_light_box_fulfillment_tasks_needs_order_due
  ON light_box_fulfillment_tasks(due_at)
  WHERE status = 'needs_order';

ALTER TABLE self_serve_setup_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE light_box_fulfillment_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY self_serve_setup_sessions_own_select
  ON self_serve_setup_sessions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM reps
      WHERE reps.auth_user_id = auth.uid()
      AND reps.id = self_serve_setup_sessions.rep_id
    )
  );

CREATE POLICY self_serve_setup_sessions_service_only_writes
  ON self_serve_setup_sessions
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);

CREATE POLICY light_box_fulfillment_tasks_service_only
  ON light_box_fulfillment_tasks
  FOR ALL
  TO authenticated
  USING (false)
  WITH CHECK (false);
