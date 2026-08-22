import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('login trial activation wiring', () => {
  it('starts a pending trial only after successful password sign-in and fails closed', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/login/_client.tsx'),
      'utf8',
    )
    const signInIndex = source.indexOf('supabase.auth.signInWithPassword')
    const activationIndex = source.indexOf(
      "fetch('/api/account/activate-trial'",
    )

    expect(signInIndex).toBeGreaterThan(-1)
    expect(activationIndex).toBeGreaterThan(signInIndex)
    expect(source).toContain('if (!trialResponse.ok)')
    expect(source).toContain('await supabase.auth.signOut()')
    expect(source).toContain("payload?.error === 'account_not_found'")
    expect(source).toContain('No Sparkle Suite account is associated with this email.')
  })
})
