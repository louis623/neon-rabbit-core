import { describe, expect, it } from 'vitest'

import { buildCameraScreeningDecision } from '@/lib/prelaunch/camera-screening'

describe('buildCameraScreeningDecision', () => {
  it('passes a clean sample photo to operator review', () => {
    expect(
      buildCameraScreeningDecision({
        hasLightboxSetup: true,
        previousFailedAttempts: 0,
        preflight: {
          passed: true,
          score: 100,
          issues: [],
          coachingMessages: [
            'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
          ],
        },
      }),
    ).toEqual({
      decision: 'sample_ready_for_operator_review',
      summary:
        'Sample photo clears first-pass quality checks and still needs human review before setup readiness.',
      operatorGuidance: [
        'Keep using the rep phone or existing camera first.',
        'Confirm the sample came from the rep real capture setup.',
        'Do not treat this as automated kit, shipment, or launch approval.',
      ],
      coachingMessages: [
        'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
      ],
      guardrails: [
        'No vendor selected.',
        'No webcam upsell.',
        'No kit order created.',
        'No shipment status changed.',
        'No price or fee collected.',
      ],
    })
  })

  it('returns coach_retry with existing coaching messages for quality issues', () => {
    const decision = buildCameraScreeningDecision({
      hasLightboxSetup: true,
      previousFailedAttempts: 0,
      preflight: {
        passed: false,
        score: 42,
        issues: [
          {
            code: 'blur_risk',
            severity: 'critical',
            message: 'The photo looks likely to be soft or blurry.',
          },
          {
            code: 'lighting_risk',
            severity: 'warning',
            message: 'The lighting may leave some shadows or dull highlights on the jewelry.',
          },
        ],
        coachingMessages: [
          'Steady the camera, tap to focus on the jewelry, and wait for the shot to settle before snapping.',
          'A little more even light will usually help the stones and metal read more cleanly.',
        ],
      },
    })

    expect(decision.decision).toBe('coach_retry')
    expect(decision.operatorGuidance).toContain(
      'Coach the rep on the quality issues before changing hardware.',
    )
    expect(decision.coachingMessages).toEqual([
      'Steady the camera, tap to focus on the jewelry, and wait for the shot to settle before snapping.',
      'A little more even light will usually help the stones and metal read more cleanly.',
    ])
  })

  it('returns missing_lightbox_setup as operator guidance only', () => {
    const decision = buildCameraScreeningDecision({
      hasLightboxSetup: false,
      previousFailedAttempts: 0,
      preflight: {
        passed: false,
        score: 58,
        issues: [
          {
            code: 'background_distraction',
            severity: 'critical',
            message: 'The background is too busy for a reliable cleanup pass.',
          },
        ],
        coachingMessages: [
          'Use a plain light background and clear away nearby props or packaging so the jewelry stands out.',
        ],
      },
    })

    expect(decision.decision).toBe('missing_lightbox_setup')
    expect(decision.operatorGuidance).toContain(
      'Confirm DUCLUS lightbox or equivalent white setup before asking for another sample.',
    )
    expect(JSON.stringify(decision)).not.toContain('Order kit')
    expect(JSON.stringify(decision)).not.toContain('Select vendor')
  })

  it('returns manual_exception after repeated failed samples without hardware upsell', () => {
    const decision = buildCameraScreeningDecision({
      hasLightboxSetup: true,
      previousFailedAttempts: 2,
      preflight: {
        passed: false,
        score: 48,
        issues: [
          {
            code: 'subject_framing',
            severity: 'critical',
            message: 'The jewelry is not framed clearly enough in the shot.',
          },
        ],
        coachingMessages: [
          'Center the jewelry and crop out extra background so the piece is the clear subject.',
        ],
      },
    })

    expect(decision.decision).toBe('manual_exception')
    expect(decision.operatorGuidance).toContain(
      'Escalate repeated sample-photo failures for manual review instead of recommending paid hardware.',
    )
    expect(decision.guardrails).toContain('No webcam upsell.')
    expect(JSON.stringify(decision)).not.toContain('Buy webcam')
    expect(JSON.stringify(decision)).not.toContain('paid add-on')
  })
})
