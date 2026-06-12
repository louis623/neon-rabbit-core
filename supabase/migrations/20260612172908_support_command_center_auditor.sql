CREATE TABLE IF NOT EXISTS public.client_account_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL UNIQUE REFERENCES public.reps(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  show_name TEXT,
  primary_contact_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  account_status TEXT,
  subscription_status TEXT,
  support_tier TEXT,
  public_site_slug TEXT,
  custom_domain TEXT,
  setup_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.support_reports
  ADD COLUMN IF NOT EXISTS client_account_profile_id UUID REFERENCES public.client_account_profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS client_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS audit_status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS audit_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS audit_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS audit_error TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'support_reports_audit_status_check'
  ) THEN
    ALTER TABLE public.support_reports
      ADD CONSTRAINT support_reports_audit_status_check
      CHECK (audit_status IN ('pending', 'running', 'completed', 'failed', 'timed_out'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.support_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  support_report_id UUID NOT NULL REFERENCES public.support_reports(id) ON DELETE CASCADE,
  client_account_profile_id UUID REFERENCES public.client_account_profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed', 'timed_out')),
  facts JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  risk_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  similar_lessons JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_first_action TEXT,
  ai_summary TEXT,
  template_summary TEXT,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.support_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_report_id UUID REFERENCES public.support_reports(id) ON DELETE SET NULL,
  client_account_profile_id UUID REFERENCES public.client_account_profiles(id) ON DELETE SET NULL,
  affected_area TEXT NOT NULL,
  symptom TEXT NOT NULL,
  root_cause TEXT NOT NULL,
  fix_or_workaround TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}'::text[],
  approved_for_reuse BOOLEAN NOT NULL DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_client_account_profiles_rep
  ON public.client_account_profiles(rep_id);

CREATE INDEX IF NOT EXISTS idx_support_reports_audit_status_created
  ON public.support_reports(audit_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_reports_client_profile_created
  ON public.support_reports(client_account_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_audits_report_created
  ON public.support_audits(support_report_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_audits_client_profile_created
  ON public.support_audits(client_account_profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_lessons_approved_area
  ON public.support_lessons(approved_for_reuse, affected_area, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_lessons_tags
  ON public.support_lessons USING GIN(tags);

ALTER TABLE public.client_account_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_lessons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS client_account_profiles_own_select ON public.client_account_profiles;
CREATE POLICY client_account_profiles_own_select ON public.client_account_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.reps rep
      WHERE rep.id = client_account_profiles.rep_id
        AND auth.uid() = rep.auth_user_id
    )
  );

DROP POLICY IF EXISTS client_account_profiles_admin_full_access ON public.client_account_profiles;
CREATE POLICY client_account_profiles_admin_full_access ON public.client_account_profiles
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS support_audits_admin_full_access ON public.support_audits;
CREATE POLICY support_audits_admin_full_access ON public.support_audits
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS support_lessons_admin_full_access ON public.support_lessons;
CREATE POLICY support_lessons_admin_full_access ON public.support_lessons
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

NOTIFY pgrst, 'reload schema';
