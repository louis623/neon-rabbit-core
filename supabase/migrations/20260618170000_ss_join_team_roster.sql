CREATE TABLE IF NOT EXISTS join_team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  business_name TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  initials TEXT NOT NULL DEFAULT '',
  photo_url TEXT NOT NULL DEFAULT '',
  photo_alt TEXT NOT NULL DEFAULT '',
  image_class_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  links JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_visible BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT join_team_members_display_name_not_blank
    CHECK (length(btrim(display_name)) > 0),
  CONSTRAINT join_team_members_links_object
    CHECK (jsonb_typeof(links) = 'object')
);

CREATE INDEX IF NOT EXISTS idx_join_team_members_rep_visible_order
  ON join_team_members(rep_id, is_visible, sort_order, display_name);

ALTER TABLE join_team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "join_team_members_own_data" ON join_team_members;
CREATE POLICY "join_team_members_own_data" ON join_team_members
  FOR ALL
  TO authenticated
  USING (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()))
  WITH CHECK (rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

DROP POLICY IF EXISTS "join_team_members_admin_full_access" ON join_team_members;
CREATE POLICY "join_team_members_admin_full_access" ON join_team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );
