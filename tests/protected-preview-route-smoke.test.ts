import { describe, expect, it } from 'vitest'

import {
  buildVercelCurlArgs,
  getNpxExecutable,
  parseJsonObject,
  validateStripeUrl,
} from '@/scripts/smoke-protected-preview-routes'

describe('protected preview route smoke helpers', () => {
  it('builds Vercel curl args with a temp curl config before method-specific flags', () => {
    expect(
      buildVercelCurlArgs({
        routePath: '/api/stripe/create-checkout',
        deployment: 'https://preview.example.vercel.app',
        curlConfigPath: '.local/curl.cfg',
        curlArgs: ['--request', 'POST'],
      }),
    ).toEqual([
      'vercel',
      'curl',
      '/api/stripe/create-checkout',
      '--deployment',
      'https://preview.example.vercel.app',
      '--',
      '--silent',
      '--show-error',
      '--location',
      '--config',
      '.local/curl.cfg',
      '--request',
      'POST',
    ])
  })

  it('uses the Windows npx command shim only on Windows', () => {
    expect(getNpxExecutable('win32')).toBe('npx.cmd')
    expect(getNpxExecutable('linux')).toBe('npx')
  })

  it('parses JSON object responses and rejects arrays', () => {
    expect(parseJsonObject('{"ok":true}', '/api/test')).toEqual({ ok: true })
    expect(() => parseJsonObject('[1]', '/api/test')).toThrow('/api/test')
  })

  it('validates expected Stripe hosted URLs without exposing full session URLs', () => {
    expect(
      validateStripeUrl({
        payload: { url: 'https://checkout.stripe.com/c/session/test_123' },
        host: 'checkout.stripe.com',
        routeLabel: 'checkout',
      }),
    ).toBe(true)

    expect(() =>
      validateStripeUrl({
        payload: { url: 'https://example.com/session/test_123' },
        host: 'checkout.stripe.com',
        routeLabel: 'checkout',
      }),
    ).toThrow('checkout')
  })
})
