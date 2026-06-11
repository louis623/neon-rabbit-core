-- 20260611133605: Prevent duplicate founder pricing sequence assignments.
--
-- Founder pricing is limited to sequence numbers 1-20. These partial unique
-- indexes keep standard reps unsequenced while making founder slots durable.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.reps
    WHERE pricing_tier = 'founder'
      AND founder_sequence IS NOT NULL
    GROUP BY founder_sequence
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create founder pricing uniqueness guard: duplicate reps.founder_sequence values exist.';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.subscriptions
    WHERE pricing_tier = 'founder'
      AND founder_sequence IS NOT NULL
    GROUP BY founder_sequence
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Cannot create founder pricing uniqueness guard: duplicate subscriptions.founder_sequence values exist.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reps_founder_sequence_unique
  ON public.reps (founder_sequence)
  WHERE pricing_tier = 'founder'
    AND founder_sequence IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_founder_sequence_unique
  ON public.subscriptions (founder_sequence)
  WHERE pricing_tier = 'founder'
    AND founder_sequence IS NOT NULL;

CREATE OR REPLACE FUNCTION public.assign_sparkle_suite_checkout_pricing(
  p_rep_id UUID
)
RETURNS TABLE(pricing_tier TEXT, founder_sequence INTEGER)
LANGUAGE plpgsql
AS $$
DECLARE
  assigned_pricing_tier TEXT;
  assigned_founder_sequence INTEGER;
  candidate_founder_sequence INTEGER;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sparkle_suite_founder_pricing'));

  SELECT r.pricing_tier, r.founder_sequence
  INTO assigned_pricing_tier, assigned_founder_sequence
  FROM public.reps AS r
  WHERE r.id = p_rep_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rep % not found for Sparkle Suite pricing assignment.', p_rep_id
      USING ERRCODE = 'P0002';
  END IF;

  IF assigned_pricing_tier = 'founder'
    AND assigned_founder_sequence BETWEEN 1 AND 20
  THEN
    RETURN QUERY SELECT assigned_pricing_tier, assigned_founder_sequence;
    RETURN;
  END IF;

  IF assigned_pricing_tier = 'standard'
    AND EXISTS (
      SELECT 1
      FROM public.subscriptions AS s
      WHERE s.rep_id = p_rep_id
        AND s.pricing_tier = 'standard'
    )
  THEN
    RETURN QUERY SELECT 'standard'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  SELECT available_slots.candidate_founder_sequence
  INTO candidate_founder_sequence
  FROM generate_series(1, 20) AS available_slots(candidate_founder_sequence)
  WHERE NOT EXISTS (
      SELECT 1
      FROM public.reps AS r
      WHERE r.pricing_tier = 'founder'
        AND r.founder_sequence = available_slots.candidate_founder_sequence
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions AS s
      WHERE s.pricing_tier = 'founder'
        AND s.founder_sequence = available_slots.candidate_founder_sequence
    )
  ORDER BY candidate_founder_sequence
  LIMIT 1;

  IF candidate_founder_sequence IS NULL THEN
    RETURN QUERY SELECT 'standard'::TEXT, NULL::INTEGER;
    RETURN;
  END IF;

  UPDATE public.reps
  SET pricing_tier = 'founder',
      founder_sequence = candidate_founder_sequence
  WHERE id = p_rep_id;

  RETURN QUERY SELECT 'founder'::TEXT, candidate_founder_sequence;
END;
$$;

REVOKE ALL ON FUNCTION public.assign_sparkle_suite_checkout_pricing(UUID)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.assign_sparkle_suite_checkout_pricing(UUID) TO service_role;

CREATE OR REPLACE FUNCTION public.release_sparkle_suite_checkout_pricing(
  p_rep_id UUID,
  p_founder_sequence INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  affected_rows INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('sparkle_suite_founder_pricing'));

  UPDATE public.reps AS r
  SET pricing_tier = NULL,
      founder_sequence = NULL
  WHERE r.id = p_rep_id
    AND r.pricing_tier = 'founder'
    AND r.founder_sequence = p_founder_sequence
    AND NOT EXISTS (
      SELECT 1
      FROM public.subscriptions AS s
      WHERE s.rep_id = p_rep_id
        AND s.pricing_tier = 'founder'
        AND s.founder_sequence = p_founder_sequence
    );

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.release_sparkle_suite_checkout_pricing(UUID, INTEGER)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_sparkle_suite_checkout_pricing(UUID, INTEGER) TO service_role;

NOTIFY pgrst, 'reload schema';
