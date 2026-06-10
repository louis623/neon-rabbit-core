import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const migrationPath = path.join(
  process.cwd(),
  'supabase/migrations/20260610124952_ss_referral_paid_months.sql',
)

describe('Sparkle Suite referral paid-month ledger migration', () => {
  const sql = readFileSync(migrationPath, 'utf8')

  it('creates an invoice ledger for referral paid service months', () => {
    expect(sql).toContain('CREATE TABLE IF NOT EXISTS public.rep_referral_paid_months')
    expect(sql).toContain('referral_id UUID NOT NULL REFERENCES public.rep_referrals(id)')
    expect(sql).toContain('referred_rep_id UUID NOT NULL REFERENCES public.reps(id)')
    expect(sql).toContain('stripe_invoice_id TEXT NOT NULL UNIQUE')
    expect(sql).toContain('amount_paid_cents INTEGER NOT NULL')
  })

  it('keeps RLS enabled and policies idempotent for dashboard application', () => {
    expect(sql).toContain('ALTER TABLE public.rep_referral_paid_months ENABLE ROW LEVEL SECURITY')
    expect(sql).toContain("policyname = 'rep_referral_paid_months_referrer_read'")
    expect(sql).toContain("policyname = 'rep_referral_paid_months_referred_read'")
    expect(sql).toContain("policyname = 'rep_referral_paid_months_admin_full_access'")
  })
})
