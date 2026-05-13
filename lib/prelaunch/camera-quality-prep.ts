import type { PrelaunchIntakeReviewSubmission } from '@/lib/prelaunch/intake-review'

export interface CameraQualityPrepItem {
  label: string
  detail: string
  status: 'required' | 'review'
}

export interface CameraQualityPrepSummary {
  status: 'sample_photo_required'
  items: CameraQualityPrepItem[]
  guardrails: string[]
}

export function buildCameraQualityPrep(
  submission: PrelaunchIntakeReviewSubmission,
): CameraQualityPrepSummary {
  const items: CameraQualityPrepItem[] = [
    {
      label: 'Sample photo screening',
      detail:
        'Sample photo still needs Nic-Nac screening for blur, lighting, framing, and white-background quality.',
      status: 'required',
    },
    {
      label: 'Current setup context',
      detail: `Review current setup: ${submission.currentSetup}. Setup goal: ${submission.setupGoal}.`,
      status: 'review',
    },
    {
      label: 'Do not treat this as kit approval',
      detail:
        'Passing intake fit does not approve hardware, shipping, pricing, or fulfillment.',
      status: 'review',
    },
  ]

  if (submission.fitFlags.includes('phone_only_setup')) {
    items.push({
      label: 'Confirm two-device workflow',
      detail:
        'Phone-only setup needs operator review so live selling and jewelry photo capture do not compete for the same device.',
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
        'Ask what phone, camera, or computer will capture sample jewelry photos before treating setup as ready.',
      status: 'review',
    })
  }

  return {
    status: 'sample_photo_required',
    items,
    guardrails: [
      'No SMS or handset workflow is triggered.',
      'No camera, lightbox, or kit order is created.',
      'No shipment is approved.',
      'No fee or price is collected.',
      'No sample photo result bypasses human review.',
    ],
  }
}
