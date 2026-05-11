import { createAdminClient } from '@/lib/supabase/admin'
import { errors } from './errors'

type MessageChannel = 'sms' | 'email'

const PROHIBITED_PHRASES = [
  'financial freedom',
  'passive income',
  'residual income',
  'unlimited earning potential',
  'unlimited income potential',
  'be your own boss',
  'ground floor opportunity',
  'this business sells itself',
  'quit your 9 to 5',
  'luxury lifestyle',
] as const

export const SCREENING_BLOCK_REASON =
  'Blocked for prohibited recruiting language from Legal Sprint L2.'

export interface MessageScreeningResult {
  status: 'passed' | 'blocked' | 'skipped'
  matchedPhrases: string[]
  reason: string | null
}

export interface AssertMessageContentAllowedInput {
  repId: string
  channel: MessageChannel
  recipient: string
  text: string
  contentPreview: string
  isAutomated?: boolean
  automationKey?: string
}

function normalizeForMatch(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function buildBlockedScreeningNotes(matchedPhrases: string[]) {
  return `${SCREENING_BLOCK_REASON} Matched phrases: ${matchedPhrases.join(', ')}.`
}

function buildPassedScreeningNotes() {
  return 'Passed FTC prohibited phrase screening.'
}

async function recordBlockedMessageAttempt(input: {
  repId: string
  channel: MessageChannel
  recipient: string
  contentPreview: string
  isAutomated?: boolean
  automationKey?: string
  screeningNotes: string
}) {
  try {
    const admin = createAdminClient()
    await admin
      .from('message_log')
      .insert({
        rep_id: input.repId,
        channel: input.channel,
        recipient: input.recipient,
        content_preview: input.contentPreview,
        screening_result: 'blocked',
        screening_notes: input.screeningNotes,
        delivery_status: 'failed',
        is_automated: input.isAutomated ?? false,
        automation_key: input.automationKey?.trim() || null,
      })
      .select('id')
      .single()
  } catch (error) {
    console.error('[screening] failed to record blocked message attempt', {
      repId: input.repId,
      channel: input.channel,
      error,
    })
  }
}

export function getMessageScreeningResult(input: {
  channel: MessageChannel
  text: string
  isAutomated?: boolean
}): MessageScreeningResult {
  if (input.isAutomated) {
    return {
      status: 'skipped',
      matchedPhrases: [],
      reason: null,
    }
  }

  const normalizedText = normalizeForMatch(input.text)
  const matchedPhrases = PROHIBITED_PHRASES.filter((phrase) =>
    normalizedText.includes(normalizeForMatch(phrase)),
  )

  if (matchedPhrases.length > 0) {
    return {
      status: 'blocked',
      matchedPhrases: [...matchedPhrases],
      reason: SCREENING_BLOCK_REASON,
    }
  }

  return {
    status: 'passed',
    matchedPhrases: [],
    reason: null,
  }
}

export async function assertMessageContentAllowed(
  input: AssertMessageContentAllowedInput,
): Promise<{ screeningResult: 'passed' | null; screeningNotes: string | null }> {
  const result = getMessageScreeningResult({
    channel: input.channel,
    text: input.text,
    isAutomated: input.isAutomated,
  })

  if (result.status === 'blocked') {
    const screeningNotes = buildBlockedScreeningNotes(result.matchedPhrases)
    await recordBlockedMessageAttempt({
      repId: input.repId,
      channel: input.channel,
      recipient: input.recipient,
      contentPreview: input.contentPreview,
      isAutomated: input.isAutomated,
      automationKey: input.automationKey,
      screeningNotes,
    })
    throw errors.CONTENT_SCREENING_BLOCKED(result.matchedPhrases)
  }

  if (result.status === 'passed') {
    return {
      screeningResult: 'passed',
      screeningNotes: buildPassedScreeningNotes(),
    }
  }

  return {
    screeningResult: null,
    screeningNotes: null,
  }
}
