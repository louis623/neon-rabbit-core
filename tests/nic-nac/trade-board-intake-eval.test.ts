import { describe, expect, it } from 'vitest'
import {
  detectTradeBoardIntakeHardFails,
  summarizeHardFailDetection,
} from '@/lib/nic-nac/workflows/trade-board-intake-eval'

describe('Trade Board intake hard-fail detection', () => {
  it('detects manual workaround and unavailable-tool language', () => {
    const text =
      "I can't actually add listings from chat. Log into your workspace and add it manually."
    const result = detectTradeBoardIntakeHardFails(text)

    expect(result.count).toBe(2)
    expect(result.matches.map((m) => m.id)).toEqual([
      'cannot_add_listings',
      'manual_workspace_add',
    ])
  })

  it('detects label-photo jewelry critique language', () => {
    const result = detectTradeBoardIntakeHardFails(
      'The photo of the earrings needs a closer retake.',
    )

    expect(result.matches.map((m) => m.id)).toContain(
      'earrings_photo_needs_after_label',
    )
  })

  it('detects forbidden boxed-display retake language', () => {
    const result = detectTradeBoardIntakeHardFails(
      'Please take an unboxed photo on a plain background because the packaging is too prominent.',
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'unboxed',
      'plain_background',
      'packaging_too_prominent',
    ])
  })

  it('summarizes a clean transcript', () => {
    const result = summarizeHardFailDetection([
      'Got it. That first image is just the label/details source.',
      'I still need the customer-facing photo of the earrings.',
    ])

    expect(result.count).toBe(0)
    expect(result.phrases).toEqual([])
  })
})
