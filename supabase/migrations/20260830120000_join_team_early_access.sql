-- Join Team is an operator-provisioned early-access feature. New and existing
-- reps stay off by default until explicitly enabled.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS join_team_access_enabled BOOLEAN NOT NULL DEFAULT false;

-- Preserve the approved first cohort and make Heather's already-approved page
-- visible when this release is applied. No Team Management entitlement changes.
UPDATE public.site_settings AS settings
SET
  join_team_access_enabled = true,
  show_join_page = true,
  updated_at = now()
FROM public.reps AS rep
WHERE settings.rep_id = rep.id
  AND rep.account_classification = 'customer'
  AND rep.public_site_slug IN ('milehighfizz', 'blingkitchen', 'brittwithbling');
