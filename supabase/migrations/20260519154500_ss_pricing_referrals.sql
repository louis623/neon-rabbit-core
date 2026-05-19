-- 20260519154500: Sparkle Suite pricing assignment and referral tracking

CREATE OR REPLACE FUNCTION generate_sparkle_suite_referral_code()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  alphabet CONSTANT TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  output TEXT := 'SS-';
BEGIN
  FOR index IN 1..6 LOOP
    output := output || substr(alphabet, 1 + floor(random() * length(alphabet))::integer, 1);
  END LOOP;

  RETURN output;
END;
$$;

ALTER TABLE reps
  ADD COLUMN IF NOT EXISTS referral_code TEXT,
  ADD COLUMN IF NOT EXISTS pricing_tier TEXT,
  ADD COLUMN IF NOT EXISTS founder_sequence INTEGER;

DO $$
DECLARE
  rep_row RECORD;
  candidate TEXT;
BEGIN
  FOR rep_row IN
    SELECT id
    FROM reps
    WHERE referral_code IS NULL
  LOOP
    LOOP
      candidate := generate_sparkle_suite_referral_code();
      EXIT WHEN NOT EXISTS (
        SELECT 1
        FROM reps
        WHERE upper(referral_code) = candidate
      );
    END LOOP;

    UPDATE reps
    SET referral_code = candidate
    WHERE id = rep_row.id;
  END LOOP;
END;
$$;

ALTER TABLE reps
  ADD CONSTRAINT reps_referral_code_format
    CHECK (
      referral_code IS NULL
      OR referral_code ~ '^SS-[A-HJ-NP-Z2-9]{6}$'
    ),
  ADD CONSTRAINT reps_pricing_tier_check
    CHECK (
      pricing_tier IS NULL
      OR pricing_tier IN ('founder', 'standard')
    ),
  ADD CONSTRAINT reps_founder_sequence_check
    CHECK (
      founder_sequence IS NULL
      OR founder_sequence BETWEEN 1 AND 20
    );

CREATE UNIQUE INDEX IF NOT EXISTS idx_reps_referral_code_unique
  ON reps (upper(referral_code))
  WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS rep_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_rep_id UUID NOT NULL REFERENCES reps(id) ON DELETE CASCADE,
  referred_rep_id UUID REFERENCES reps(id) ON DELETE SET NULL,
  referral_code_used TEXT NOT NULL,
  reward_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (reward_status IN ('pending', 'eligible', 'credited', 'forfeited', 'rejected')),
  paid_service_months INTEGER NOT NULL DEFAULT 0
    CHECK (paid_service_months >= 0),
  eligibility_reached_at TIMESTAMPTZ,
  credit_issued_at TIMESTAMPTZ,
  stripe_credit_id TEXT,
  stripe_customer_id TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT rep_referrals_no_self_referral
    CHECK (referred_rep_id IS NULL OR referred_rep_id <> referrer_rep_id),
  UNIQUE (referred_rep_id)
);

CREATE INDEX IF NOT EXISTS idx_rep_referrals_referrer
  ON rep_referrals(referrer_rep_id);

CREATE INDEX IF NOT EXISTS idx_rep_referrals_reward_status
  ON rep_referrals(reward_status);

CREATE INDEX IF NOT EXISTS idx_rep_referrals_code_used
  ON rep_referrals(upper(referral_code_used));

ALTER TABLE rep_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rep_referrals_referrer_read" ON rep_referrals
  FOR SELECT
  USING (referrer_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "rep_referrals_referred_read" ON rep_referrals
  FOR SELECT
  USING (referred_rep_id = (SELECT id FROM reps WHERE auth_user_id = auth.uid()));

CREATE POLICY "rep_referrals_admin_full_access" ON rep_referrals
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM reps
      WHERE auth_user_id = auth.uid()
      AND email = 'louis@neonrabbit.net'
    )
  );
