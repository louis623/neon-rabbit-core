import { createHash } from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  assertQuestionText,
  getBearerToken,
  hashInviteToken,
} from '@/lib/team-onboarding/access'

describe('team onboarding access helpers', () => {
  it('hashInviteToken returns a sha256 hex digest', () => {
    expect(hashInviteToken('invite-token-1')).toBe(
      createHash('sha256').update('invite-token-1').digest('hex'),
    )
  })

  it('getBearerToken accepts Bearer authorization case-insensitively', () => {
    expect(getBearerToken('Bearer abc123')).toBe('abc123')
    expect(getBearerToken('bearer xyz789')).toBe('xyz789')
    expect(getBearerToken('BEARER mixed-case')).toBe('mixed-case')
  })

  it('getBearerToken returns null for missing or non-bearer headers', () => {
    expect(getBearerToken(null)).toBeNull()
    expect(getBearerToken('Basic abc123')).toBeNull()
    expect(getBearerToken('Bearer')).toBeNull()
    expect(getBearerToken('Bearer    ')).toBeNull()
    expect(getBearerToken('Bearer abc123 extra')).toBeNull()
  })

  it('assertQuestionText trims valid string input', () => {
    expect(assertQuestionText('  Where should I start?  ')).toBe(
      'Where should I start?',
    )
  })

  it('assertQuestionText requires a string', () => {
    expect(() => assertQuestionText(null)).toThrow('Question text is required.')
    expect(() => assertQuestionText({})).toThrow('Question text is required.')
  })

  it('assertQuestionText rejects text under 3 characters', () => {
    expect(() => assertQuestionText('  hi  ')).toThrow(
      'Question text must be at least 3 characters.',
    )
  })

  it('assertQuestionText rejects text over 1000 characters', () => {
    expect(() => assertQuestionText('a'.repeat(1001))).toThrow(
      'Question text must be 1000 characters or fewer.',
    )
  })
})
