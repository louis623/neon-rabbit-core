import { describe, expect, it } from 'vitest'

import { orderResolvedAttachments } from '@/lib/nic-nac/client-attachments'

describe('Nic-Nac client attachment ordering', () => {
  it('preserves the rep selected image order even when compression finishes out of order', () => {
    const ordered = orderResolvedAttachments([
      {
        index: 1,
        attachment: {
          id: 'jewelry-photo',
          dataUrl: 'data:image/jpeg;base64,SkVXRUw=',
          mediaType: 'image/jpeg',
          width: 1800,
          height: 1800,
          blurRisk: 0.04,
          lightingRisk: 0.04,
          subjectCoverage: 0.35,
          subjectCentered: true,
        },
      },
      {
        index: 0,
        attachment: {
          id: 'label-photo',
          dataUrl: 'data:image/jpeg;base64,TEFCRUw=',
          mediaType: 'image/jpeg',
          width: 1800,
          height: 1800,
          blurRisk: 0.04,
          lightingRisk: 0.04,
          subjectCoverage: 0.35,
          subjectCentered: true,
        },
      },
      null,
    ])

    expect(ordered.map((attachment) => attachment.id)).toEqual([
      'label-photo',
      'jewelry-photo',
    ])
  })
})
