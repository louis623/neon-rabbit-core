import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

export interface PhotographyKitPrepItem {
  label: string
  detail: string
  status: 'required' | 'review'
}

export interface PhotographyKitPrepSummary {
  status: 'sample_photo_needed'
  items: PhotographyKitPrepItem[]
  guardrails: string[]
}

export function buildPhotographyKitPrep(
  submission: PrelaunchIntakeReviewSubmission,
): PhotographyKitPrepSummary {
  const items: PhotographyKitPrepItem[] = [
    {
      label: 'Baseline setup',
      detail: 'DUCLUS lightbox or equivalent white setup; white background required.',
      status: 'required',
    },
    {
      label: 'Rep device first',
      detail:
        'Use the rep phone or existing camera first; webcam standardization is skipped for now.',
      status: 'review',
    },
    {
      label: 'Request sample jewelry photo',
      detail:
        'Ask for one or more sample jewelry photos from the rep real setup before making a kit decision.',
      status: 'required',
    },
    {
      label: 'Run Nic-Nac screening',
      detail:
        'Screen sample photos for blur, lighting, framing, and white-background quality.',
      status: 'required',
    },
    {
      label: 'Coach before hardware changes',
      detail:
        'Coach framing, distance, lighting, and white background before changing hardware.',
      status: 'review',
    },
    {
      label: 'Manual exception',
      detail:
        'Repeated sample-photo failures become manual exceptions, not automatic hardware upsells.',
      status: 'review',
    },
  ]

  if (submission.fitFlags.includes('phone_only_setup')) {
    items.push({
      label: 'Phone-only workflow check',
      detail:
        'Confirm the rep can handle live selling and jewelry photo capture without a second device.',
      status: 'review',
    })
  }

  if (
    submission.deviceSetup === 'not_sure' ||
    submission.fitFlags.includes('device_setup_unknown')
  ) {
    items.push({
      label: 'Confirm capture device',
      detail:
        'Ask what phone, camera, or computer the rep will use for jewelry photos.',
      status: 'review',
    })
  }

  return {
    status: 'sample_photo_needed',
    items,
    guardrails: [
      'No kit order triggered.',
      'No vendor selected.',
      'No price shown.',
      'No shipment status changed.',
      'No webcam upsell.',
    ],
  }
}
