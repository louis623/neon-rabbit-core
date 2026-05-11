import { describe, expect, it } from 'vitest'

import {
  SMS_CHARGE_MILS,
  stripeCentsToWalletMils,
  walletMilsToStripeCents,
  walletMilsToUsd,
} from '@/lib/services/wallet-units'

describe('wallet units', () => {
  it('represents the locked SMS charge exactly', () => {
    expect(SMS_CHARGE_MILS).toBe(9)
    expect(walletMilsToUsd(SMS_CHARGE_MILS)).toBe(0.009)
  })

  it('converts Stripe cents to wallet mils without losing precision', () => {
    expect(stripeCentsToWalletMils(2500)).toBe(25000)
    expect(walletMilsToUsd(stripeCentsToWalletMils(2500))).toBe(25)
  })

  it('converts wallet mils back to Stripe cents only when exact', () => {
    expect(walletMilsToStripeCents(25000)).toBe(2500)
    expect(() => walletMilsToStripeCents(24991)).toThrow(
      'Wallet mils must be divisible by 10 to convert to Stripe cents exactly',
    )
  })
})
