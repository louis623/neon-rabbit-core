import { afterEach, describe, expect, it, vi } from 'vitest'

const originalApiKey = process.env.RESEND_API_KEY
const originalFromEmail = process.env.RESEND_FROM_EMAIL
const originalNodeEnv = process.env.NODE_ENV
const originalNextPhase = process.env.NEXT_PHASE

function setTestEnv(name: string, value: string | undefined) {
  if (value === undefined) {
    delete process.env[name]
    return
  }

  process.env[name] = value
}

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
  setTestEnv('RESEND_API_KEY', originalApiKey)
  setTestEnv('RESEND_FROM_EMAIL', originalFromEmail)
  setTestEnv('NODE_ENV', originalNodeEnv)
  setTestEnv('NEXT_PHASE', originalNextPhase)
})

describe('resend config', () => {
  it('accepts a display-name sender value', async () => {
    setTestEnv('RESEND_API_KEY', 're_test_key')
    setTestEnv(
      'RESEND_FROM_EMAIL',
      'Sparkle Suite <hello@yoursparklesuite.com>',
    )
    setTestEnv('NODE_ENV', 'production')
    setTestEnv('NEXT_PHASE', undefined)

    const { getResendConfig, isResendEnabled } = await import('@/lib/resend/config')

    expect(isResendEnabled()).toBe(true)
    expect(getResendConfig()).toEqual({
      RESEND_API_KEY: 're_test_key',
      RESEND_FROM_EMAIL: 'Sparkle Suite <hello@yoursparklesuite.com>',
    })
  })

  it('disables resend gracefully when production config is missing', async () => {
    setTestEnv('RESEND_API_KEY', undefined)
    setTestEnv('RESEND_FROM_EMAIL', undefined)
    setTestEnv('NODE_ENV', 'production')
    setTestEnv('NEXT_PHASE', undefined)

    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined)

    const { getResendConfig, isResendEnabled } = await import('@/lib/resend/config')

    expect(isResendEnabled()).toBe(false)
    expect(getResendConfig()).toBeNull()
    expect(consoleError).toHaveBeenCalledWith(
      '[resend] Missing required environment variables in production:',
      expect.any(Object),
    )
  })
})
