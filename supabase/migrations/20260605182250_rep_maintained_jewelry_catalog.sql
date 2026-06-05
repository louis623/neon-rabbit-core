-- Rep-maintained jewelry catalog.
-- Reps contribute through Nic-Nac; Nic-Nac applies quality checks and writes
-- quiet history. This is not a manual Louis review queue.

ALTER TABLE jewelry_designs
  ADD COLUMN IF NOT EXISTS created_by_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_corrected_by_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_corrected_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS jewelry_catalog_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  design_id UUID NOT NULL REFERENCES jewelry_designs(id) ON DELETE CASCADE,
  rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  conversation_id TEXT,
  change_type TEXT NOT NULL CHECK (
    change_type IN (
      'create_design',
      'report_issue',
      'correct_design_fields',
      'replace_canonical_photo'
    )
  ),
  issue_type TEXT CHECK (
    issue_type IS NULL OR issue_type IN (
      'wrong_item_number',
      'wrong_collection',
      'wrong_design_name',
      'wrong_msrp',
      'wrong_jewelry_type',
      'wrong_material',
      'wrong_stone',
      'bad_photo',
      'duplicate',
      'other'
    )
  ),
  reason TEXT,
  before_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  after_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jewelry_catalog_change_log_design
  ON jewelry_catalog_change_log(design_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jewelry_catalog_change_log_rep
  ON jewelry_catalog_change_log(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_jewelry_designs_created_by_rep
  ON jewelry_designs(created_by_rep_id);

ALTER TABLE jewelry_catalog_change_log ENABLE ROW LEVEL SECURITY;
