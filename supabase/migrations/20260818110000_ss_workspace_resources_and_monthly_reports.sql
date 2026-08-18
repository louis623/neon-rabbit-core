ALTER TABLE public.customer_audience
  ADD COLUMN IF NOT EXISTS record_source TEXT NOT NULL DEFAULT 'manual';

ALTER TABLE public.customer_audience
  DROP CONSTRAINT IF EXISTS customer_audience_record_source_check;

ALTER TABLE public.customer_audience
  ADD CONSTRAINT customer_audience_record_source_check
  CHECK (record_source IN ('manual', 'manual_import', 'nic_nac', 'customer_site_signup'));

CREATE OR REPLACE FUNCTION public.enqueue_customer_signup_message_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.record_source = 'customer_site_signup' THEN
    INSERT INTO public.workspace_message_outbox (
      event_type,
      idempotency_key,
      payload
    ) VALUES (
      'customer_signup_created',
      'customer-signup:' || NEW.id::TEXT,
      jsonb_build_object(
        'repId', NEW.rep_id,
        'audienceId', NEW.id,
        'customerFirstName', split_part(NEW.name, ' ', 1),
        'createdAt', NEW.created_at
      )
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_customer_signup_message_event
  ON public.customer_audience;
CREATE TRIGGER trg_customer_signup_message_event
AFTER INSERT ON public.customer_audience
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_customer_signup_message_event();

REVOKE ALL ON FUNCTION public.enqueue_customer_signup_message_event()
  FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS public.workspace_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL UNIQUE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('help', 'faq', 'blog', 'video')),
  title TEXT NOT NULL CHECK (length(btrim(title)) > 0),
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'General',
  tags TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  thumbnail_url TEXT,
  video_provider TEXT CHECK (video_provider IS NULL OR video_provider IN ('youtube', 'vimeo', 'loom', 'other')),
  video_url TEXT,
  action_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  change_summary TEXT NOT NULL DEFAULT '',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  author_label TEXT NOT NULL DEFAULT 'Sparkle Suite',
  published_at TIMESTAMPTZ,
  created_by_kind TEXT NOT NULL DEFAULT 'owner' CHECK (created_by_kind IN ('owner', 'agent', 'automation')),
  created_by TEXT NOT NULL DEFAULT 'Louis',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (resource_type <> 'video' OR video_url IS NOT NULL),
  CHECK (status <> 'published' OR published_at IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.workspace_resource_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.workspace_resources(id) ON DELETE CASCADE,
  version INTEGER NOT NULL CHECK (version > 0),
  title TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  change_summary TEXT NOT NULL DEFAULT '',
  content_snapshot JSONB NOT NULL DEFAULT '{}'::JSONB,
  announcement_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (announcement_status IN ('pending', 'published', 'failed', 'not_required')),
  publication_id UUID REFERENCES public.workspace_message_publications(id) ON DELETE SET NULL,
  announcement_error TEXT,
  published_by_kind TEXT NOT NULL CHECK (published_by_kind IN ('owner', 'agent', 'automation')),
  published_by TEXT NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (resource_id, version)
);

CREATE TABLE IF NOT EXISTS public.workspace_monthly_report_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  report_month DATE NOT NULL,
  time_zone TEXT NOT NULL DEFAULT 'America/New_York',
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metrics JSONB NOT NULL DEFAULT '[]'::JSONB,
  birthdays JSONB NOT NULL DEFAULT '[]'::JSONB,
  generator_version TEXT NOT NULL,
  publication_id UUID REFERENCES public.workspace_message_publications(id) ON DELETE SET NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (date_trunc('month', report_month)::DATE = report_month),
  CHECK (period_end > period_start),
  UNIQUE (rep_id, report_month)
);

CREATE OR REPLACE FUNCTION public.enqueue_workspace_resource_message_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.announcement_status = 'pending' THEN
    INSERT INTO public.workspace_message_outbox (
      event_type,
      idempotency_key,
      payload
    ) VALUES (
      'workspace_resource_published',
      'resource-published:' || NEW.resource_id::TEXT || ':' || NEW.version::TEXT,
      jsonb_build_object(
        'resourceId', NEW.resource_id,
        'revisionId', NEW.id,
        'version', NEW.version
      )
    )
    ON CONFLICT (idempotency_key) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_workspace_resource_message_event
  ON public.workspace_resource_revisions;
CREATE TRIGGER trg_workspace_resource_message_event
AFTER INSERT ON public.workspace_resource_revisions
FOR EACH ROW
EXECUTE FUNCTION public.enqueue_workspace_resource_message_event();

REVOKE ALL ON FUNCTION public.enqueue_workspace_resource_message_event()
  FROM PUBLIC, anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_workspace_resources_published
  ON public.workspace_resources (resource_type, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_workspace_resources_featured
  ON public.workspace_resources (is_featured, published_at DESC)
  WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_workspace_resource_revisions_pending
  ON public.workspace_resource_revisions (announcement_status, published_at)
  WHERE announcement_status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_workspace_monthly_reports_rep_month
  ON public.workspace_monthly_report_snapshots (rep_id, report_month DESC);

ALTER TABLE public.workspace_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_resource_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_monthly_report_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "workspace_resources_reps_read_published" ON public.workspace_resources;
CREATE POLICY "workspace_resources_reps_read_published"
  ON public.workspace_resources
  FOR SELECT
  TO authenticated
  USING (status = 'published');

DROP POLICY IF EXISTS "workspace_resources_admin_full_access" ON public.workspace_resources;
CREATE POLICY "workspace_resources_admin_full_access"
  ON public.workspace_resources
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  );

DROP POLICY IF EXISTS "workspace_resource_revisions_admin_full_access" ON public.workspace_resource_revisions;
CREATE POLICY "workspace_resource_revisions_admin_full_access"
  ON public.workspace_resource_revisions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  );

DROP POLICY IF EXISTS "workspace_monthly_reports_own_select" ON public.workspace_monthly_report_snapshots;
CREATE POLICY "workspace_monthly_reports_own_select"
  ON public.workspace_monthly_report_snapshots
  FOR SELECT
  TO authenticated
  USING (
    rep_id = (
      SELECT id FROM public.reps WHERE auth_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "workspace_monthly_reports_admin_full_access" ON public.workspace_monthly_report_snapshots;
CREATE POLICY "workspace_monthly_reports_admin_full_access"
  ON public.workspace_monthly_report_snapshots
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.reps
      WHERE auth_user_id = auth.uid()
        AND email = 'louis@neonrabbit.net'
    )
  );

GRANT SELECT ON public.workspace_resources TO authenticated;
GRANT SELECT ON public.workspace_monthly_report_snapshots TO authenticated;
GRANT ALL ON public.workspace_resources TO service_role;
GRANT ALL ON public.workspace_resource_revisions TO service_role;
GRANT ALL ON public.workspace_monthly_report_snapshots TO service_role;

NOTIFY pgrst, 'reload schema';
