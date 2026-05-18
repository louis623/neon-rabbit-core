CREATE TABLE IF NOT EXISTS nic_nac_rollovers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  source_conversation_id UUID NOT NULL,
  destination_conversation_id UUID NOT NULL,
  carried_message_count INTEGER NOT NULL DEFAULT 0 CHECK (carried_message_count >= 0),
  reason TEXT NOT NULL DEFAULT 'run_health_threshold',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nic_nac_rollovers_rep_created
  ON nic_nac_rollovers(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nic_nac_rollovers_source_created
  ON nic_nac_rollovers(source_conversation_id, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_nic_nac_rollovers_destination_unique
  ON nic_nac_rollovers(destination_conversation_id);

ALTER TABLE nic_nac_rollovers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nic_nac_rollovers_service_role_only"
  ON nic_nac_rollovers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
