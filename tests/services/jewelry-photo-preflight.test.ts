import { describe, expect, it } from 'vitest'

import { assessJewelryPhotoPreflight } from '@/lib/services'

describe('assessJewelryPhotoPreflight', () => {
  it('passes a photo that clears all first-pass quality checks', () => {
    const result = assessJewelryPhotoPreflight({
      width: 2000,
      height: 2000,
      blurRisk: 0.12,
      lightingRisk: 0.18,
      subjectCoverage: 0.42,
      subjectCentered: true,
    })

    expect(result).toEqual({
      passed: true,
      score: 100,
      issues: [],
      coachingMessages: [
        'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
      ],
    })
  })

  it('fails with actionable coaching when several obvious quality issues stack up', () => {
    const result = assessJewelryPhotoPreflight({
      width: 640,
      height: 640,
      blurRisk: 0.82,
      lightingRisk: 0.78,
      subjectCoverage: 0.08,
      subjectCentered: false,
    })

    expect(result.passed).toBe(false)
    expect(result.score).toBe(0)
    expect(result.issues).toEqual([
      {
        code: 'low_resolution',
        severity: 'critical',
        message: 'The photo is too small to preserve jewelry detail cleanly.',
      },
      {
        code: 'blur_risk',
        severity: 'critical',
        message: 'The photo looks likely to be soft or blurry.',
      },
      {
        code: 'lighting_risk',
        severity: 'critical',
        message: 'The lighting looks too uneven or dim for a reliable cleanup pass.',
      },
      {
        code: 'subject_framing',
        severity: 'critical',
        message: 'The jewelry is not framed clearly enough in the shot.',
      },
    ])
    expect(result.coachingMessages).toEqual([
      'Try retaking it at a higher resolution or move closer so the jewelry fills more of the frame.',
      'Steady the camera, tap to focus on the jewelry, and wait for the shot to settle before snapping.',
      'Add softer front light or rotate the piece to reduce harsh shadows and dark spots.',
      'Center the jewelry and crop out extra background so the piece is the clear subject.',
    ])
  })

  it('keeps a borderline framing issue as a warning when the rest of the photo is usable', () => {
    const result = assessJewelryPhotoPreflight({
      width: 1800,
      height: 1800,
      blurRisk: 0.2,
      lightingRisk: 0.18,
      subjectCoverage: 0.34,
      subjectCentered: false,
    })

    expect(result).toEqual({
      passed: true,
      score: 90,
      issues: [
        {
          code: 'subject_framing',
          severity: 'warning',
          message: 'The jewelry could be centered a little more clearly in the frame.',
        },
      ],
      coachingMessages: [
        'This should be workable, but centering the jewelry a bit more will usually give a cleaner result.',
      ],
    })
  })
})
