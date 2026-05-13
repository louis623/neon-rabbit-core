import type {
  JewelryPhotoIssueCode,
  JewelryPhotoPreflightResult,
} from '@/lib/services/jewelry-photo-preflight'

export type CameraScreeningDecision =
  | 'sample_ready_for_operator_review'
  | 'coach_retry'
  | 'missing_lightbox_setup'
  | 'manual_exception'

export interface CameraScreeningDecisionInput {
  hasLightboxSetup: boolean
  previousFailedAttempts: number
  preflight: JewelryPhotoPreflightResult
}

export interface CameraScreeningDecisionResult {
  decision: CameraScreeningDecision
  summary: string
  operatorGuidance: string[]
  coachingMessages: string[]
  guardrails: string[]
}

const GUARDRAILS = [
  'No vendor selected.',
  'No webcam upsell.',
  'No kit order created.',
  'No shipment status changed.',
  'No price or fee collected.',
]

const LIGHTBOX_RELATED_ISSUES = new Set<JewelryPhotoIssueCode>([
  'background_distraction',
  'lighting_risk',
])

export function buildCameraScreeningDecision({
  hasLightboxSetup,
  previousFailedAttempts,
  preflight,
}: CameraScreeningDecisionInput): CameraScreeningDecisionResult {
  if (preflight.passed) {
    return {
      decision: 'sample_ready_for_operator_review',
      summary:
        'Sample photo clears first-pass quality checks and still needs human review before setup readiness.',
      operatorGuidance: [
        'Keep using the rep phone or existing camera first.',
        'Confirm the sample came from the rep real capture setup.',
        'Do not treat this as automated kit, shipment, or launch approval.',
      ],
      coachingMessages: preflight.coachingMessages,
      guardrails: GUARDRAILS,
    }
  }

  if (previousFailedAttempts >= 2) {
    return {
      decision: 'manual_exception',
      summary:
        'Repeated sample-photo failures need manual operator review before any setup decision.',
      operatorGuidance: [
        'Escalate repeated sample-photo failures for manual review instead of recommending paid hardware.',
        'Review the rep setup, sample-photo history, and coaching attempts together.',
      ],
      coachingMessages: preflight.coachingMessages,
      guardrails: GUARDRAILS,
    }
  }

  if (
    !hasLightboxSetup &&
    preflight.issues.some((issue) => LIGHTBOX_RELATED_ISSUES.has(issue.code))
  ) {
    return {
      decision: 'missing_lightbox_setup',
      summary:
        'Sample photo issues point to setup/background review before another retry.',
      operatorGuidance: [
        'Confirm DUCLUS lightbox or equivalent white setup before asking for another sample.',
        'Keep this as operator guidance only, not a fulfillment trigger.',
      ],
      coachingMessages: preflight.coachingMessages,
      guardrails: GUARDRAILS,
    }
  }

  return {
    decision: 'coach_retry',
    summary:
      'Sample photo needs coaching and another retry before setup readiness.',
    operatorGuidance: [
      'Coach the rep on the quality issues before changing hardware.',
      'Use the existing Nic-Nac coaching messages as the retry checklist.',
    ],
    coachingMessages: preflight.coachingMessages,
    guardrails: GUARDRAILS,
  }
}
