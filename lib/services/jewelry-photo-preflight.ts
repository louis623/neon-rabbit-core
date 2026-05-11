export type JewelryPhotoIssueCode =
  | 'low_resolution'
  | 'blur_risk'
  | 'lighting_risk'
  | 'subject_framing'
  | 'detail_risk'
  | 'background_distraction'

export type JewelryPhotoIssueSeverity = 'warning' | 'critical'

export interface JewelryPhotoPreflightInput {
  width: number
  height: number
  blurRisk?: number
  lightingRisk?: number
  detailRisk?: number
  backgroundDistractionRisk?: number
  subjectCoverage?: number
  subjectCentered?: boolean
}

export interface JewelryPhotoPreflightIssue {
  code: JewelryPhotoIssueCode
  severity: JewelryPhotoIssueSeverity
  message: string
}

export interface JewelryPhotoPreflightResult {
  passed: boolean
  score: number
  issues: JewelryPhotoPreflightIssue[]
  coachingMessages: string[]
}

interface RuleResult {
  issue: JewelryPhotoPreflightIssue
  penalty: number
  coaching: string
}

const MIN_WARNING_EDGE = 1200
const MIN_CRITICAL_EDGE = 900
const MIN_WARNING_MEGAPIXELS = 2
const MIN_CRITICAL_MEGAPIXELS = 1.2
const WARNING_RISK = 0.45
const CRITICAL_RISK = 0.75
const WARNING_DETAIL_RISK = 0.58
const CRITICAL_DETAIL_RISK = 0.82
const WARNING_BACKGROUND_RISK = 0.55
const CRITICAL_BACKGROUND_RISK = 0.82
const WARNING_SUBJECT_COVERAGE = 0.28
const CRITICAL_SUBJECT_COVERAGE = 0.18
const LIGHT_BOX_GRACE_MIN_COVERAGE = 0.12
const LIGHT_BOX_GRACE_MAX_DETAIL_RISK = 0.4
const LIGHT_BOX_GRACE_MAX_BACKGROUND_RISK = 0.24

export function assessJewelryPhotoPreflight(
  input: JewelryPhotoPreflightInput
): JewelryPhotoPreflightResult {
  assertPositiveInteger(input.width, 'width')
  assertPositiveInteger(input.height, 'height')

  const checks = [
    evaluateResolution(input),
    evaluateBlur(input),
    evaluateLighting(input),
    evaluateDetail(input),
    evaluateBackground(input),
    evaluateFraming(input),
  ].filter((value): value is RuleResult => value !== null)

  const score = Math.max(
    0,
    Math.round(checks.reduce((running, check) => running - check.penalty, 100)),
  )
  const hasCriticalIssue = checks.some((check) => check.issue.severity === 'critical')

  if (checks.length === 0) {
    return {
      passed: true,
      score,
      issues: [],
      coachingMessages: [
        'Nice start - this photo looks clear, bright enough, and framed well for the next step.',
      ],
    }
  }

  return {
    passed: !hasCriticalIssue && score >= 70,
    score,
    issues: checks.map((check) => check.issue),
    coachingMessages: checks.map((check) => check.coaching),
  }
}

function evaluateResolution(input: JewelryPhotoPreflightInput): RuleResult | null {
  const shortestEdge = Math.min(input.width, input.height)
  const megapixels = (input.width * input.height) / 1_000_000

  if (shortestEdge < MIN_CRITICAL_EDGE || megapixels < MIN_CRITICAL_MEGAPIXELS) {
    return {
      penalty: 35,
      issue: {
        code: 'low_resolution',
        severity: 'critical',
        message: 'The photo is too small to preserve jewelry detail cleanly.',
      },
      coaching:
        'Try retaking it at a higher resolution or move closer so the jewelry fills more of the frame.',
    }
  }

  if (shortestEdge < MIN_WARNING_EDGE || megapixels < MIN_WARNING_MEGAPIXELS) {
    return {
      penalty: 15,
      issue: {
        code: 'low_resolution',
        severity: 'warning',
        message: 'The photo is a little small, so fine jewelry detail may soften.',
      },
      coaching:
        'A slightly larger photo will hold up better, especially if you move the camera a bit closer.',
    }
  }

  return null
}

function evaluateBlur(input: JewelryPhotoPreflightInput): RuleResult | null {
  const blurRisk = normalizeRisk(input.blurRisk)
  if (blurRisk === null) return null

  if (blurRisk >= CRITICAL_RISK) {
    return {
      penalty: 30,
      issue: {
        code: 'blur_risk',
        severity: 'critical',
        message: 'The photo looks likely to be soft or blurry.',
      },
      coaching:
        'Steady the camera, tap to focus on the jewelry, and wait for the shot to settle before snapping.',
    }
  }

  if (blurRisk >= WARNING_RISK) {
    return {
      penalty: 15,
      issue: {
        code: 'blur_risk',
        severity: 'warning',
        message: 'The photo may be a little soft around the jewelry details.',
      },
      coaching:
        'If you can, brace the camera or retake one sharper frame so the stone and metal edges stay crisp.',
    }
  }

  return null
}

function evaluateLighting(input: JewelryPhotoPreflightInput): RuleResult | null {
  const lightingRisk = normalizeRisk(input.lightingRisk)
  if (lightingRisk === null) return null

  if (lightingRisk >= CRITICAL_RISK) {
    return {
      penalty: 25,
      issue: {
        code: 'lighting_risk',
        severity: 'critical',
        message: 'The lighting looks too uneven or dim for a reliable cleanup pass.',
      },
      coaching:
        'Add softer front light or rotate the piece to reduce harsh shadows and dark spots.',
    }
  }

  if (lightingRisk >= WARNING_RISK) {
    return {
      penalty: 12,
      issue: {
        code: 'lighting_risk',
        severity: 'warning',
        message: 'The lighting may leave some shadows or dull highlights on the jewelry.',
      },
      coaching:
        'A little more even light will usually help the stones and metal read more cleanly.',
    }
  }

  return null
}

function evaluateDetail(input: JewelryPhotoPreflightInput): RuleResult | null {
  const detailRisk = normalizeRisk(input.detailRisk)
  if (detailRisk === null) return null

  if (detailRisk >= CRITICAL_DETAIL_RISK) {
    return {
      penalty: 30,
      issue: {
        code: 'detail_risk',
        severity: 'critical',
        message: 'The photo is not holding enough fine jewelry detail for a reliable cleanup pass.',
      },
      coaching:
        'Try one sharper, closer frame so the stone edges, prongs, and metal texture stay visible.',
    }
  }

  if (detailRisk >= WARNING_DETAIL_RISK) {
    return {
      penalty: 12,
      issue: {
        code: 'detail_risk',
        severity: 'warning',
        message: 'The photo looks a little light on fine jewelry detail.',
      },
      coaching:
        'This may still work, but a slightly closer or sharper photo will help the small details read better.',
    }
  }

  return null
}

function evaluateBackground(input: JewelryPhotoPreflightInput): RuleResult | null {
  const backgroundRisk = normalizeRisk(input.backgroundDistractionRisk)
  if (backgroundRisk === null) return null

  if (backgroundRisk >= CRITICAL_BACKGROUND_RISK) {
    return {
      penalty: 25,
      issue: {
        code: 'background_distraction',
        severity: 'critical',
        message: 'The background is too busy for a reliable cleanup pass.',
      },
      coaching:
        'Use a plain light background and clear away nearby props or packaging so the jewelry stands out.',
    }
  }

  if (backgroundRisk >= WARNING_BACKGROUND_RISK) {
    return {
      penalty: 10,
      issue: {
        code: 'background_distraction',
        severity: 'warning',
        message: 'The background may distract from the jewelry.',
      },
      coaching:
        'If you can, switch to a plainer background or crop out nearby objects so the piece stays front and center.',
    }
  }

  return null
}

function evaluateFraming(input: JewelryPhotoPreflightInput): RuleResult | null {
  const subjectCoverage = normalizeCoverage(input.subjectCoverage)
  const detailRisk = normalizeRisk(input.detailRisk)
  const backgroundRisk = normalizeRisk(input.backgroundDistractionRisk)

  if (subjectCoverage !== null && subjectCoverage < CRITICAL_SUBJECT_COVERAGE) {
    if (isCleanLightBoxCandidate(input, subjectCoverage, detailRisk, backgroundRisk)) {
      return {
        penalty: 12,
        issue: {
          code: 'subject_framing',
          severity: 'warning',
          message: 'The jewelry is a little small in the frame, but the clean setup still looks workable.',
        },
        coaching:
          'This should still be workable, but moving a little closer will make cleanup and detail retention easier.',
      }
    }

    return {
      penalty: 30,
      issue: {
        code: 'subject_framing',
        severity: 'critical',
        message: 'The jewelry is not framed clearly enough in the shot.',
      },
      coaching:
        'Center the jewelry and crop out extra background so the piece is the clear subject.',
    }
  }

  if (input.subjectCentered === false) {
    return {
      penalty: 10,
      issue: {
        code: 'subject_framing',
        severity: 'warning',
        message: 'The jewelry could be centered a little more clearly in the frame.',
      },
      coaching:
        'This should be workable, but centering the jewelry a bit more will usually give a cleaner result.',
    }
  }

  if (subjectCoverage !== null && subjectCoverage < WARNING_SUBJECT_COVERAGE) {
    return {
      penalty: 10,
      issue: {
        code: 'subject_framing',
        severity: 'warning',
        message: 'The jewelry is a little small in the frame.',
      },
      coaching:
        'Move the camera a little closer so the jewelry takes up more of the frame.',
    }
  }

  return null
}

function isCleanLightBoxCandidate(
  input: JewelryPhotoPreflightInput,
  subjectCoverage: number,
  detailRisk: number | null,
  backgroundRisk: number | null,
): boolean {
  if (subjectCoverage < LIGHT_BOX_GRACE_MIN_COVERAGE) return false
  if (input.subjectCentered === false) return false
  if (detailRisk !== null && detailRisk > LIGHT_BOX_GRACE_MAX_DETAIL_RISK) return false
  if (
    backgroundRisk !== null &&
    backgroundRisk > LIGHT_BOX_GRACE_MAX_BACKGROUND_RISK
  ) {
    return false
  }

  return true
}

function assertPositiveInteger(value: number, label: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a positive number`)
  }
}

function normalizeRisk(value: number | undefined): number | null {
  if (value === undefined) return null
  return clamp01(value)
}

function normalizeCoverage(value: number | undefined): number | null {
  if (value === undefined) return null
  return clamp01(value)
}

function clamp01(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.min(1, Math.max(0, value))
}
