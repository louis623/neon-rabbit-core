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
      'When the rep starts "Add a piece to Trade Board", offer two ways to start',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('type the item number')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'upload a clear item-info tag or label photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Order does not matter')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Use photos and facts in whatever order the rep provides them',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If the item exists, confirm the match before add_listing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If missing, ask for whichever single input is actually missing or unusable',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Two quality checks only')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('readable item details')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('website-worthy jewelry image')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('Accept clear rep-provided collection')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'For rings, the ring size is usually on the box rather than the label',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'ask for the ring size before add_listing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not require packaging proof after the rep gives the collection',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Birthday collection names must include the year',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain('July Birthday 2026')
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Boxed display photos for earrings, rings, necklaces, and similar pieces are acceptable when the jewelry is centered, close, and clear',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Rejecting or demanding a retake is a last resort',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not critique a label/details photo as if it is a bad jewelry photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If the only uploaded image is a label/details or back-of-card photo, say you still need the first customer-facing jewelry photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'A label/details photo is only a label/details photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Visible jewelry in that label/details photo does not satisfy the jewelry photo requirement',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not say "the photo of the earrings needs" unless the rep actually uploaded a dedicated jewelry photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not call a label/details photo a boxed display photo',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'After a label/details photo, ask for the separate customer-facing jewelry photo without critiquing label-photo distance or framing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Do not ask for unboxed, no-packaging, or plain-background retakes',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If enough usable inputs already exist in recent conversation photos or chat text, call add_listing',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Use recent add-flow photos, not just the latest message',
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
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'If search_jewelry_database says isOnMyBoard:true during an add flow',
    )
    expect(NIC_NAC_SYSTEM_PROMPT).toContain(
      'Are we adding a second physical piece of that same design?',
    )
  })
})
