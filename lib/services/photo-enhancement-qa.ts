import { assessJewelryPhotoPreflight } from '@/lib/services/jewelry-photo-preflight'

type EnhancementQaDecision = 'approve' | 'review' | 'hold'

const SUPPORTED_ENHANCED_PHOTO_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

export interface EnhancementQaMetrics {
  backgroundRemovalQuality: number
  subjectPreservation: number
  edgeCleanliness: number
  lightingConsistency: number
  artifactFreeScore: number
  detailRisk?: number
  backgroundDistractionRisk?: number
  outputWidth: number
  outputHeight: number
}

export interface EnhancementQaInput {
  assetId: string
  provider: 'photoroom'
  metrics: EnhancementQaMetrics
}

export interface EnhancementQaOutputInput {
  assetId: string
  provider: 'photoroom'
  outputWidth: number
  outputHeight: number
  contentType: string
  blurRisk?: number
  lightingRisk?: number
  detailRisk?: number
  backgroundDistractionRisk?: number
  subjectCoverage?: number
  subjectCentered?: boolean
}

interface PreflightSignalSnapshot {
  blurRisk?: number
  lightingRisk?: number
  detailRisk?: number
  backgroundDistractionRisk?: number
  subjectCoverage?: number
  subjectCentered?: boolean
}

export interface EnhancementQaResult {
  assetId: string
  provider: 'photoroom'
  confidenceScore: number
  decision: EnhancementQaDecision
  flaggedChecks: string[]
  reasons: string[]
}

export interface EnhancementQaOutputResult {
  assetId: string
  provider: 'photoroom'
  decision: Extract<EnhancementQaDecision, 'review' | 'hold'>
  flaggedChecks: string[]
  reasons: string[]
}

export interface CanonicalEnhancedPhotoInput {
  assetId: string
  provider: 'photoroom'
  sourcePreflight?: {
    passed: boolean
    score: number
    issues: Array<{
      severity: 'warning' | 'critical'
      code?: string
      message?: string
    }>
    coachingMessages?: string[]
  } | null
  sourceAnalysis?: PreflightSignalSnapshot | null
  outputPreflight?: {
    passed: boolean
    score: number
    issues: Array<{
      severity: 'warning' | 'critical'
      code?: string
      message?: string
    }>
    coachingMessages?: string[]
  } | null
  outputAnalysis?: PreflightSignalSnapshot | null
  sourceWidth: number
  sourceHeight: number
  outputWidth: number
  outputHeight: number
  contentType: string
}

export interface CanonicalEnhancedPhotoResult {
  assetId: string
  provider: 'photoroom'
  decision: 'promote_canonical' | 'qa_review' | 'hold'
  qaDecision: 'approve' | 'review' | 'hold'
  flaggedChecks: string[]
  reasons: string[]
}

export interface EnhancementQaOptions {
  approveThreshold?: number
  reviewThreshold?: number
  minSubjectPreservation?: number
  minArtifactFreeScore?: number
  minOutputDimension?: number
  flagThreshold?: number
}

const DEFAULT_OPTIONS: Required<EnhancementQaOptions> = {
  approveThreshold: 0.9,
  reviewThreshold: 0.75,
  minSubjectPreservation: 0.55,
  minArtifactFreeScore: 0.5,
  minOutputDimension: 1200,
  flagThreshold: 0.75,
}

const OUTPUT_DETAIL_FLAG_RISK = 0.58
const OUTPUT_DETAIL_HOLD_RISK = 0.82
const OUTPUT_BACKGROUND_FLAG_RISK = 0.55
const OUTPUT_BACKGROUND_HOLD_RISK = 0.82
const CANONICAL_SOURCE_MIN_SCORE = 94
const CANONICAL_OUTPUT_MIN_SCORE = 96

function roundScore(value: number) {
  return Math.round(value * 1000) / 1000
}

function getConfidenceScore(metrics: EnhancementQaMetrics) {
  return roundScore(
    metrics.backgroundRemovalQuality * 0.22 +
      metrics.subjectPreservation * 0.3 +
      metrics.edgeCleanliness * 0.16 +
      metrics.lightingConsistency * 0.14 +
      metrics.artifactFreeScore * 0.18,
  )
}

function getFlaggedChecks(
  metrics: EnhancementQaMetrics,
  options: Required<EnhancementQaOptions>,
) {
  const flags: string[] = []

  if (metrics.backgroundRemovalQuality < options.flagThreshold) {
    flags.push('background-removal')
  }

  if (metrics.subjectPreservation < options.flagThreshold) {
    flags.push('subject-preservation')
  }

  if (metrics.edgeCleanliness < options.flagThreshold) {
    flags.push('edge-cleanliness')
  }

  if (metrics.lightingConsistency < options.flagThreshold) {
    flags.push('lighting-consistency')
  }

  if (metrics.artifactFreeScore < options.flagThreshold) {
    flags.push('artifact-score')
  }

  if (
    typeof metrics.detailRisk === 'number' &&
    metrics.detailRisk >= OUTPUT_DETAIL_FLAG_RISK
  ) {
    flags.push('detail-retention')
  }

  if (
    typeof metrics.backgroundDistractionRisk === 'number' &&
    metrics.backgroundDistractionRisk >= OUTPUT_BACKGROUND_FLAG_RISK
  ) {
    flags.push('background-cleanup')
  }

  if (
    Math.min(metrics.outputWidth, metrics.outputHeight) < options.minOutputDimension
  ) {
    flags.push('resolution')
  }

  return flags
}

function isSupportedEnhancedPhotoContentType(contentType: string) {
  return SUPPORTED_ENHANCED_PHOTO_CONTENT_TYPES.has(contentType.toLowerCase())
}

function normalizeRisk(value: number | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null
  return Math.min(1, Math.max(0, value))
}

function pushUnique(values: string[], next: string): void {
  if (!values.includes(next)) {
    values.push(next)
  }
}

function getPreflightIssueFlag(code?: string): string | null {
  switch (code) {
    case 'low_resolution':
      return 'resolution'
    case 'blur_risk':
      return 'blur-risk'
    case 'lighting_risk':
      return 'lighting-risk'
    case 'subject_framing':
      return 'subject-framing'
    case 'detail_risk':
      return 'detail-retention'
    case 'background_distraction':
      return 'background-cleanup'
    default:
      return null
  }
}

function getHoldReasonForPreflightIssue(code?: string): string | null {
  switch (code) {
    case 'low_resolution':
      return 'Output held because the enhanced image resolution is too low.'
    case 'blur_risk':
      return 'Output held because the enhanced image still looks too soft.'
    case 'lighting_risk':
      return 'Output held because the enhanced image lighting is still too uneven.'
    case 'subject_framing':
      return 'Output held because the jewelry is not framed clearly enough after enhancement.'
    case 'detail_risk':
      return 'Output held because fine detail retention fell below the safety floor.'
    case 'background_distraction':
      return 'Output held because the background still looks too distracting after enhancement.'
    default:
      return null
  }
}

function getReviewReasonForPreflightIssue(code?: string): string | null {
  switch (code) {
    case 'low_resolution':
      return 'Output needs manual review because the enhanced image is smaller than ideal.'
    case 'blur_risk':
      return 'Output needs manual review because the jewelry still looks a little soft.'
    case 'lighting_risk':
      return 'Output needs manual review because the lighting still looks a little uneven.'
    case 'subject_framing':
      return 'Output needs manual review because the jewelry sits a little small or off-center in the frame.'
    case 'detail_risk':
      return 'Output needs manual review because the enhancement looks a little light on fine detail.'
    case 'background_distraction':
      return 'Output needs manual review because the background cleanup is not fully convincing yet.'
    default:
      return null
  }
}

function assessOptionalPreflight(
  width: number,
  height: number,
  signals?: PreflightSignalSnapshot | null,
) {
  if (!signals) return null

  return assessJewelryPhotoPreflight({
    width,
    height,
    blurRisk: signals.blurRisk,
    lightingRisk: signals.lightingRisk,
    detailRisk: signals.detailRisk,
    backgroundDistractionRisk: signals.backgroundDistractionRisk,
    subjectCoverage: signals.subjectCoverage,
    subjectCentered: signals.subjectCentered,
  })
}

export function inspectEnhancedPhoto(
  input: EnhancementQaInput,
  overrides: EnhancementQaOptions = {},
): EnhancementQaResult {
  const options = { ...DEFAULT_OPTIONS, ...overrides }
  const flaggedChecks = getFlaggedChecks(input.metrics, options)
  const confidenceScore = getConfidenceScore(input.metrics)
  const reasons: string[] = []
  const detailRisk = normalizeRisk(input.metrics.detailRisk)
  const backgroundRisk = normalizeRisk(input.metrics.backgroundDistractionRisk)

  if (input.metrics.subjectPreservation < options.minSubjectPreservation) {
    reasons.push('Output held because subject preservation fell below the safety floor.')
  }

  if (input.metrics.artifactFreeScore < options.minArtifactFreeScore) {
    reasons.push('Output held because artifact cleanup fell below the safety floor.')
  }

  if (
    Math.min(input.metrics.outputWidth, input.metrics.outputHeight) <
    options.minOutputDimension
  ) {
    reasons.push('Output held because the enhanced image resolution is too low.')
  }

  if (detailRisk !== null && detailRisk >= OUTPUT_DETAIL_HOLD_RISK) {
    reasons.push('Output held because fine detail retention fell below the safety floor.')
  }

  if (backgroundRisk !== null && backgroundRisk >= OUTPUT_BACKGROUND_HOLD_RISK) {
    reasons.push('Output held because the background still looks too distracting after enhancement.')
  }

  if (reasons.length > 0) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      confidenceScore,
      decision: 'hold',
      flaggedChecks,
      reasons,
    }
  }

  if (confidenceScore >= options.approveThreshold && flaggedChecks.length === 0) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      confidenceScore,
      decision: 'approve',
      flaggedChecks,
      reasons: ['Confidence cleared the auto-approve threshold.'],
    }
  }

  return {
    assetId: input.assetId,
    provider: input.provider,
    confidenceScore,
    decision: confidenceScore >= options.reviewThreshold ? 'review' : 'hold',
    flaggedChecks,
    reasons: [
      confidenceScore >= options.reviewThreshold
        ? 'Confidence or flagged checks require manual review before publish.'
        : 'Confidence is too low, so the enhancement is held for manual review.',
    ],
  }
}

export function inspectEnhancedPhotoOutput(
  input: EnhancementQaOutputInput,
  overrides: EnhancementQaOptions = {},
): EnhancementQaOutputResult {
  const options = { ...DEFAULT_OPTIONS, ...overrides }
  const flaggedChecks: string[] = []
  const reasons: string[] = []
  let hasHardMetadataFailure = false
  const shortestEdge = Math.min(input.outputWidth, input.outputHeight)
  const megapixels = (input.outputWidth * input.outputHeight) / 1_000_000

  if (!isSupportedEnhancedPhotoContentType(input.contentType)) {
    flaggedChecks.push('content-type')
    pushUnique(
      reasons,
      'Output held because the provider returned an unsupported content type.',
    )
    hasHardMetadataFailure = true
  }

  if (shortestEdge < options.minOutputDimension) {
    flaggedChecks.push('resolution')
    pushUnique(
      reasons,
      'Output held because the enhanced image resolution is too low.',
    )
    hasHardMetadataFailure = true
  }

  if (
    !hasHardMetadataFailure &&
    (shortestEdge === options.minOutputDimension || megapixels < 2)
  ) {
    pushUnique(flaggedChecks, 'resolution')
    pushUnique(
      reasons,
      'Output needs manual review because the enhanced image is smaller than ideal.',
    )
  }

  const signalPreflight = assessOptionalPreflight(input.outputWidth, input.outputHeight, {
    blurRisk: input.blurRisk,
    lightingRisk: input.lightingRisk,
    detailRisk: input.detailRisk,
    backgroundDistractionRisk: input.backgroundDistractionRisk,
    subjectCoverage: input.subjectCoverage,
    subjectCentered: input.subjectCentered,
  })

  if (signalPreflight) {
    for (const issue of signalPreflight.issues) {
      const flag = getPreflightIssueFlag(issue.code)
      if (flag) {
        pushUnique(flaggedChecks, flag)
      }
      const reason =
        issue.severity === 'critical'
          ? getHoldReasonForPreflightIssue(issue.code)
          : getReviewReasonForPreflightIssue(issue.code)
      if (reason) {
        pushUnique(reasons, reason)
      }
    }
  }

  const hasCriticalSignalIssue =
    signalPreflight?.issues.some((issue) => issue.severity === 'critical') ?? false

  if (hasHardMetadataFailure || hasCriticalSignalIssue) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'hold',
      flaggedChecks,
      reasons,
    }
  }

  if (reasons.length > 0 && flaggedChecks.length > 0) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'review',
      flaggedChecks,
      reasons,
    }
  }

  if (reasons.length > 0) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'hold',
      flaggedChecks,
      reasons,
    }
  }

  return {
    assetId: input.assetId,
    provider: input.provider,
    decision: 'review',
    flaggedChecks,
    reasons: [
      'Metadata checks passed, but this output still requires manual review before publish.',
    ],
  }
}

export function decideCanonicalEnhancedPhoto(
  input: CanonicalEnhancedPhotoInput,
  overrides: EnhancementQaOptions = {},
): CanonicalEnhancedPhotoResult {
  const outputQa = inspectEnhancedPhotoOutput(
    {
      assetId: input.assetId,
      provider: input.provider,
      outputWidth: input.outputWidth,
      outputHeight: input.outputHeight,
      contentType: input.contentType,
      blurRisk: input.outputAnalysis?.blurRisk,
      lightingRisk: input.outputAnalysis?.lightingRisk,
      detailRisk: input.outputAnalysis?.detailRisk,
      backgroundDistractionRisk: input.outputAnalysis?.backgroundDistractionRisk,
      subjectCoverage: input.outputAnalysis?.subjectCoverage,
      subjectCentered: input.outputAnalysis?.subjectCentered,
    },
    overrides,
  )

  if (outputQa.decision === 'hold') {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'hold',
      qaDecision: 'hold',
      flaggedChecks: outputQa.flaggedChecks,
      reasons: outputQa.reasons,
    }
  }

  const flaggedChecks = [...outputQa.flaggedChecks]
  const reasons = [...outputQa.reasons]
  const sourcePreflight =
    input.sourcePreflight ??
    assessOptionalPreflight(input.sourceWidth, input.sourceHeight, input.sourceAnalysis)
  const outputPreflight =
    input.outputPreflight ??
    assessOptionalPreflight(input.outputWidth, input.outputHeight, input.outputAnalysis)
  const sourceCriticalIssue =
    sourcePreflight?.issues.some((issue) => issue.severity === 'critical') ?? false
  const sourceScore = sourcePreflight?.score ?? 0
  const outputCriticalIssue =
    outputPreflight?.issues.some((issue) => issue.severity === 'critical') ?? false
  const outputScore = outputPreflight?.score ?? 0
  const outputMinDimension = Math.min(input.outputWidth, input.outputHeight)
  const outputNotSmaller =
    input.outputWidth >= input.sourceWidth &&
    input.outputHeight >= input.sourceHeight

  if (!outputNotSmaller) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'hold',
      qaDecision: 'hold',
      flaggedChecks: [...flaggedChecks, 'dimension-regression'],
      reasons: [
        ...reasons,
        'The enhanced output is smaller than the staged source photo.',
      ],
    }
  }
  if (outputCriticalIssue || (outputPreflight && !outputPreflight.passed)) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'hold',
      qaDecision: 'hold',
      flaggedChecks: [...flaggedChecks, 'output-preflight'],
      reasons: [
        ...reasons,
        'The enhanced output does not clear the image-quality preflight.',
      ],
    }
  }

  if (!sourcePreflight) {
    pushUnique(flaggedChecks, 'source-preflight-missing')
    reasons.push('The source photo needs image-quality analysis before canonical promotion.')
  }
  if (!outputPreflight) {
    pushUnique(flaggedChecks, 'output-preflight-missing')
    reasons.push('The enhanced output needs image-quality analysis before canonical promotion.')
  }
  if (sourceCriticalIssue || sourceScore < CANONICAL_SOURCE_MIN_SCORE) {
    flaggedChecks.push('source-preflight')
    reasons.push('The source photo only passed with warnings, so it still needs manual review.')
  }
  if (outputPreflight && outputScore < CANONICAL_OUTPUT_MIN_SCORE) {
    flaggedChecks.push('output-preflight')
    reasons.push('The enhanced output is usable, but its image quality still merits manual review.')
  }
  if (outputMinDimension < 1600) {
    flaggedChecks.push('auto-promote-resolution')
    reasons.push('The enhanced output is not large enough for safe canonical promotion.')
  }

  for (const issue of outputPreflight?.issues ?? []) {
    if (issue.code === 'detail_risk') {
      pushUnique(flaggedChecks, 'output-detail')
      reasons.push('The enhanced output looks a little light on fine detail, so it should stay in QA review.')
    }
    if (issue.code === 'background_distraction') {
      pushUnique(flaggedChecks, 'output-background')
      reasons.push('The enhanced output still has background distractions, so it should stay in QA review.')
    }
  }

  if (flaggedChecks.length === 0) {
    return {
      assetId: input.assetId,
      provider: input.provider,
      decision: 'promote_canonical',
      qaDecision: 'approve',
      flaggedChecks: [],
      reasons: ['The source photo had a clean preflight and the enhanced output cleared the conservative promotion rule.'],
    }
  }

  return {
    assetId: input.assetId,
    provider: input.provider,
    decision: 'qa_review',
    qaDecision: 'review',
    flaggedChecks,
    reasons,
  }
}
