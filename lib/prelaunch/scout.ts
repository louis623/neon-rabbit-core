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

export type PrelaunchScoutPriority = 'high' | 'medium' | 'low'

export interface PrelaunchScoutResearchTarget {
  label: string
  value: string
  priority: PrelaunchScoutPriority
}

export interface PrelaunchScoutResearchPlan {
  status: 'manual_research_required'
  searchQueries: string[]
  evidenceChecklist: string[]
  blockers: string[]
}

export interface PrelaunchScoutLesson {
  sourceRunKey: string
  lesson: string
}

export interface PrelaunchScoutOutput {
  briefTitle: string
  summary: string
  recommendedNextStep: 'book_discovery_call' | 'operator_review_first'
  researchTargets: PrelaunchScoutResearchTarget[]
  researchPlan: PrelaunchScoutResearchPlan
  setupRisks: string[]
  suggestedQuestions: string[]
  reusedLessons: PrelaunchScoutLesson[]
  generatedBy: 'deterministic_scout_v1'
}

export interface RunPrelaunchScoutOptions {
  admin?: AdminClient
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
): PrelaunchScoutResearchPlan {
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

export function buildPrelaunchScoutOutput(
  submission: PrelaunchIntakeReviewSubmission,
  reusedLessons: PrelaunchScoutLesson[] = [],
): PrelaunchScoutOutput {
  const recommendedNextStep =
    submission.prequalificationStatus === 'needs_review' ||
    submission.fitFlags.length > 0
      ? 'operator_review_first'
      : 'book_discovery_call'

  return {
    briefTitle: `Scout brief: ${submission.businessName}`,
    summary:
      `${submission.businessName} is a ${submission.primaryPlatform} prospect ` +
      `streaming ${submission.streamingFrequency}. Intake goal: ${submission.setupGoal}. ` +
      'External social research is not connected yet, so this first Scout pass flags what Louis should verify manually.',
    recommendedNextStep,
    researchTargets: buildResearchTargets(submission),
    researchPlan: buildResearchPlan(submission),
    setupRisks: buildSetupRisks(submission),
    suggestedQuestions: appendLessonReuseQuestion(
      buildSuggestedQuestions(submission),
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
}

function normalizePreviousScoutLesson(
  row: PreviousScoutRunRow,
): PrelaunchScoutLesson | null {
  const summary = row.summary?.trim()
  if (summary) {
    return {
      sourceRunKey: row.run_key,
      lesson: summary,
    }
  }

  const firstRisk = Array.isArray(row.output?.setupRisks)
    ? row.output.setupRisks.find((risk) => typeof risk === 'string')
    : null

  if (!firstRisk) return null

  return {
    sourceRunKey: row.run_key,
    lesson: firstRisk,
  }
}

async function loadRecentScoutLessons(admin: AdminClient, intakeId: string) {
  const { data, error } = await admin
    .from('agent_runs')
    .select('run_key, summary, output')
    .eq('agent_name', 'Scout')
    .eq('status', 'completed')
    .neq('intake_submission_id', intakeId)
    .order('created_at', { ascending: false })
    .limit(5)

  if (error) throw error

  return ((data ?? []) as PreviousScoutRunRow[])
    .map(normalizePreviousScoutLesson)
    .filter((lesson): lesson is PrelaunchScoutLesson => Boolean(lesson))
}

export async function runPrelaunchScoutForIntake({
  admin = createAdminClient(),
  intakeId,
  operatorRepId = null,
  now = new Date(),
  triggerSource = 'operator_review',
}: RunPrelaunchScoutOptions) {
  const submission = await loadSubmissionById(admin, intakeId)
  const scoutInput = buildPrelaunchScoutInput(submission)
  const reusedLessons = await loadRecentScoutLessons(admin, intakeId)
  const output = buildPrelaunchScoutOutput(submission, reusedLessons)
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
    model: 'deterministic_scout_v1',
    summary: output.summary,
    input: scoutInput,
    output,
    metadata: {
      source: 'prelaunch_intake_review',
      recommended_next_step: output.recommendedNextStep,
      research_plan_status: output.researchPlan.status,
      reused_lesson_count: reusedLessons.length,
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
