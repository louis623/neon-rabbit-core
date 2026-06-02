CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  team_name TEXT NOT NULL,
  rep_display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  custom_domain TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.ss_team_onboarding_sites(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT ss_team_onboarding_members_site_id_id_unique UNIQUE (site_id, id)
);

CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.ss_team_onboarding_sites(id) ON DELETE CASCADE,
  member_id UUID REFERENCES public.ss_team_onboarding_members(id) ON DELETE SET NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'revoked', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.ss_team_onboarding_sites(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  href TEXT NOT NULL,
  category TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('official', 'team', 'sparkle-suite')),
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.ss_team_onboarding_sites(id) ON DELETE CASCADE,
  group_title TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  resource_ids UUID[] NOT NULL DEFAULT '{}'::uuid[],
  sort_order INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT ss_team_onboarding_steps_site_id_id_unique UNIQUE (site_id, id)
);

CREATE TABLE IF NOT EXISTS public.ss_team_onboarding_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID NOT NULL REFERENCES public.ss_team_onboarding_sites(id) ON DELETE CASCADE,
  member_id UUID,
  step_id UUID,
  question_text TEXT NOT NULL,
  answer_text TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'archived')),
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ,
  CONSTRAINT ss_team_onboarding_questions_site_member_fk
    FOREIGN KEY (site_id, member_id)
    REFERENCES public.ss_team_onboarding_members(site_id, id)
    ON DELETE SET NULL (member_id),
  CONSTRAINT ss_team_onboarding_questions_site_step_fk
    FOREIGN KEY (site_id, step_id)
    REFERENCES public.ss_team_onboarding_steps(site_id, id)
    ON DELETE SET NULL (step_id)
);

CREATE INDEX IF NOT EXISTS idx_ss_team_onboarding_sites_owner_rep
  ON public.ss_team_onboarding_sites(owner_rep_id);

CREATE INDEX IF NOT EXISTS idx_ss_team_onboarding_questions_site_status_created
  ON public.ss_team_onboarding_questions(site_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ss_team_onboarding_members_site
  ON public.ss_team_onboarding_members(site_id);

CREATE INDEX IF NOT EXISTS idx_ss_team_onboarding_resources_site_sort
  ON public.ss_team_onboarding_resources(site_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_ss_team_onboarding_steps_site_sort
  ON public.ss_team_onboarding_steps(site_id, sort_order);

ALTER TABLE public.ss_team_onboarding_sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_team_onboarding_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_team_onboarding_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_team_onboarding_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_team_onboarding_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ss_team_onboarding_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ss_team_onboarding_sites_owner_access"
  ON public.ss_team_onboarding_sites
  FOR ALL
  TO authenticated
  USING (
    owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "ss_team_onboarding_sites_admin_full_access"
  ON public.ss_team_onboarding_sites
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

CREATE POLICY "ss_team_onboarding_members_owner_access"
  ON public.ss_team_onboarding_members
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "ss_team_onboarding_members_admin_full_access"
  ON public.ss_team_onboarding_members
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

CREATE POLICY "ss_team_onboarding_invites_owner_access"
  ON public.ss_team_onboarding_invites
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "ss_team_onboarding_invites_admin_full_access"
  ON public.ss_team_onboarding_invites
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

CREATE POLICY "ss_team_onboarding_resources_owner_access"
  ON public.ss_team_onboarding_resources
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "ss_team_onboarding_resources_admin_full_access"
  ON public.ss_team_onboarding_resources
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

CREATE POLICY "ss_team_onboarding_steps_owner_access"
  ON public.ss_team_onboarding_steps
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "ss_team_onboarding_steps_admin_full_access"
  ON public.ss_team_onboarding_steps
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

CREATE POLICY "ss_team_onboarding_questions_owner_access"
  ON public.ss_team_onboarding_questions
  FOR ALL
  TO authenticated
  USING (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  )
  WITH CHECK (
    site_id IN (
      SELECT id FROM public.ss_team_onboarding_sites
      WHERE owner_rep_id = (SELECT id FROM public.reps WHERE auth_user_id = auth.uid())
    )
  );

CREATE POLICY "ss_team_onboarding_questions_admin_full_access"
  ON public.ss_team_onboarding_questions
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
