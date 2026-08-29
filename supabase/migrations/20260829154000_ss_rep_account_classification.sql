ALTER TABLE public.reps
  ADD COLUMN IF NOT EXISTS account_classification text;

UPDATE public.reps
SET account_classification = CASE
  WHEN public_site_slug IN ('milehighfizz', 'brittwithbling', 'blingkitchen')
    OR (
      lower(trim(display_name)) = 'kim goforth'
      AND lower(trim(business_name)) = 'kim goforth'
      AND status = 'active'
    )
    THEN 'customer'
  ELSE 'demo'
END
WHERE account_classification IS NULL;

ALTER TABLE public.reps
  ALTER COLUMN account_classification SET DEFAULT 'customer',
  ALTER COLUMN account_classification SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'reps_account_classification_check'
      AND conrelid = 'public.reps'::regclass
  ) THEN
    ALTER TABLE public.reps
      ADD CONSTRAINT reps_account_classification_check
      CHECK (account_classification IN ('customer', 'demo'));
  END IF;
END
$$;

CREATE INDEX IF NOT EXISTS reps_account_classification_idx
  ON public.reps (account_classification, status, created_at DESC);

COMMENT ON COLUMN public.reps.account_classification IS
  'Durable Control Center grouping. Real onboarding defaults to customer; demo/reviewer/test creation must explicitly use demo.';
