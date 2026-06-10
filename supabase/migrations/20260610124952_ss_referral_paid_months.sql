CREATE TABLE IF NOT EXISTS public.rep_referral_paid_months (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_id UUID NOT NULL REFERENCES public.rep_referrals(id) ON DELETE CASCADE,
  referred_rep_id UUID NOT NULL REFERENCES public.reps(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT NOT NULL UNIQUE,
  stripe_subscription_id TEXT NOT NULL,
  stripe_customer_id TEXT,
  amount_paid_cents INTEGER NOT NULL
    CHECK (amount_paid_cents >= 0),
  paid_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rep_referral_paid_months_referral
  ON public.rep_referral_paid_months(referral_id);

CREATE INDEX IF NOT EXISTS idx_rep_referral_paid_months_referred
  ON public.rep_referral_paid_months(referred_rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_referral_paid_months_subscription
  ON public.rep_referral_paid_months(stripe_subscription_id);

ALTER TABLE public.rep_referral_paid_months ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rep_referral_paid_months'
      AND policyname = 'rep_referral_paid_months_referrer_read'
  ) THEN
    CREATE POLICY "rep_referral_paid_months_referrer_read"
      ON public.rep_referral_paid_months
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.rep_referrals
          WHERE rep_referrals.id = rep_referral_paid_months.referral_id
          AND rep_referrals.referrer_rep_id = (
            SELECT id FROM public.reps WHERE auth_user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rep_referral_paid_months'
      AND policyname = 'rep_referral_paid_months_referred_read'
  ) THEN
    CREATE POLICY "rep_referral_paid_months_referred_read"
      ON public.rep_referral_paid_months
      FOR SELECT
      USING (
        referred_rep_id = (
          SELECT id FROM public.reps WHERE auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'rep_referral_paid_months'
      AND policyname = 'rep_referral_paid_months_admin_full_access'
  ) THEN
    CREATE POLICY "rep_referral_paid_months_admin_full_access"
      ON public.rep_referral_paid_months
      FOR ALL
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
  END IF;
END $$;
