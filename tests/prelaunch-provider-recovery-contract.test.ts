import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROVIDER_RECOVERY_CONTRACTS } from '@/lib/prelaunch/provider-recovery-contract'

function read(relativePath: string): string {
  return readFileSync(resolve(process.cwd(), relativePath), 'utf8')
}

describe('provider-free recovery contracts', () => {
  it('tracks every offline recovery path needed before manual Phase 11.8 acceptance', () => {
    expect(PROVIDER_RECOVERY_CONTRACTS.map((contract) => contract.id).sort()).toEqual([
      'audit.write-isolated',
      'payment-gates.checkout-disabled',
      'payment-gates.price-not-configured',
      'photoroom.provider-failed',
      'signwell.not-configured',
      'signwell.send-disabled',
      'sms.not-configured',
      'sms.telnyx-reject-refund',
    ])
  })

  it('keeps every recovery contract backed by a focused offline test', () => {
    for (const contract of PROVIDER_RECOVERY_CONTRACTS) {
      const testSource = read(contract.testFile)

      expect(testSource).toContain(contract.expectedCode)
      expect(testSource).toContain(contract.sourceLabel)
      expect(contract.liveProviderRequired).toBe(false)
    }
  })

  it('does not mark parked live-provider work as safe for automation', () => {
    expect(
      PROVIDER_RECOVERY_CONTRACTS.filter(
        (contract) => contract.liveProviderRequired,
      ),
    ).toEqual([])
  })
})
