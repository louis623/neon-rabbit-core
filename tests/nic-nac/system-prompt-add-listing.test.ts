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

  it('starts guided trade-board intake with item number lookup before photos', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'When the rep starts "Add a piece to Trade Board", ask for the item number first',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'search_jewelry_database before asking for photos',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If the item exists, confirm the match before add_listing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If the item is missing, ask for the label/details photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'The collection may be on packaging instead of the label',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'For rings, the ring size is usually on the box rather than the label',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'ask for the ring size before add_listing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Ask for collection or a packaging photo if it is not visible',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Ask for the jewelry-front photo only after catalog details are confirmed',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'After collection is supplied, do not call add_listing until the jewelry-front photo is uploaded',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not use label/details or back-of-card photos as the final jewelry-front photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'boxed display photos for earrings, rings, necklaces, and similar pieces are acceptable when the jewelry is clear',
    )
  })

  it('treats missing collection as an ask-and-retry recovery path', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('ask for the exact collection name')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('retry with collectionName')
    expect(NIC_NAC_SYSTEM_PROMPT).not.toContain(
      'NEEDS_COLLECTION as a hard limitation',
    )
  })

  it('treats duplicate item numbers as separate physical listings', () => {
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'A rep can own multiple physical pieces with the same item number',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'create one listing per physical piece',
    )
  })
})
