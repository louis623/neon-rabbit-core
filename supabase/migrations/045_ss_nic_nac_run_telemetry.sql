CREATE TABLE IF NOT EXISTS nic_nac_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT NOT NULL UNIQUE,
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL,
  model TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('complete', 'aborted', 'error')),
  latency_ms INTEGER NOT NULL CHECK (latency_ms >= 0),
  input_tokens INTEGER CHECK (input_tokens IS NULL OR input_tokens >= 0),
  output_tokens INTEGER CHECK (output_tokens IS NULL OR output_tokens >= 0),
  total_tokens INTEGER CHECK (total_tokens IS NULL OR total_tokens >= 0),
  cache_read_tokens INTEGER CHECK (cache_read_tokens IS NULL OR cache_read_tokens >= 0),
  cache_write_tokens INTEGER CHECK (cache_write_tokens IS NULL OR cache_write_tokens >= 0),
  routed_intents TEXT[] NOT NULL DEFAULT '{}',
  tool_names TEXT[] NOT NULL DEFAULT '{}',
  tool_count INTEGER NOT NULL DEFAULT 0 CHECK (tool_count >= 0),
  model_message_count INTEGER NOT NULL CHECK (model_message_count >= 0),
  original_message_count INTEGER NOT NULL CHECK (original_message_count >= 0),
  dropped_message_count INTEGER NOT NULL DEFAULT 0 CHECK (dropped_message_count >= 0),
  estimated_context_tokens INTEGER NOT NULL DEFAULT 0 CHECK (estimated_context_tokens >= 0),
  context_compacted BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_nic_nac_runs_rep_created
  ON nic_nac_runs(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nic_nac_runs_conversation_created
  ON nic_nac_runs(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_nic_nac_runs_status_created
  ON nic_nac_runs(status, created_at DESC);

ALTER TABLE nic_nac_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "nic_nac_runs_service_role_only"
  ON nic_nac_runs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
