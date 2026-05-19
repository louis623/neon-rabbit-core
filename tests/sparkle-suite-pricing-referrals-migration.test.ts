import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260519154500_ss_pricing_referrals.sql',
)

describe('Sparkle Suite pricing and referrals migration', () => {
  const sql = readFileSync(migrationPath, 'utf8')

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

  it('keeps referral codes separate from live queue sync code storage', () => {
    expect(sql).not.toContain('live_queue')
    expect(sql).not.toContain('sync_code')
  })
})
