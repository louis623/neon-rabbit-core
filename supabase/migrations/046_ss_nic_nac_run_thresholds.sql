ALTER TABLE nic_nac_runs
  ADD COLUMN IF NOT EXISTS rollover_recommended BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS rollover_reasons TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_nic_nac_runs_rollover_created
  ON nic_nac_runs(created_at DESC)
  WHERE rollover_recommended = true;
