CREATE TABLE IF NOT EXISTS public.support_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  conversation_id TEXT,
  run_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('help_form', 'nic_nac')),
  report_type TEXT NOT NULL CHECK (report_type IN ('site_issue', 'bug', 'suggested_upgrade', 'workflow_idea')),
  urgency TEXT NOT NULL DEFAULT 'normal' CHECK (urgency IN ('normal', 'blocking', 'showtime_urgent')),
  urgency_rank INTEGER GENERATED ALWAYS AS (
    CASE urgency
      WHEN 'showtime_urgent' THEN 3
      WHEN 'blocking' THEN 2
      ELSE 1
    END
  ) STORED,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'reviewing', 'planned', 'resolved', 'closed')),
  page_or_workflow TEXT,
  title TEXT NOT NULL,
  details TEXT NOT NULL,
  expected_result TEXT,
  actual_result TEXT,
  contact_ok BOOLEAN NOT NULL DEFAULT true,
  notification_channel TEXT NOT NULL DEFAULT 'google_chat',
  notification_status TEXT NOT NULL DEFAULT 'pending' CHECK (notification_status IN ('pending', 'delivered', 'not_configured', 'failed')),
  notification_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_reports_rep_created
  ON public.support_reports(rep_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_reports_status_urgency_rank_created
  ON public.support_reports(status, urgency_rank DESC, created_at DESC);

ALTER TABLE public.support_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS support_reports_own_select ON public.support_reports;
CREATE POLICY support_reports_own_select ON public.support_reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reps rep
      WHERE rep.id = support_reports.rep_id
        AND auth.uid() = rep.auth_user_id
    )
  );

DROP POLICY IF EXISTS support_reports_admin_full_access ON public.support_reports;
CREATE POLICY support_reports_admin_full_access ON public.support_reports
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
