import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'

import { publishWorkspaceMessage } from '@/lib/services/workspace-messages'
import type { OperatorSupportSession } from './types'

function safeReason(session: OperatorSupportSession) {
  const labels: Record<OperatorSupportSession['reasonCode'], string> = {
    account_setup: 'account setup help',
    troubleshooting: 'troubleshooting',
    support_request: 'a support request',
    content_update: 'a customer-site update',
    other: 'customer support',
  }
  return labels[session.reasonCode]
}

function safeEndReason(session: OperatorSupportSession) {
  const labels: Partial<Record<NonNullable<OperatorSupportSession['endedReason']>, string>> = {
    operator: 'ended by Sparkle Suite Support',
    expired: 'ended automatically when the support window expired',
    revoked: 'revoked by Sparkle Suite',
    control_center_logout: 'ended when Control Center access closed',
    target_ineligible: 'ended because the Workspace was no longer eligible',
    failure: 'closed safely after a support-system error',
  }
  return session.endedReason ? labels[session.endedReason] ?? 'ended' : 'ended'
}

function formatEasternTimestamp(value: string | null) {
  if (!value) return 'at an unrecorded time'
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return 'at an unrecorded time'
  return `on ${new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: 'America/New_York',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(date)}`
}

export async function publishOperatorSupportStartNotice(
  supabase: SupabaseClient,
  session: OperatorSupportSession,
) {
  const publication = await publishWorkspaceMessage(supabase, {
    senderKey: 'support_access_notifier',
    title: `${session.operatorDisplayNameSnapshot} opened support access`,
    summary: `Sparkle Suite Support entered your Workspace for ${safeReason(session)}.`,
    body: `${session.operatorDisplayNameSnapshot} opened a support session to help with ${safeReason(session)}. The session stays active until Sparkle Suite Support ends it. Every access and change is logged. Billing, payments, passwords, account security, ownership, and outbound communications are unavailable in support mode.`,
    category: 'account_activity',
    priority: 'normal',
    actionLabel: 'View access details',
    actionUrl: `/nic-nac?section=account&panel=support-access&session=${encodeURIComponent(session.id)}`,
    audience: { kind: 'selected', repIds: [session.targetRepId] },
    expectedRecipientCount: 1,
    expectedRecipientIds: [session.targetRepId],
    idempotencyKey: `support-access-start:${session.id}`,
    sourceType: 'operator_support_session',
    sourceId: session.id,
  })
  if (
    publication.status !== 'published' ||
    publication.audienceCount !== 1 ||
    publication.deliveryCount !== 1
  ) {
    throw new Error('The rep support-access notice could not be verified.')
  }
  return publication
}

export async function publishOperatorSupportEndNotice(
  supabase: SupabaseClient,
  session: OperatorSupportSession,
  changedAnything: boolean,
) {
  const completionNote = session.completionSummary?.trim()
  const endDetails = `The session ${safeEndReason(session)} ${formatEasternTimestamp(session.endedAt)}.`
  const completionDetails = completionNote
    ? ` Support note: ${completionNote}`
    : ''
  const publication = await publishWorkspaceMessage(supabase, {
    senderKey: 'support_access_notifier',
    title: `${session.operatorDisplayNameSnapshot} ended support access`,
    summary: changedAnything
      ? 'Support access ended after work was completed in your account.'
      : 'Support access ended without a reported account change.',
    body: changedAnything
      ? `${session.operatorDisplayNameSnapshot} ended the support session. ${endDetails} Work performed during the session is recorded in Sparkle Suite's support audit history.${completionDetails}`
      : `${session.operatorDisplayNameSnapshot} ended the support session without a reported account change. ${endDetails} The access is still recorded in Sparkle Suite's support audit history.${completionDetails}`,
    category: 'account_activity',
    priority: 'normal',
    actionLabel: 'View access details',
    actionUrl: `/nic-nac?section=account&panel=support-access&session=${encodeURIComponent(session.id)}`,
    audience: { kind: 'selected', repIds: [session.targetRepId] },
    expectedRecipientCount: 1,
    expectedRecipientIds: [session.targetRepId],
    idempotencyKey: `support-access-end:${session.id}`,
    sourceType: 'operator_support_session',
    sourceId: session.id,
  })
  if (
    publication.status !== 'published' ||
    publication.audienceCount !== 1 ||
    publication.deliveryCount !== 1
  ) {
    throw new Error('The support completion notice could not be verified.')
  }
  return publication
}
