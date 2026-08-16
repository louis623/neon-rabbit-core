-- A cleared Nic-Nac conversation must never become the rep's default thread
-- again, while retaining rows for operational/audit continuity.
ALTER TABLE public.nic_nac_conversations
  ADD COLUMN IF NOT EXISTS cleared_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_nic_nac_conv_rep_active_latest
  ON public.nic_nac_conversations (rep_id, created_at DESC, id DESC)
  WHERE cleared_at IS NULL;
