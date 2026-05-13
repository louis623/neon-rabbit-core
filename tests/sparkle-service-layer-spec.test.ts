import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('Sparkle Suite service layer spec', () => {
  const serviceSpec = read(
    'docs/drive-import/sparkle-suite/specs/SS_Service_Layer_Spec_v1_2.md',
  )
  const masterPlan = read(
    'docs/drive-import/sparkle-suite/plans/SS_Master_Build_Plan_v3_3.md',
  )

  it('documents the SMS wallet RPC contracts in mils', () => {
    expect(serviceSpec).toContain('File: `lib/services/wallet.ts`')
    expect(serviceSpec).toContain(
      'deduct_wallet_balance(p_wallet_id UUID, p_amount INTEGER)',
    )
    expect(serviceSpec).toContain(
      'RETURNS TABLE(new_balance_mils INTEGER, should_recharge BOOLEAN, attempt_id UUID)',
    )
    expect(serviceSpec).toContain(
      'credit_wallet(p_wallet_id UUID, p_rep_id UUID, p_amount INTEGER, p_type wallet_transaction_type, p_stripe_pi TEXT, p_stripe_fee INTEGER, p_description TEXT, p_attempt_id UUID)',
    )
    expect(serviceSpec).toContain(
      'RETURNS TABLE(new_balance_mils INTEGER, credited BOOLEAN)',
    )
    expect(serviceSpec).toContain(
      'release_wallet_recharge_lock(p_wallet_id UUID, p_attempt_id UUID)',
    )
    expect(serviceSpec).toContain('SMS_CHARGE_MILS')
    expect(serviceSpec).toContain('service_role only')
    expect(serviceSpec).not.toMatch(/new_balance_cents|balance_cents|amount_cents/)
  })

  it('does not leave the active master plan saying wallet RPCs are TBD', () => {
    expect(masterPlan).not.toContain('wallet RPCs TBD')
    expect(masterPlan).toContain('3 trade-board RPCs plus 3 SMS wallet RPCs')
  })
})
