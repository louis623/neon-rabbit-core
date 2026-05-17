CREATE TABLE IF NOT EXISTS nic_nac_show_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  calendar_event_id UUID REFERENCES calendar_events(id) ON DELETE SET NULL,
  live_queue_sync_code TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  summary TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (status = 'active' AND ended_at IS NULL)
    OR (status = 'ended' AND ended_at IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS nic_nac_show_session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES nic_nac_show_sessions(id) ON DELETE CASCADE,
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'show_started',
    'queue_snapshot',
    'inventory_note',
    'customer_request',
    'promise',
    'follow_up',
    'trade_note',
    'show_summary'
  )),
  summary TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  conversation_id UUID,
  run_id TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nic_nac_show_sessions_one_active
  ON nic_nac_show_sessions(rep_id)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_nic_nac_show_sessions_rep_time
  ON nic_nac_show_sessions(rep_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_nic_nac_show_sessions_calendar_event
  ON nic_nac_show_sessions(calendar_event_id)
  WHERE calendar_event_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nic_nac_show_sessions_live_queue_sync
  ON nic_nac_show_sessions(live_queue_sync_code)
  WHERE live_queue_sync_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_nic_nac_show_session_events_session_time
  ON nic_nac_show_session_events(session_id, occurred_at DESC);

CREATE INDEX IF NOT EXISTS idx_nic_nac_show_session_events_rep_type_time
  ON nic_nac_show_session_events(rep_id, event_type, occurred_at DESC);

ALTER TABLE nic_nac_show_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nic_nac_show_session_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nic_nac_show_sessions_own_data"
  ON nic_nac_show_sessions
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "nic_nac_show_sessions_admin_full_access"
  ON nic_nac_show_sessions
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

CREATE POLICY "nic_nac_show_session_events_own_data"
  ON nic_nac_show_session_events
  FOR ALL
  TO authenticated
  USING (
    auth.uid() IS NOT NULL
    AND rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "nic_nac_show_session_events_admin_full_access"
  ON nic_nac_show_session_events
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
