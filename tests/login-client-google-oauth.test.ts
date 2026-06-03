import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { safeRelativeRedirectPath } from '@/lib/auth/safe-redirect'

describe('login Google OAuth source', () => {
  it('keeps Google sign-in wired through the auth callback route', () => {
    const source = readFileSync('app/login/_client.tsx', 'utf8')

    expect(source).toContain('signInWithOAuth')
    expect(source).toContain("provider: 'google'")
    expect(source).toContain('/api/auth/callback')
  })

  it('uses the shared safe relative redirect helper before replacing routes', () => {
    const source = readFileSync('app/login/_client.tsx', 'utf8')

    expect(source).toContain('safeRelativeRedirectPath')
    expect(safeRelativeRedirectPath('/nic-nac?section=account')).toBe(
      '/nic-nac?section=account',
    )
    expect(safeRelativeRedirectPath('https://evil.example/path')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath('//evil.example/path')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath('/\\\\evil.example/path')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath('/\\evil.example/path')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath('/%5c%5cevil.example')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath('javascript:alert(1)')).toBe('/nic-nac')
    expect(safeRelativeRedirectPath(null)).toBe('/nic-nac')
  })
})
