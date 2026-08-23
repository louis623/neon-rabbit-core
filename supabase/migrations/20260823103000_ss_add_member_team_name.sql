-- A rep may belong to an upline team while also managing a separate team.
-- Keep team_name as the managed, customer-facing team for backwards compatibility.
ALTER TABLE site_settings
  ADD COLUMN IF NOT EXISTS member_team_name TEXT;
