import { describe, expect, it } from 'vitest'
import { errors } from '@/lib/services/errors'

describe('service error copy', () => {
  it('keeps missing-design guidance readable for Nic-Nac', () => {
    const err = errors.NEEDS_FULL_INFO('RBP4358')

    expect(err.userMessage).toBe(
      "I don't have RBP4358 on file yet - I'll need the design name and a photo.",
    )
    expect(err.userMessage).not.toMatch(/[Ãâ�]/)
  })

  it('keeps shared service error messages free of mojibake punctuation', () => {
    const messages = [
      errors.INVALID_STATUS_TRANSITION('active', 'restore').message,
      errors.AMBIGUOUS_CUSTOMER('Jane Doe').userMessage,
      errors.EVENT_NOT_EDITABLE().userMessage,
      errors.EVENT_TIME_PAST().userMessage,
      errors.MISSING_PLATFORM().userMessage,
    ]

    for (const message of messages) {
      expect(message).not.toMatch(/[Ãâ�]/)
    }
  })
})
