export const WALLET_MILS_PER_USD = 1000
export const WALLET_MILS_PER_STRIPE_CENT = 10
export const SMS_CHARGE_MILS = 9

function assertInteger(value: number, label: string) {
  if (!Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`)
  }
}

export function stripeCentsToWalletMils(cents: number) {
  assertInteger(cents, 'Stripe cents')
  return cents * WALLET_MILS_PER_STRIPE_CENT
}

export function walletMilsToStripeCents(mils: number) {
  assertInteger(mils, 'Wallet mils')
  if (mils % WALLET_MILS_PER_STRIPE_CENT !== 0) {
    throw new Error('Wallet mils must be divisible by 10 to convert to Stripe cents exactly')
  }
  return mils / WALLET_MILS_PER_STRIPE_CENT
}

export function walletMilsToUsd(mils: number) {
  assertInteger(mils, 'Wallet mils')
  return mils / WALLET_MILS_PER_USD
}
