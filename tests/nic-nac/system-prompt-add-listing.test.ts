import { describe, expect, it } from 'vitest'

import { NIC_NAC_SYSTEM_PROMPT } from '@/lib/nic-nac/system-prompt'

describe('Nic-Nac system prompt — add listing flow', () => {
  it('supports batch add instead of framing add_listing as single-only', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain('Single add only — no batch.')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('single + batch')
  })

  it('describes the three add-a-piece entry paths and batch sorting behavior', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('item number')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('label photo')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Batch mode')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('ready')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('needCollection')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('needFullInfo')
  })

  it('treats missing collection as an ask-and-retry recovery path', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('ask for the exact collection name')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('retry with collectionName')
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain(
      'NEEDS_COLLECTION as a hard limitation',
    )
  })
})
