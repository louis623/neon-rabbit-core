const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const REFERRAL_CODE_PATTERN = /^SS-[A-HJ-NP-Z2-9]{6}$/

export function generateSparkleSuiteReferralCode(
  random: () => number = Math.random,
): string {
  let suffix = ''

  for (let index = 0; index < 6; index += 1) {
    const alphabetIndex = Math.min(
      Math.floor(random() * REFERRAL_ALPHABET.length),
      REFERRAL_ALPHABET.length - 1,
    )
    suffix += REFERRAL_ALPHABET[alphabetIndex]
  }

  return `SS-${suffix}`
}

export function normalizeSparkleSuiteReferralCode(input: string): string | null {
  const normalized = input.trim().toUpperCase()
  return REFERRAL_CODE_PATTERN.test(normalized) ? normalized : null
}
