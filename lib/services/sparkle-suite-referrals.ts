const REFERRAL_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const REFERRAL_CODE_PATTERN = /^SS-[A-HJ-NP-Z2-9]{6}$/
const REFERRAL_CODE_RETRY_LIMIT = 12

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

type ReferralCodeLookupClient = {
  from(table: string): unknown
}

type ReferralCodeLookupQuery = {
  select(columns: string): {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{
        data: { id: string } | null
        error: unknown
      }>
    }
  }
}

export async function generateUniqueSparkleSuiteReferralCode(
  supabase: ReferralCodeLookupClient,
  random: () => number = Math.random,
): Promise<string> {
  for (let attempt = 0; attempt < REFERRAL_CODE_RETRY_LIMIT; attempt += 1) {
    const candidate = generateSparkleSuiteReferralCode(random)
    const { data, error } = await (supabase.from('reps') as ReferralCodeLookupQuery)
      .select('id')
      .eq('referral_code', candidate)
      .maybeSingle()

    if (error) throw error
    if (!data) return candidate
  }

  throw new Error('Unable to generate a unique Sparkle Suite referral code.')
}
