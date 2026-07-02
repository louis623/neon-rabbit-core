import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { runReferralSystemPressure } from '@/scripts/pressure-referral-system'

describe('Sparkle Suite referral pressure check', () => {
  it('exposes a repeatable referral pressure command', () => {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts?: Record<string, string>
    }

    expect(packageJson.scripts?.['pressure:referral-system']).toBe(
      'tsx scripts/pressure-referral-system.ts',
    )
  })

  it('credits the referrer after three paid months without double-counting invoices', async () => {
    const result = await runReferralSystemPressure()

    expect(result).toMatchObject({
      ok: true,
      referralId: 'referral-1',
      paidMonths: 3,
      creditsIssued: 1,
      duplicateInvoiceStatus: 'invoice_already_counted',
      selfReferralBlocked: true,
    })
    expect(result.summary).toContain('paid_months=3')
    expect(result.summary).toContain('credits=1')
  })
})
