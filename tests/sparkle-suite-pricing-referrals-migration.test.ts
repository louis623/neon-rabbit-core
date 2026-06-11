import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260519154500_ss_pricing_referrals.sql',
)
const founderScheduleMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260519192500_ss_founder_schedule_tracking.sql',
)
const founderUniquenessMigrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260611133605_ss_founder_pricing_uniqueness.sql',
)

describe('Sparkle Suite pricing and referrals migration', () => {
  const sql = readFileSync(migrationPath, 'utf8')
  const founderScheduleSql = readFileSync(founderScheduleMigrationPath, 'utf8')
  const founderUniquenessSql = readFileSync(
    founderUniquenessMigrationPath,
    'utf8',
  )

  it('stores public referral and pricing assignment fields on reps', () => {
    expect(sql).toContain('ALTER TABLE reps')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS referral_code TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS pricing_tier TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS founder_sequence INTEGER')
    expect(sql).toContain('idx_reps_referral_code_unique')
  })

  it('tracks referral reward state in a dedicated table', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS rep_referrals')
    expect(sql).toContain('referrer_rep_id UUID NOT NULL REFERENCES reps(id)')
    expect(sql).toContain('referred_rep_id UUID REFERENCES reps(id)')
    expect(sql).toContain('reward_status TEXT NOT NULL DEFAULT')
    expect(sql).toContain('UNIQUE (referred_rep_id)')
  })

  it('snapshots Stripe checkout pricing metadata on subscriptions', () => {
    expect(sql).toContain('ALTER TABLE subscriptions')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS pricing_tier TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS build_fee_charged BOOLEAN')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS build_fee_price_id TEXT')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS monthly_price_id TEXT')
  })

  it('stores submitted referral codes from the public intake flow', () => {
    expect(sql).toContain('ALTER TABLE sparkle_suite_intake_submissions')
    expect(sql).toContain('ADD COLUMN IF NOT EXISTS referral_code TEXT')
    expect(sql).toContain('idx_sparkle_suite_intake_referral_code')
  })

  it('keeps referral codes separate from live queue sync code storage', () => {
    expect(sql).not.toContain('live_queue')
    expect(sql).not.toContain('sync_code')
  })

  it('tracks Stripe subscription schedules used for founder price step-up', () => {
    expect(founderScheduleSql).toContain('ALTER TABLE subscriptions')
    expect(founderScheduleSql).toContain(
      'ADD COLUMN IF NOT EXISTS stripe_subscription_schedule_id TEXT',
    )
    expect(founderScheduleSql).toContain('idx_subscriptions_stripe_schedule')
  })

  it('prevents duplicate founder pricing sequence assignments', () => {
    expect(founderUniquenessSql).toContain(
      'idx_reps_founder_sequence_unique',
    )
    expect(founderUniquenessSql).toContain(
      "WHERE pricing_tier = 'founder'",
    )
    expect(founderUniquenessSql).toContain(
      'idx_subscriptions_founder_sequence_unique',
    )
  })

  it('reserves founder pricing assignments atomically for checkout', () => {
    expect(founderUniquenessSql).toContain(
      'CREATE OR REPLACE FUNCTION public.assign_sparkle_suite_checkout_pricing',
    )
    expect(founderUniquenessSql).toContain(
      "pg_advisory_xact_lock(hashtext('sparkle_suite_founder_pricing'))",
    )
    expect(founderUniquenessSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.assign_sparkle_suite_checkout_pricing(UUID) TO service_role',
    )
    expect(founderUniquenessSql).toContain('generate_series(1, 20)')
    expect(founderUniquenessSql).toContain(
      'ORDER BY candidate_founder_sequence',
    )
    expect(founderUniquenessSql).toContain("NOTIFY pgrst, 'reload schema'")
  })

  it('does not permanently assign standard pricing before checkout is paid', () => {
    expect(founderUniquenessSql).toContain(
      "RETURN QUERY SELECT 'standard'::TEXT, NULL::INTEGER",
    )
    expect(founderUniquenessSql).not.toContain(
      "SET pricing_tier = 'standard'",
    )
  })

  it('releases unpaid founder checkout reservations safely', () => {
    expect(founderUniquenessSql).toContain(
      'CREATE OR REPLACE FUNCTION public.release_sparkle_suite_checkout_pricing',
    )
    expect(founderUniquenessSql).toContain(
      "pricing_tier = NULL",
    )
    expect(founderUniquenessSql).toContain(
      "founder_sequence = NULL",
    )
    expect(founderUniquenessSql).toContain(
      'GRANT EXECUTE ON FUNCTION public.release_sparkle_suite_checkout_pricing(UUID, INTEGER) TO service_role',
    )
  })
})
