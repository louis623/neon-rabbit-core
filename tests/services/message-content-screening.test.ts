import { describe, expect, it } from 'vitest'

import {
  SCREENING_BLOCK_REASON,
  getMessageScreeningResult,
} from '@/lib/services/message-content-screening'

describe('message content screening', () => {
  it('blocks a message with a prohibited FTC phrase', () => {
    const result = getMessageScreeningResult({
      channel: 'email',
      text: 'Join my team and build financial freedom with us.',
      isAutomated: false,
    })

    expect(result).toEqual({
      status: 'blocked',
      matchedPhrases: ['financial freedom'],
      reason: SCREENING_BLOCK_REASON,
    })
  })

  it('normalizes punctuation before matching prohibited phrases', () => {
    const result = getMessageScreeningResult({
      channel: 'sms',
      text: 'This business sells-itself once people see the jewelry.',
      isAutomated: false,
    })

    expect(result.status).toBe('blocked')
    expect(result.matchedPhrases).toContain('this business sells itself')
  })

  it('passes a normal customer follow-up message', () => {
    const result = getMessageScreeningResult({
      channel: 'sms',
      text: 'Your order is ready for pickup after tonight’s live.',
      isAutomated: false,
    })

    expect(result).toEqual({
      status: 'passed',
      matchedPhrases: [],
      reason: null,
    })
  })

  it('skips screening for automated messages', () => {
    const result = getMessageScreeningResult({
      channel: 'sms',
      text: 'financial freedom',
      isAutomated: true,
    })

    expect(result).toEqual({
      status: 'skipped',
      matchedPhrases: [],
      reason: null,
    })
  })
})
