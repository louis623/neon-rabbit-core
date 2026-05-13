import { describe, expect, it } from 'vitest'

import { THUMPER_SYSTEM_PROMPT } from '@/lib/thumper/system-prompt'

describe('Thumper system prompt — add listing flow', () => {
  it('supports batch add instead of framing add_listing as single-only', () => {
    expect(THUMPER_SYSTEM_PROMPT).not.toContain('Single add only — no batch.')
    expect(THUMPER_SYSTEM_PROMPT).toContain('single + batch')
  })

  it('describes the three add-a-piece entry paths and batch sorting behavior', () => {
    expect(THUMPER_SYSTEM_PROMPT).toContain('item number')
    expect(THUMPER_SYSTEM_PROMPT).toContain('label photo')
    expect(THUMPER_SYSTEM_PROMPT).toContain('Batch mode')
    expect(THUMPER_SYSTEM_PROMPT).toContain('ready')
    expect(THUMPER_SYSTEM_PROMPT).toContain('needCollection')
    expect(THUMPER_SYSTEM_PROMPT).toContain('needFullInfo')
  })

  it('treats missing collection as an ask-and-retry recovery path', () => {
    expect(THUMPER_SYSTEM_PROMPT).toContain('ask for the exact collection name')
    expect(THUMPER_SYSTEM_PROMPT).toContain('retry with collectionName')
    expect(THUMPER_SYSTEM_PROMPT).not.toContain(
      'NEEDS_COLLECTION as a hard limitation',
    )
  })
})
