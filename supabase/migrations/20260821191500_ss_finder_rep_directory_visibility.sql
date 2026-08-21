ALTER TABLE public.reps
  ADD COLUMN IF NOT EXISTS finder_directory_visible BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.reps.finder_directory_visible IS
  'Controls whether this real rep may appear in the public Sparkle Finder directory. Demo, reviewer, fixture, and internal accounts remain false.';

CREATE INDEX IF NOT EXISTS reps_finder_directory_visible_active_idx
  ON public.reps (LOWER(display_name), id)
  WHERE finder_directory_visible = true
    AND status = 'active';

CREATE INDEX IF NOT EXISTS calendar_events_finder_directory_current_idx
  ON public.calendar_events (rep_id, status, event_time, id)
  WHERE status IN ('live', 'scheduled');

-- Heather / BlingKitchen is the one established real rep currently using the
-- product. Keep the backfill exact and fail closed if an existing Heather row
-- does not match the established identity; empty/local databases remain valid.
DO $$
DECLARE
  matching_rep_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reps
    WHERE id = '9a971c05-3631-443e-bcb8-4e9a26e15885'::uuid
       OR public_site_slug = 'blingkitchen'
  ) THEN
    SELECT COUNT(*)
    INTO matching_rep_count
    FROM public.reps
    WHERE id = '9a971c05-3631-443e-bcb8-4e9a26e15885'::uuid
      AND public_site_slug = 'blingkitchen'
      AND LOWER(BTRIM(display_name)) = 'heather'
      AND LOWER(BTRIM(business_name)) = 'blingkitchen'
      AND status = 'active';

    IF matching_rep_count <> 1 THEN
      RAISE EXCEPTION 'BlingKitchen Finder visibility backfill identity mismatch';
    END IF;

    UPDATE public.reps
    SET finder_directory_visible = true
    WHERE id = '9a971c05-3631-443e-bcb8-4e9a26e15885'::uuid;
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.list_sparkle_finder_public_reps(
  p_limit INTEGER DEFAULT 50,
  p_query TEXT DEFAULT NULL,
  p_as_of TIMESTAMPTZ DEFAULT statement_timestamp()
)
RETURNS TABLE (
  rep_id UUID,
  display_name TEXT,
  business_name TEXT,
  avatar_url TEXT,
  public_site_slug TEXT,
  next_show_id UUID,
  next_show_name TEXT,
  next_show_starts_at TIMESTAMPTZ,
  next_show_status TEXT,
  next_show_duration_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    rep.id AS rep_id,
    rep.display_name,
    NULLIF(BTRIM(rep.business_name), '') AS business_name,
    NULLIF(BTRIM(rep.profile_photo_url), '') AS avatar_url,
    NULLIF(LOWER(BTRIM(rep.public_site_slug)), '') AS public_site_slug,
    next_show.id AS next_show_id,
    COALESCE(
      NULLIF(BTRIM(next_show.title), ''),
      NULLIF(BTRIM(rep.business_name), ''),
      NULLIF(BTRIM(rep.display_name), ''),
      'Sparkle show'
    ) AS next_show_name,
    next_show.event_time AS next_show_starts_at,
    next_show.status::TEXT AS next_show_status,
    CASE
      WHEN next_show.duration_minutes IS NOT NULL
        AND next_show.duration_minutes > 0
      THEN next_show.duration_minutes
      ELSE NULL
    END AS next_show_duration_minutes
  FROM public.reps AS rep
  LEFT JOIN LATERAL (
    SELECT
      event.id,
      event.title,
      event.event_time,
      event.status,
      event.duration_minutes
    FROM public.calendar_events AS event
    WHERE event.rep_id = rep.id
      AND (
        (
          event.status = 'scheduled'
          AND event.event_time >= p_as_of
        )
        OR
        (
          event.status = 'live'
          AND event.event_time <= p_as_of
          AND event.event_time
            + MAKE_INTERVAL(
                mins => GREATEST(COALESCE(event.duration_minutes, 60), 1)
              ) > p_as_of
        )
      )
    ORDER BY
      CASE WHEN event.status = 'live' THEN 0 ELSE 1 END,
      event.event_time,
      event.id
    LIMIT 1
  ) AS next_show ON true
  WHERE rep.status = 'active'
    AND rep.finder_directory_visible = true
    AND (
      NULLIF(BTRIM(p_query), '') IS NULL
      OR STRPOS(LOWER(rep.display_name), LOWER(BTRIM(p_query))) > 0
      OR STRPOS(LOWER(COALESCE(rep.business_name, '')), LOWER(BTRIM(p_query))) > 0
    )
  ORDER BY
    CASE
      WHEN next_show.status = 'live' THEN 0
      WHEN next_show.id IS NOT NULL THEN 1
      ELSE 2
    END,
    next_show.event_time NULLS LAST,
    LOWER(rep.display_name),
    rep.id
  LIMIT LEAST(GREATEST(COALESCE(p_limit, 50), 1), 200)
$$;

REVOKE ALL ON FUNCTION public.list_sparkle_finder_public_reps(
  INTEGER,
  TEXT,
  TIMESTAMPTZ
) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_sparkle_finder_public_reps(
  INTEGER,
  TEXT,
  TIMESTAMPTZ
) TO service_role;

CREATE OR REPLACE FUNCTION public.guard_finder_directory_visibility()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NEW.finder_directory_visible IS DISTINCT FROM OLD.finder_directory_visible
    AND COALESCE(auth.role(), '') <> 'service_role'
    AND session_user NOT IN ('postgres', 'supabase_admin')
  THEN
    RAISE EXCEPTION 'finder_directory_visible is managed by Sparkle Suite'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.guard_finder_directory_visibility() FROM PUBLIC;

DROP TRIGGER IF EXISTS guard_finder_directory_visibility_update ON public.reps;
CREATE TRIGGER guard_finder_directory_visibility_update
  BEFORE UPDATE OF finder_directory_visible ON public.reps
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_finder_directory_visibility();
