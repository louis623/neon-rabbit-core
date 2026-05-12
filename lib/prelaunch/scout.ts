import { createAnthropic } from '@ai-sdk/anthropic'
import { generateText } from 'ai'
import {
  buildPrelaunchScoutInput,
  normalizePrelaunchIntakeReviewRows,
  type PrelaunchIntakeReviewRow,
  type PrelaunchIntakeReviewSubmission,
} from './intake-review'
import { PRELAUNCH_INTAKE_REVIEW_SELECT } from './intake-review-query'
import { ServiceError } from '@/lib/services/errors'
import { createAdminClient } from '@/lib/supabase/admin'

type AdminClient = ReturnType<typeof createAdminClient>

const anthropic = createAnthropic({ baseURL: 'https://api.anthropic.com/v1' })

export type PrelaunchScoutPriority = 'high' | 'medium' | 'low'

export interface PrelaunchScoutResearchTarget {
  label: string
  value: string
  priority: PrelaunchScoutPriority
}

export interface PrelaunchScoutResearchPlan {
  status: 'manual_research_required' | 'evidence_captured'
  searchQueries: string[]
  evidenceChecklist: string[]
  blockers: string[]
  capturedEvidence: PrelaunchScoutCapturedEvidence[]
  sourceReports: PrelaunchScoutEvidenceSourceReport[]
}

export interface PrelaunchScoutLesson {
  sourceRunKey: string
  lesson: string
  similarityReasons?: string[]
}

export interface PrelaunchScoutCapturedEvidence {
  label: PrelaunchScoutEvidenceLabel
  url: string
  title: string | null
  description: string | null
  canonicalUrl: string | null
  outboundLinks: string[]
  primaryOutboundLink: string | null
  primaryOutboundLinkReason: string | null
}

export interface PrelaunchScoutEvidenceSourceReport {
  label: PrelaunchScoutEvidenceLabel
  status:
    | 'not_provided'
    | 'not_checked'
    | 'captured'
    | 'metadata_missing'
    | 'fetch_failed'
    | 'non_html_response'
  url: string | null
  note: string
}

type PrelaunchScoutEvidenceLabel =
  | 'TikTok'
  | 'Instagram'
  | 'Facebook'
  | 'Primary customer link'

const PRIMARY_CUSTOMER_LINK_LABEL = 'Primary customer link'

export interface PrelaunchScoutOutput {
  briefTitle: string
  summary: string
  recommendedNextStep: 'book_discovery_call' | 'operator_review_first'
  researchTargets: PrelaunchScoutResearchTarget[]
  researchPlan: PrelaunchScoutResearchPlan
  publicFunnel: PrelaunchScoutPublicFunnel
  researchSynthesis: PrelaunchScoutResearchSynthesis
  setupRisks: string[]
  suggestedQuestions: string[]
  reusedLessons: PrelaunchScoutLesson[]
  generatedBy: 'deterministic_scout_v1'
}

export interface PrelaunchScoutPublicFunnel {
  shape: 'direct_site_first' | 'hub_first' | 'unclear'
  summary: string
  primaryLinks: string[]
  concerns: string[]
}

export interface PrelaunchScoutResearchSynthesis {
  status: 'not_available' | 'deterministic_fallback' | 'model_generated'
  discoveryAngle: string | null
  summaryBullets: string[]
  followUpQuestions: string[]
}

export interface RunPrelaunchScoutOptions {
  admin?: AdminClient
  fetchImpl?: typeof fetch
  generateTextImpl?: ScoutSynthesisGenerateText
  intakeId: string
  operatorRepId?: string | null
  now?: Date
  triggerSource?: 'operator_review' | 'intake_submission'
}

function hasFlag(submission: PrelaunchIntakeReviewSubmission, flag: string) {
  return submission.fitFlags.includes(flag)
}

function buildResearchTargets(
  submission: PrelaunchIntakeReviewSubmission,
): PrelaunchScoutResearchTarget[] {
  const targets: PrelaunchScoutResearchTarget[] = []

  if (submission.social.tiktok) {
    targets.push({
      label: 'TikTok',
      value: submission.social.tiktok,
      priority: 'high',
    })
  }
  if (submission.social.instagram) {
    targets.push({
      label: 'Instagram',
      value: submission.social.instagram,
      priority: 'medium',
    })
  }
  if (submission.social.facebook) {
    targets.push({
      label: 'Facebook',
      value: submission.social.facebook,
      priority: 'medium',
    })
  }

  if (targets.length === 0) {
    targets.push({
      label: 'Manual social lookup',
      value: `${submission.name} / ${submission.businessName}`,
      priority: 'high',
    })
  }

  return targets
}

function buildResearchSearchQueries(
  submission: PrelaunchIntakeReviewSubmission,
) {
  const queries: string[] = []

  if (submission.social.tiktok) {
    queries.push(
      `${submission.businessName} ${submission.social.tiktok} TikTok`,
    )
  }
  if (submission.social.instagram) {
    queries.push(
      `${submission.businessName} ${submission.social.instagram} Instagram`,
    )
  }
  if (submission.social.facebook) {
    queries.push(
      `${submission.businessName} ${submission.social.facebook} Facebook`,
    )
  }
  if (submission.team.name) {
    queries.push(
      `${submission.businessName} ${submission.team.name} Bomb Party`,
    )
  }
  if (queries.length === 0) {
    queries.push(`${submission.name} ${submission.businessName} Bomb Party`)
  }

  return queries
}

function buildResearchPlan(
  submission: PrelaunchIntakeReviewSubmission,
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
  sourceReports: PrelaunchScoutEvidenceSourceReport[],
): PrelaunchScoutResearchPlan {
  if (capturedEvidence.length > 0) {
    const hasCustomerLinkEvidence = capturedEvidence.some(
      (item) => item.label === PRIMARY_CUSTOMER_LINK_LABEL,
    )
    const hasFailedCustomerLinkCheck = sourceReports.some(
      (item) =>
        item.label === PRIMARY_CUSTOMER_LINK_LABEL &&
        item.status !== 'captured',
    )

    return {
      status: 'evidence_captured',
      searchQueries: buildResearchSearchQueries(submission),
      evidenceChecklist: [
        'Confirm the public profile still matches the intake current setup.',
        'Look for one discovery-call angle from the captured bio/title language.',
        'Check whether live cadence, trade flow, or customer-action links need deeper manual follow-up.',
        ...(hasCustomerLinkEvidence
          ? [
              'Compare the direct customer-link page against the public profile promise before the discovery call.',
            ]
          : []),
        ...(hasFailedCustomerLinkCheck
          ? [
              'Open any direct customer links Scout could not fetch and verify the customer path manually.',
            ]
          : []),
      ],
      blockers: [],
      capturedEvidence,
      sourceReports,
    }
  }

  return {
    status: 'manual_research_required',
    searchQueries: buildResearchSearchQueries(submission),
    evidenceChecklist: [
      'Confirm recent live-show cadence and audience engagement.',
      'Check whether the bio/link flow matches the intake current setup.',
      'Look for launch blockers: inactive profiles, mismatched business name, or missing customer action links.',
      'Capture one useful positioning note for the discovery call.',
    ],
    blockers: ['External social research is not connected yet.'],
    capturedEvidence,
    sourceReports,
  }
}

function buildSetupRisks(submission: PrelaunchIntakeReviewSubmission) {
  const risks: string[] = []

  if (hasFlag(submission, 'phone_only_setup')) {
    risks.push('Confirm a two-device live setup before booking a build path.')
  }
  if (hasFlag(submission, 'not_live_yet')) {
    risks.push('Confirm launch timing because the rep may not be live yet.')
  }
  if (hasFlag(submission, 'device_setup_unknown')) {
    risks.push('Confirm device setup before recommending show-night workflow.')
  }
  if (hasFlag(submission, 'platform_unknown')) {
    risks.push('Confirm primary streaming platform before site planning.')
  }
  if (submission.fitFlags.length === 0) {
    risks.push('No intake fit flags. Validate social presence before the call.')
  }

  return risks
}

function buildSuggestedQuestions(submission: PrelaunchIntakeReviewSubmission) {
  const questions = [
    `What does ${submission.name} want the Sparkle Suite site to solve first on show nights?`,
    `Which links or customer actions currently create the most friction from ${submission.primaryPlatform}?`,
    'What would make the discovery call feel like a clear yes or no for both sides?',
  ]

  if (submission.deviceSetup === 'phone_only') {
    questions.unshift(
      'Can they support a two-device setup for live shows, or do we need a phone-first workflow?',
    )
  }
  if (submission.team.name) {
    questions.push(
      `How does the ${submission.team.name} team currently share links, trade board examples, and launch updates?`,
    )
  }
  if (submission.brandVibe || submission.colorPreferences) {
    questions.push(
      'Which visual details are must-keep brand signals versus flexible preferences?',
    )
  }

  return questions
}

function buildSourceReportQuestions(
  sourceReports: PrelaunchScoutEvidenceSourceReport[],
) {
  const hasFailedCustomerLinkCheck = sourceReports.some(
    (item) =>
      item.label === PRIMARY_CUSTOMER_LINK_LABEL && item.status !== 'captured',
  )

  return hasFailedCustomerLinkCheck
    ? [
        'Can Louis open the public customer link manually before the call to confirm the real customer path?',
      ]
    : []
}

function appendLessonReuseQuestion(
  questions: string[],
  lessons: PrelaunchScoutLesson[],
) {
  if (lessons.length === 0) return questions

  return [
    ...questions,
    'What from the prior Scout lesson should Louis reuse or avoid for this rep?',
  ]
}

function dedupeStrings(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))]
}

function buildDeterministicScoutSynthesis(
  submission: PrelaunchIntakeReviewSubmission,
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
): PrelaunchScoutResearchSynthesis {
  if (capturedEvidence.length === 0) {
    return {
      status: 'not_available',
      discoveryAngle: null,
      summaryBullets: [],
      followUpQuestions: [],
    }
  }

  const evidenceBullets = capturedEvidence
    .map((item) => item.description ?? item.title)
    .filter((value): value is string => Boolean(value))
    .slice(0, 3)
  const outboundLinks = dedupeStrings(
    capturedEvidence.flatMap((item) => item.outboundLinks),
  ).slice(0, 3)
  const primaryOutboundLink =
    capturedEvidence.find((item) => item.primaryOutboundLink)?.primaryOutboundLink ??
    null
  const hasCustomerLinkEvidence = capturedEvidence.some(
    (item) => item.label === PRIMARY_CUSTOMER_LINK_LABEL,
  )

  return {
    status: 'deterministic_fallback',
    discoveryAngle:
      `${submission.businessName} already has public-facing signals Louis can react to ` +
      `before deeper manual research, so the discovery call can focus on cleaning up the customer path around ${submission.primaryPlatform}.`,
    summaryBullets:
      dedupeStrings([
        ...(
          evidenceBullets.length > 0
            ? evidenceBullets
            : capturedEvidence.map(
                (item) =>
                  `${item.label} profile is reachable and gives Scout a real public starting point.`,
              )
        ),
        ...outboundLinks.map(
          (link) => `Public profile points customers toward ${link}.`,
        ),
      ]).slice(0, 4),
    followUpQuestions: dedupeStrings([
      `Which customer action breaks most often around ${submission.primaryPlatform} today?`,
      'What existing public-profile language should stay versus get cleaned up before launch?',
      ...(primaryOutboundLink
        ? [
            `Which public link should become the main Sparkle Suite call to action first: ${primaryOutboundLink}?`,
          ]
        : []),
      ...(hasCustomerLinkEvidence
        ? [
            'Does the direct customer-link page match what the public profile promises?',
          ]
        : []),
    ]).slice(0, 4),
  }
}

function buildPrelaunchScoutPublicFunnel(
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
): PrelaunchScoutPublicFunnel {
  const primaryLinks = dedupeStrings(
    capturedEvidence
      .map((item) => item.primaryOutboundLink)
      .filter((value): value is string => Boolean(value)),
  )

  if (primaryLinks.length === 0) {
    return {
      shape: 'unclear',
      summary:
        'Scout does not have enough public link evidence to describe the customer path yet.',
      primaryLinks: [],
      concerns: ['Public customer path still needs manual confirmation.'],
    }
  }

  const hasDirectLink = primaryLinks.some((link) => !isGenericLinkHub(link))
  if (hasDirectLink) {
    const directLinks = primaryLinks.filter((link) => !isGenericLinkHub(link))

    return {
      shape: 'direct_site_first',
      summary:
        'The public profile points customers straight to a direct brand or shop link first.',
      primaryLinks,
      concerns:
        directLinks.length > 1
          ? [
              'Multiple public profiles point to different direct customer links; confirm which link should be primary before the discovery call.',
            ]
          : [],
    }
  }

  return {
    shape: 'hub_first',
    summary:
      'The visible public path depends on a generic link hub before customers reach a specific action.',
    primaryLinks,
    concerns: [
      'Confirm which hub destination should become the main Sparkle Suite call to action.',
    ],
  }
}

function buildCapturedEvidenceSummary(
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
) {
  if (capturedEvidence.length === 0) {
    return 'External social research is not connected yet, so this first Scout pass flags what Louis should verify manually.'
  }

  const profileLabels = dedupeStrings(
    capturedEvidence
      .map((item) => item.label)
      .filter((label) => label !== PRIMARY_CUSTOMER_LINK_LABEL),
  )
  const hasCustomerLinkEvidence = capturedEvidence.some(
    (item) => item.label === PRIMARY_CUSTOMER_LINK_LABEL,
  )
  const profileSummary =
    profileLabels.length > 0
      ? `public-profile evidence from ${profileLabels.join(', ')}`
      : null
  const customerLinkSummary = hasCustomerLinkEvidence
    ? 'direct customer-link evidence'
    : null
  const evidenceSummary = [profileSummary, customerLinkSummary]
    .filter(Boolean)
    .join(' plus ')

  return `Scout captured ${evidenceSummary} so Louis can start from real public signals before deeper manual review.`
}

type ScoutSynthesisGenerateText = (options: {
  prompt: string
}) => Promise<{ text: string }>

function stripJsonFence(text: string) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
}

function parseScoutSynthesisJson(text: string) {
  const parsed = JSON.parse(stripJsonFence(text)) as {
    discoveryAngle?: unknown
    summaryBullets?: unknown
    followUpQuestions?: unknown
  }

  if (typeof parsed.discoveryAngle !== 'string') {
    throw new Error('Missing discoveryAngle in Scout synthesis response.')
  }

  const summaryBullets = Array.isArray(parsed.summaryBullets)
    ? parsed.summaryBullets.filter((item): item is string => typeof item === 'string')
    : []
  const followUpQuestions = Array.isArray(parsed.followUpQuestions)
    ? parsed.followUpQuestions.filter((item): item is string => typeof item === 'string')
    : []

  return {
    discoveryAngle: parsed.discoveryAngle.trim(),
    summaryBullets: dedupeStrings(summaryBullets).slice(0, 4),
    followUpQuestions: dedupeStrings(followUpQuestions).slice(0, 4),
  }
}

function buildScoutSynthesisPrompt(
  submission: PrelaunchIntakeReviewSubmission,
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
) {
  const evidenceLines = capturedEvidence
    .map((item, index) => {
      const parts = [
        `source ${index + 1}: ${item.label}`,
        `url: ${item.url}`,
        item.title ? `title: ${item.title}` : null,
        item.description ? `description: ${item.description}` : null,
        item.outboundLinks.length > 0
          ? `outboundLinks: ${item.outboundLinks.join(', ')}`
          : null,
        item.primaryOutboundLink
          ? `primaryOutboundLink: ${item.primaryOutboundLink}`
          : null,
        item.primaryOutboundLinkReason
          ? `primaryOutboundLinkReason: ${item.primaryOutboundLinkReason}`
          : null,
      ].filter(Boolean)

      return parts.join('\n')
    })
    .join('\n\n')

  return `You are Scout for Sparkle Suite prelaunch rep screening.

Return JSON only with this shape:
{
  "discoveryAngle": "string",
  "summaryBullets": ["string", "string"],
  "followUpQuestions": ["string", "string"]
}

Rules:
- Keep it plain English.
- Do not overclaim research certainty.
- Base the answer only on the intake facts and captured public evidence below.
- Focus on what Louis should notice before a discovery call.
- Each bullet or question should be one sentence.

Rep intake:
- businessName: ${submission.businessName}
- repName: ${submission.name}
- primaryPlatform: ${submission.primaryPlatform}
- streamingFrequency: ${submission.streamingFrequency}
- currentSetup: ${submission.currentSetup}
- setupGoal: ${submission.setupGoal}
- deviceSetup: ${submission.deviceSetup}
- teamName: ${submission.team.name ?? 'none'}
- fitFlags: ${submission.fitFlags.join(', ') || 'none'}

Captured public evidence:
${evidenceLines}`
}

async function defaultScoutGenerateText({
  prompt,
}: {
  prompt: string
}) {
  const result = await generateText({
    model: anthropic('claude-haiku-4-5-20251001'),
    prompt,
  })

  return { text: result.text }
}

export async function synthesizePrelaunchScoutEvidence(
  submission: PrelaunchIntakeReviewSubmission,
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
  {
    generateTextImpl,
  }: {
    generateTextImpl?: ScoutSynthesisGenerateText
  } = {},
): Promise<PrelaunchScoutResearchSynthesis> {
  const fallback = buildDeterministicScoutSynthesis(submission, capturedEvidence)

  if (capturedEvidence.length === 0) {
    return fallback
  }

  const generator =
    generateTextImpl ??
    (process.env.ANTHROPIC_API_KEY ? defaultScoutGenerateText : null)

  if (!generator) {
    return fallback
  }

  try {
    const result = await generator({
      prompt: buildScoutSynthesisPrompt(submission, capturedEvidence),
    })
    const parsed = parseScoutSynthesisJson(result.text)

    return {
      status: 'model_generated',
      discoveryAngle: parsed.discoveryAngle,
      summaryBullets: parsed.summaryBullets,
      followUpQuestions: parsed.followUpQuestions,
    }
  } catch {
    return fallback
  }
}

export function buildPrelaunchScoutOutput(
  submission: PrelaunchIntakeReviewSubmission,
  reusedLessons: PrelaunchScoutLesson[] = [],
  capturedEvidence: PrelaunchScoutCapturedEvidence[] = [],
  researchSynthesis: PrelaunchScoutResearchSynthesis = buildDeterministicScoutSynthesis(
    submission,
    capturedEvidence,
  ),
  sourceReports: PrelaunchScoutEvidenceSourceReport[] = buildDefaultScoutSourceReports(
    submission,
    capturedEvidence,
  ),
): PrelaunchScoutOutput {
  const recommendedNextStep =
    submission.prequalificationStatus === 'needs_review' ||
    submission.fitFlags.length > 0
      ? 'operator_review_first'
      : 'book_discovery_call'
  const publicFunnel = buildPrelaunchScoutPublicFunnel(capturedEvidence)

  return {
    briefTitle: `Scout brief: ${submission.businessName}`,
    summary:
      `${submission.businessName} is a ${submission.primaryPlatform} prospect ` +
      `streaming ${submission.streamingFrequency}. Intake goal: ${submission.setupGoal}. ` +
      buildCapturedEvidenceSummary(capturedEvidence),
    recommendedNextStep,
    researchTargets: buildResearchTargets(submission),
    researchPlan: buildResearchPlan(submission, capturedEvidence, sourceReports),
    publicFunnel,
    researchSynthesis,
    setupRisks: buildSetupRisks(submission),
    suggestedQuestions: appendLessonReuseQuestion(
      dedupeStrings([
        ...buildSuggestedQuestions(submission),
        ...buildSourceReportQuestions(sourceReports),
        ...researchSynthesis.followUpQuestions,
        ...(publicFunnel.shape === 'hub_first'
          ? ['Which hub destination should become the main Sparkle Suite call to action?']
          : []),
        ...(publicFunnel.concerns.some((concern) =>
          concern.startsWith('Multiple public profiles point to different'),
        )
          ? [
              'Which public customer link should become the primary Sparkle Suite call to action?',
            ]
          : []),
      ]),
      reusedLessons,
    ),
    reusedLessons,
    generatedBy: 'deterministic_scout_v1',
  }
}

async function loadSubmissionById(admin: AdminClient, intakeId: string) {
  const { data, error } = await admin
    .from('sparkle_suite_intake_submissions')
    .select(PRELAUNCH_INTAKE_REVIEW_SELECT)
    .eq('id', intakeId)
    .single()

  if (error || !data) {
    throw new ServiceError({
      code: 'INTAKE_NOT_FOUND',
      message: `prelaunch intake not found: ${intakeId}`,
      userMessage: 'That intake submission could not be found.',
      statusCode: 404,
      cause: error,
    })
  }

  const [submission] = normalizePrelaunchIntakeReviewRows([
    data as unknown as PrelaunchIntakeReviewRow,
  ])
  return submission
}

interface PreviousScoutRunRow {
  run_key: string
  summary: string | null
  output: {
    setupRisks?: unknown
  } | null
  input: {
    streamingContext?: {
      primaryPlatform?: unknown
      deviceSetup?: unknown
    }
    teamContext?: {
      teamName?: unknown
    }
    prequalification?: {
      fitFlags?: unknown
    }
  } | null
}

function normalizePreviousScoutLesson(
  row: PreviousScoutRunRow,
  similarityReasons: string[] = [],
): PrelaunchScoutLesson | null {
  const summary = row.summary?.trim()
  if (summary) {
    return {
      sourceRunKey: row.run_key,
      lesson: summary,
      ...(similarityReasons.length > 0 ? { similarityReasons } : {}),
    }
  }

  const firstRisk = Array.isArray(row.output?.setupRisks)
    ? row.output.setupRisks.find((risk) => typeof risk === 'string')
    : null

  if (!firstRisk) return null

  return {
    sourceRunKey: row.run_key,
    lesson: firstRisk,
    ...(similarityReasons.length > 0 ? { similarityReasons } : {}),
  }
}

function normalizeScoutComparableString(value: unknown) {
  return typeof value === 'string' ? value.trim().toLowerCase() : null
}

function buildScoutLessonSimilarityReasons(
  submission: PrelaunchIntakeReviewSubmission,
  row: PreviousScoutRunRow,
) {
  if (!row.input) return []

  const reasons: string[] = []
  const previousPrimaryPlatform = normalizeScoutComparableString(
    row.input.streamingContext?.primaryPlatform,
  )
  const previousDeviceSetup = normalizeScoutComparableString(
    row.input.streamingContext?.deviceSetup,
  )
  const previousTeamName = normalizeScoutComparableString(
    row.input.teamContext?.teamName,
  )
  const previousFitFlags = Array.isArray(row.input.prequalification?.fitFlags)
    ? row.input.prequalification.fitFlags.filter(
        (flag): flag is string => typeof flag === 'string',
      )
    : []

  if (
    previousPrimaryPlatform &&
    previousPrimaryPlatform === submission.primaryPlatform.toLowerCase()
  ) {
    reasons.push('same primary platform')
  }
  if (
    previousDeviceSetup &&
    previousDeviceSetup === submission.deviceSetup.toLowerCase()
  ) {
    reasons.push('same device setup')
  }
  if (
    previousTeamName &&
    submission.team.name &&
    previousTeamName === submission.team.name.trim().toLowerCase()
  ) {
    reasons.push('same team')
  }

  const currentFitFlags = new Set(submission.fitFlags)
  for (const flag of previousFitFlags) {
    if (currentFitFlags.has(flag)) {
      reasons.push(`shared fit flag: ${flag}`)
    }
  }

  return reasons
}

async function loadRecentScoutLessons(
  admin: AdminClient,
  submission: PrelaunchIntakeReviewSubmission,
) {
  try {
    const { data, error } = await admin
      .from('agent_runs')
      .select('run_key, summary, output, input')
      .eq('agent_name', 'Scout')
      .eq('status', 'completed')
      .neq('intake_submission_id', submission.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) throw error

    return {
      lessons: ((data ?? []) as PreviousScoutRunRow[])
        .map((row) => {
          const similarityReasons = buildScoutLessonSimilarityReasons(
            submission,
            row,
          )

          if (row.input && similarityReasons.length === 0) return null

          return normalizePreviousScoutLesson(row, similarityReasons)
        })
        .filter((lesson): lesson is PrelaunchScoutLesson => Boolean(lesson))
        .sort(
          (first, second) =>
            (second.similarityReasons?.length ?? 0) -
            (first.similarityReasons?.length ?? 0),
        ),
      status: 'available' as const,
    }
  } catch (error) {
    console.warn('[prelaunch/scout] Lesson reuse unavailable:', error)

    return {
      lessons: [],
      status: 'unavailable' as const,
    }
  }
}

interface CollectPrelaunchScoutEvidenceOptions {
  fetchImpl?: typeof fetch
}

interface ScoutEvidenceTarget {
  label: 'TikTok' | 'Instagram' | 'Facebook'
  url: string | null
}

interface ScoutPrimaryLinkEvidenceTarget {
  label: typeof PRIMARY_CUSTOMER_LINK_LABEL
  url: string
}

interface ScoutEvidenceFetchCopy {
  fetchFailed: string
  metadataMissing: string
  nonHtmlResponse: string
  captured: string
}

function normalizeScoutEvidenceUrl(
  label: 'TikTok' | 'Instagram' | 'Facebook',
  value: string | null,
) {
  let trimmed = value?.trim()
  if (!trimmed) return null

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('@') && looksLikeSchemeLessUrl(trimmed.slice(1))) {
    trimmed = trimmed.slice(1)
  }

  if (looksLikeSchemeLessUrl(trimmed)) {
    const normalized = normalizeSchemeLessSocialUrl(label, trimmed)
    if (normalized) return normalized
  }

  if (label === 'TikTok') {
    const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
    return `https://www.tiktok.com/@${handle}`
  }

  if (label === 'Instagram') {
    const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
    return `https://www.instagram.com/${handle}/`
  }

  if (label === 'Facebook') {
    const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed
    return `https://www.facebook.com/${handle}`
  }

  return null
}

function looksLikeSchemeLessUrl(value: string) {
  return /^(?:www\.)?(?:tiktok\.com|instagram\.com|facebook\.com|fb\.com)\//i.test(
    value,
  )
}

function normalizeSchemeLessSocialUrl(
  label: 'TikTok' | 'Instagram' | 'Facebook',
  value: string,
) {
  try {
    const parsed = new URL(`https://${value}`)
    const pathname = parsed.pathname.replace(/\/+$/, '')

    if (label === 'TikTok') {
      return `https://www.tiktok.com${pathname}`
    }

    if (label === 'Instagram') {
      return `https://www.instagram.com${pathname}/`
    }

    if (label === 'Facebook') {
      return `https://www.facebook.com${pathname}`
    }
  } catch {
    return null
  }

  return null
}

function buildScoutEvidenceTargets(
  submission: PrelaunchIntakeReviewSubmission,
): ScoutEvidenceTarget[] {
  return [
    ['TikTok', submission.social.tiktok],
    ['Instagram', submission.social.instagram],
    ['Facebook', submission.social.facebook],
  ]
    .map(([label, value]) => {
      const url = normalizeScoutEvidenceUrl(
        label as 'TikTok' | 'Instagram' | 'Facebook',
        value,
      )

      return {
        label: label as 'TikTok' | 'Instagram' | 'Facebook',
        url,
      }
    })
}

function buildDefaultScoutSourceReports(
  submission: PrelaunchIntakeReviewSubmission,
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
): PrelaunchScoutEvidenceSourceReport[] {
  const capturedLabels = new Set(capturedEvidence.map((item) => item.label))

  return buildScoutEvidenceTargets(submission).map(({ label, url }) => ({
    label,
    status: url
      ? capturedLabels.has(label)
        ? 'captured'
        : 'not_checked'
      : 'not_provided',
    url,
    note: !url
      ? 'No public handle or URL was provided in the intake.'
      : capturedLabels.has(label)
        ? 'Usable public profile metadata was captured.'
        : 'Scout has not checked this source yet.',
  }))
}

function buildScoutPrimaryLinkEvidenceTargets(
  capturedEvidence: PrelaunchScoutCapturedEvidence[],
): ScoutPrimaryLinkEvidenceTarget[] {
  return dedupeStrings(
    capturedEvidence
      .map((item) => item.primaryOutboundLink)
      .filter((value): value is string => Boolean(value))
      .filter((link) => !isGenericLinkHub(link)),
  )
    .slice(0, 2)
    .map((url) => ({
      label: PRIMARY_CUSTOMER_LINK_LABEL,
      url,
    }))
}

async function inspectScoutEvidenceTarget(
  {
    label,
    url,
  }: {
    label: PrelaunchScoutEvidenceLabel
    url: string
  },
  {
    fetchImpl,
    copy,
  }: {
    fetchImpl: typeof fetch
    copy: ScoutEvidenceFetchCopy
  },
): Promise<{
  evidence: PrelaunchScoutCapturedEvidence | null
  report: PrelaunchScoutEvidenceSourceReport
}> {
  try {
    const response = await fetchImpl(url, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(4000),
    })

    const contentType = response.headers.get('content-type') ?? ''
    if (!response.ok) {
      return {
        evidence: null,
        report: {
          label,
          status: 'fetch_failed' as const,
          url,
          note: copy.fetchFailed,
        },
      }
    }

    if (!contentType.includes('text/html')) {
      return {
        evidence: null,
        report: {
          label,
          status: 'non_html_response' as const,
          url,
          note: copy.nonHtmlResponse,
        },
      }
    }

    const html = await response.text()
    const evidence = extractScoutEvidenceFromHtml(label, url, html)

    if (!evidence) {
      return {
        evidence: null,
        report: {
          label,
          status: 'metadata_missing' as const,
          url,
          note: copy.metadataMissing,
        },
      }
    }

    return {
      evidence,
      report: {
        label,
        status: 'captured' as const,
        url,
        note: copy.captured,
      },
    }
  } catch {
    return {
      evidence: null,
      report: {
        label,
        status: 'fetch_failed' as const,
        url,
        note: copy.fetchFailed,
      },
    }
  }
}

function extractHtmlMatch(html: string, pattern: RegExp) {
  const match = html.match(pattern)
  return match?.[1]?.trim() ?? null
}

function decodeHtmlEntities(value: string | null) {
  if (!value) return null

  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
}

function extractScoutEvidenceFromHtml(
  label: PrelaunchScoutEvidenceLabel,
  url: string,
  html: string,
): PrelaunchScoutCapturedEvidence | null {
  const title = decodeHtmlEntities(
    extractHtmlMatch(html, /<title[^>]*>([^<]+)<\/title>/i),
  )
  const description = decodeHtmlEntities(
    extractHtmlMatch(
      html,
      /<meta[^>]+(?:property|name)=["'](?:og:description|description)["'][^>]+content=["']([^"']+)["'][^>]*>/i,
    ),
  )
  const canonicalUrl = decodeHtmlEntities(
    extractHtmlMatch(
      html,
      /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
    ),
  )
  const normalizedTitle = title?.trim().toLowerCase()
  const hasOnlyGenericTitle =
    !description &&
    normalizedTitle != null &&
    ['tiktok', 'instagram', 'facebook'].includes(normalizedTitle)

  if ((!title && !description) || hasOnlyGenericTitle) return null

  const outboundLinks = extractScoutOutboundLinks(url, canonicalUrl, html)
  const primaryOutboundLinkAssessment =
    assessPrimaryOutboundLink(outboundLinks)

  return {
    label,
    url,
    title,
    description,
    canonicalUrl,
    outboundLinks,
    primaryOutboundLink: primaryOutboundLinkAssessment.url,
    primaryOutboundLinkReason: primaryOutboundLinkAssessment.reason,
  }
}

function extractScoutOutboundLinks(
  sourceUrl: string,
  canonicalUrl: string | null,
  html: string,
) {
  const disallowedHosts = new Set(
    [sourceUrl, canonicalUrl]
      .filter((value): value is string => Boolean(value))
      .map((value) => {
        try {
          return new URL(value).hostname.toLowerCase()
        } catch {
          return null
        }
      })
      .filter((value): value is string => Boolean(value)),
  )

  const matches = html.matchAll(/<a[^>]+href=["'](https?:\/\/[^"']+)["'][^>]*>/gi)
  const links = Array.from(matches, (match) => decodeHtmlEntities(match[1]))
    .filter((value): value is string => Boolean(value))
    .filter((value) => {
      try {
        const parsed = new URL(value)
        return !disallowedHosts.has(parsed.hostname.toLowerCase())
      } catch {
        return false
      }
    })

  return dedupeStrings(links).slice(0, 3)
}

function assessPrimaryOutboundLink(outboundLinks: string[]) {
  if (outboundLinks.length === 0) {
    return {
      url: null,
      reason: null,
    }
  }

  const directLink = outboundLinks.find((link) => !isGenericLinkHub(link))
  if (directLink) {
    return {
      url: directLink,
      reason:
        'Direct brand or shop links are more likely the real customer action than a generic link hub.',
    }
  }

  return {
    url: outboundLinks[0],
    reason:
      'Only a generic link hub was visible publicly, so that is the current likely customer path.',
  }
}

function isGenericLinkHub(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase()
    return [
      'linktr.ee',
      'beacons.ai',
      'bio.site',
      'stan.store',
      'lnk.bio',
      'hoo.be',
      'linkin.bio',
      'taplink.cc',
    ].some((domain) => hostname === domain || hostname.endsWith(`.${domain}`))
  } catch {
    return false
  }
}

export async function collectPrelaunchScoutEvidence(
  submission: PrelaunchIntakeReviewSubmission,
  { fetchImpl = fetch }: CollectPrelaunchScoutEvidenceOptions = {},
) {
  const result = await inspectPrelaunchScoutEvidenceSources(submission, {
    fetchImpl,
  })

  return result.capturedEvidence
}

export async function inspectPrelaunchScoutEvidenceSources(
  submission: PrelaunchIntakeReviewSubmission,
  { fetchImpl = fetch }: CollectPrelaunchScoutEvidenceOptions = {},
) {
  const targets = buildScoutEvidenceTargets(submission)
  const socialEvidenceCopy = {
    fetchFailed: 'Scout could not fetch the public page metadata.',
    metadataMissing:
      'Scout reached the public page but did not find usable title or description metadata.',
    nonHtmlResponse: 'Scout fetched the URL but it did not return an HTML page.',
    captured: 'Usable public profile metadata was captured.',
  }
  const customerLinkEvidenceCopy = {
    fetchFailed: 'Scout could not fetch the public customer-link metadata.',
    metadataMissing:
      'Scout reached the public customer link but did not find usable title or description metadata.',
    nonHtmlResponse:
      'Scout fetched the public customer link, but it did not return an HTML page.',
    captured: 'Usable public customer-link metadata was captured.',
  }

  const results = await Promise.all(
    targets.map(async ({ label, url }) => {
      if (!url) {
        return {
          evidence: null,
          report: {
            label,
            status: 'not_provided' as const,
            url: null,
            note: 'No public handle or URL was provided in the intake.',
          },
        }
      }

      return inspectScoutEvidenceTarget(
        { label, url },
        { fetchImpl, copy: socialEvidenceCopy },
      )
    }),
  )
  const capturedSocialEvidence = results
    .map((result) => result.evidence)
    .filter(
      (result): result is PrelaunchScoutCapturedEvidence => Boolean(result),
    )
  const primaryLinkTargets =
    buildScoutPrimaryLinkEvidenceTargets(capturedSocialEvidence)
  const primaryLinkResults = await Promise.all(
    primaryLinkTargets.map(({ label, url }) =>
      inspectScoutEvidenceTarget(
        { label, url },
        { fetchImpl, copy: customerLinkEvidenceCopy },
      ),
    ),
  )

  return {
    capturedEvidence: [
      ...capturedSocialEvidence,
      ...primaryLinkResults
        .map((result) => result.evidence)
        .filter(
          (result): result is PrelaunchScoutCapturedEvidence => Boolean(result),
        ),
    ],
    sourceReports: [
      ...results.map((result) => result.report),
      ...primaryLinkResults.map((result) => result.report),
    ],
  }
}

export async function runPrelaunchScoutForIntake({
  admin = createAdminClient(),
  fetchImpl = fetch,
  generateTextImpl,
  intakeId,
  operatorRepId = null,
  now = new Date(),
  triggerSource = 'operator_review',
}: RunPrelaunchScoutOptions) {
  const submission = await loadSubmissionById(admin, intakeId)
  const scoutInput = buildPrelaunchScoutInput(submission)
  const reusedLessonLookup = await loadRecentScoutLessons(admin, submission)
  const reusedLessons = reusedLessonLookup.lessons
  const { capturedEvidence, sourceReports } =
    await inspectPrelaunchScoutEvidenceSources(submission, {
      fetchImpl,
    })
  const researchSynthesis = await synthesizePrelaunchScoutEvidence(
    submission,
    capturedEvidence,
    { generateTextImpl },
  )
  const output = buildPrelaunchScoutOutput(
    submission,
    reusedLessons,
    capturedEvidence,
    researchSynthesis,
    sourceReports,
  )
  const timestamp = now.toISOString()
  const runKey = `scout:${intakeId}:${timestamp}`

  const { error: runError } = await admin.from('agent_runs').insert({
    run_key: runKey,
    agent_name: 'Scout',
    agent_kind: 'pre_meeting_intel',
    subject_type: 'prelaunch_intake',
    subject_id: intakeId,
    rep_id: operatorRepId,
    intake_submission_id: intakeId,
    waitlist_id: submission.waitlistId,
    status: 'completed',
    trigger_source: triggerSource,
    model:
      researchSynthesis.status === 'model_generated'
        ? 'claude-haiku-4-5-20251001'
        : 'deterministic_scout_v1',
    summary: output.summary,
    input: scoutInput,
    output,
    metadata: {
      source: 'prelaunch_intake_review',
      recommended_next_step: output.recommendedNextStep,
      research_plan_status: output.researchPlan.status,
      public_funnel_shape: output.publicFunnel.shape,
      captured_evidence_count: capturedEvidence.length,
      evidence_source_statuses: sourceReports.map(({ label, status, url }) => ({
        label,
        status,
        url,
      })),
      synthesis_status: researchSynthesis.status,
      reused_lesson_count: reusedLessons.length,
      reused_lesson_status: reusedLessonLookup.status,
      trigger_source: triggerSource,
    },
    started_at: timestamp,
    finished_at: timestamp,
  })

  if (runError) throw runError

  const { error: updateError } = await admin
    .from('sparkle_suite_intake_submissions')
    .update({
      scout_input_status: 'generated',
      scout_input: scoutInput,
      scout_input_generated_at: timestamp,
      handoff_status: 'scout_ready',
    })
    .eq('id', intakeId)

  if (updateError) throw updateError

  return {
    runKey,
    output,
  }
}
