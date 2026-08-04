-- Rep-owned customer profile details. These are intentionally additive to the
-- existing opt-in table so message history, STOP handling, and reminder-run
-- foreign keys retain their established audience ids.
ALTER TABLE public.customer_audience
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS birthday_month SMALLINT,
  ADD COLUMN IF NOT EXISTS birthday_day SMALLINT,
  ADD COLUMN IF NOT EXISTS favorite_gem_or_stone TEXT,
  ADD COLUMN IF NOT EXISTS favorite_material TEXT,
  ADD COLUMN IF NOT EXISTS favorite_cut TEXT,
  ADD COLUMN IF NOT EXISTS favorite_collection TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[];

ALTER TABLE public.customer_audience
  ADD CONSTRAINT customer_audience_birthday_month_range
    CHECK (birthday_month IS NULL OR birthday_month BETWEEN 1 AND 12),
  ADD CONSTRAINT customer_audience_birthday_day_range
    CHECK (birthday_day IS NULL OR birthday_day BETWEEN 1 AND 31),
  ADD CONSTRAINT customer_audience_birthday_parts_together
    CHECK (
      (birthday_month IS NULL AND birthday_day IS NULL)
      OR (birthday_month IS NOT NULL AND birthday_day IS NOT NULL)
    );

CREATE INDEX IF NOT EXISTS idx_customer_audience_rep_birthday
  ON public.customer_audience (rep_id, birthday_month, birthday_day)
  WHERE birthday_month IS NOT NULL AND birthday_day IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customer_audience_rep_created
  ON public.customer_audience (rep_id, created_at DESC);

-- Lets the audit foreign key prove that an event's customer belongs to the
-- same rep recorded on the event.
ALTER TABLE public.customer_audience
  ADD CONSTRAINT customer_audience_id_rep_unique UNIQUE (id, rep_id);

-- Audit rows are append-only. The service records a compact structured diff
-- for profile creates and edits without allowing normal application users to
-- update or delete audit history.
CREATE TABLE IF NOT EXISTS public.customer_audience_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_id UUID NOT NULL,
  rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  actor_kind TEXT NOT NULL CHECK (actor_kind IN ('customer', 'rep', 'nic_nac', 'system')),
  actor_rep_id UUID REFERENCES public.reps(id) ON DELETE SET NULL,
  nic_nac_conversation_id UUID,
  nic_nac_run_id TEXT,
  action TEXT NOT NULL CHECK (action IN ('created', 'profile_updated')),
  changes JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT customer_audience_change_log_audience_rep_fkey
    FOREIGN KEY (audience_id, rep_id)
    REFERENCES public.customer_audience(id, rep_id)
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_customer_audience_change_log_audience_created
  ON public.customer_audience_change_log (audience_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_audience_change_log_rep_created
  ON public.customer_audience_change_log (rep_id, created_at DESC);

ALTER TABLE public.customer_audience_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audience_change_log_own_select" ON public.customer_audience_change_log
  FOR SELECT
  USING (rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid()));

-- Profile writes use the authenticated workspace client, so permit a rep to
-- append only records scoped to that rep. There is deliberately no UPDATE or
-- DELETE policy for this table.
CREATE POLICY "audience_change_log_own_insert" ON public.customer_audience_change_log
  FOR INSERT
  WITH CHECK (
    rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    AND (actor_rep_id IS NULL OR actor_rep_id = rep_id)
  );

CREATE POLICY "audience_change_log_admin_select" ON public.customer_audience_change_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  );

COMMENT ON COLUMN public.customer_audience.birthday_month IS
  'Optional birthday month for promotional and gift outreach; birth years are never stored.';
COMMENT ON COLUMN public.customer_audience.birthday_day IS
  'Optional birthday day for promotional and gift outreach; birth years are never stored.';
COMMENT ON TABLE public.customer_audience_change_log IS
  'Append-only audit trail for customer contact profile creation and edits.';
