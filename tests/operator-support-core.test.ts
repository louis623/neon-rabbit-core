import { describe, expect, it } from 'vitest'

import {
  DEFAULT_OPERATOR_SUPPORT_CAPABILITIES,
  hasSupportCapability,
  normalizeSupportCapabilities,
} from '@/lib/operator-support/capabilities'
import { normalizeOperatorSupportMutationRequestId } from '@/lib/operator-support/mutation-guard'
import {
  buildOperatorSupportSafeDiff,
  operatorSupportRedactedMarker,
  redactOperatorSupportSafeDiff,
} from '@/lib/operator-support/redaction'
import {
  createOperatorSupportCsrfToken,
  hashOperatorSupportCsrfToken,
  verifyOperatorSupportCsrfToken,
} from '@/lib/operator-support/session-service'

describe('operator support core security contracts', () => {
  it('normalizes only known, unique, deny-by-default capabilities', () => {
    expect(normalizeSupportCapabilities(['site.view', 'site.view', 'site.manage']))
      .toEqual(['site.view', 'site.manage'])
    expect(hasSupportCapability(DEFAULT_OPERATOR_SUPPORT_CAPABILITIES, 'site.manage')).toBe(true)
    expect(() => normalizeSupportCapabilities([])).toThrow('capabilities are invalid')
    expect(() => normalizeSupportCapabilities(['billing.manage'])).toThrow('capabilities are invalid')
  })

  it('redacts credentials, provider data, and customer PII while preserving safe changes', () => {
    expect(redactOperatorSupportSafeDiff({
      changedFields: ['bannerText', 'customerEmail', 'stripeCustomerId'],
      before: {
        bannerText: 'Old banner',
        customerEmail: 'customer@example.test',
        stripeCustomerId: 'cus_secret',
        nested: { liveQueueCode: 'never-log-this' },
      },
      after: { bannerText: 'New banner', customerEmail: 'new@example.test' },
    })).toEqual({
      changedFields: ['bannerText', 'customerEmail', 'stripeCustomerId'],
      before: {
        bannerText: 'Old banner',
        customerEmail: operatorSupportRedactedMarker,
        stripeCustomerId: operatorSupportRedactedMarker,
        nested: { liveQueueCode: operatorSupportRedactedMarker },
      },
      after: { bannerText: 'New banner', customerEmail: operatorSupportRedactedMarker },
    })
  })

  it('builds bounded safe diffs and never accepts an unrestricted primitive body', () => {
    expect(buildOperatorSupportSafeDiff({
      changedFields: ['appearancePreset', 'appearancePreset'],
      before: { appearancePreset: 'morganite' },
      after: { appearancePreset: 'alpine_opal' },
    })).toEqual({
      changedFields: ['appearancePreset'],
      before: { appearancePreset: 'morganite' },
      after: { appearancePreset: 'alpine_opal' },
    })
    expect(redactOperatorSupportSafeDiff('raw request body')).toEqual({})
    const oversized = Object.fromEntries(
      Array.from({ length: 100 }, (_, index) => [`field${index}`, 'x'.repeat(1_000)]),
    )
    const bounded = redactOperatorSupportSafeDiff(oversized)
    expect(JSON.stringify(bounded).length).toBeLessThan(16_384)
    expect(Object.keys(bounded).length).toBeLessThanOrEqual(50)
  })

  it('stores only a hash and compares CSRF values safely', () => {
    const token = createOperatorSupportCsrfToken()
    const hash = hashOperatorSupportCsrfToken(token)
    expect(token).not.toBe(hash)
    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(verifyOperatorSupportCsrfToken(token, hash)).toBe(true)
    expect(verifyOperatorSupportCsrfToken(`${token}x`, hash)).toBe(false)
    expect(verifyOperatorSupportCsrfToken(token, 'invalid')).toBe(false)
  })

  it('accepts bounded opaque mutation IDs and rejects unsafe or empty values', () => {
    expect(
      normalizeOperatorSupportMutationRequestId(
        '  11111111-1111-4111-8111-111111111111  ',
      ),
    ).toBe('11111111-1111-4111-8111-111111111111')
    expect(normalizeOperatorSupportMutationRequestId('short')).toBeNull()
    expect(normalizeOperatorSupportMutationRequestId('request id with spaces')).toBeNull()
    expect(normalizeOperatorSupportMutationRequestId('x'.repeat(201))).toBeNull()
  })
})
