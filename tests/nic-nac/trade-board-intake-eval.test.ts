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

  it('detects calendar write abdication from the add-show regression', () => {
    const result = detectTradeBoardIntakeHardFails(
      "I can't actually write to the calendar from this turn, but those are the exact details to enter.",
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'cannot_write_calendar',
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

  it('detects duplicate physical listing refusal language', () => {
    const result = detectTradeBoardIntakeHardFails(
      "That item number is already on your board, so I can't add it again as a duplicate listing.",
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'duplicate_physical_listing_refusal',
    ])
  })

  it('detects manual backend workaround and box/card retake language from the ER13229 regression', () => {
    const result = detectTradeBoardIntakeHardFails(
      "The system's flagging the image resolution on its end. If you want to move forward, I can escalate this to Louis and have him add it manually on the backend, or you can try one more shot without the box or card on a plain surface.",
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'manual_backend_add',
      'without_box_or_card',
      'plain_surface',
      'escalate_to_louis',
    ])
  })

  it('detects photo URL and cloud-link workaround language from tool failures', () => {
    const result = detectTradeBoardIntakeHardFails(
      'Do you have a direct link to the photo or a cloud link? The system needs a photo URL for this one, so I can escalate this to Louis if needed.',
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'direct_photo_link',
      'cloud_photo_link',
      'photo_url_request',
      'escalate_to_louis',
    ])
  })

  it('detects backend preflight abdication language from accepted photo failures', () => {
    const result = detectTradeBoardIntakeHardFails(
      "Got it - the system's rejecting the photo at the preflight stage. This is a backend validation that's not under my control, and it's blocking the add. Let me flag this for Louis so he can look at the photo quality settings. In the meantime, do you want to try a tighter crop or higher resolution, or should I escalate this to the team?",
    )

    expect(result.matches.map((m) => m.id)).toEqual([
      'backend_preflight_rejection',
      'backend_not_under_control',
      'flag_to_louis',
      'photo_quality_settings',
      'escalate_to_team',
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
