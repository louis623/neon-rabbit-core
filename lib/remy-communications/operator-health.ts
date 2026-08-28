import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type CountResult = {
  count: number | null
  error: unknown
}

function countOf(result: CountResult) {
  if (result.error) throw result.error
  return result.count ?? 0
}

export function buildOperatorHealthSnapshot(input: {
  generatedAt: string
  supportLast24Hours: number
  supportPrevious24Hours: number
  urgentOpenSupport: number
  failedSupportNotifications: number
  failedSupportAudits: number
  failedAgentRunsLast24Hours: number
  failedMessageJobs: number
  staleMessageJobs: number
  failedBroadcasts: number
  reportedNetworkSafety: number
  activeMessagingSuspensions: number
}) {
  const supportVolumeSpike =
    input.supportLast24Hours >= 5 &&
    input.supportLast24Hours >= Math.max(1, input.supportPrevious24Hours) * 2
  const errorCount =
    input.failedSupportNotifications +
    input.failedSupportAudits +
    input.failedAgentRunsLast24Hours +
    input.failedMessageJobs +
    input.staleMessageJobs +
    input.failedBroadcasts
  const behaviorFlagCount =
    input.reportedNetworkSafety + input.activeMessagingSuspensions

  return {
    generatedAt: input.generatedAt,
    status:
      errorCount > 0 || behaviorFlagCount > 0 || supportVolumeSpike
        ? ('attention' as const)
        : ('clear' as const),
    support: {
      createdLast24Hours: input.supportLast24Hours,
      createdPrevious24Hours: input.supportPrevious24Hours,
      volumeSpikeDetected: supportVolumeSpike,
      urgentOpenCount: input.urgentOpenSupport,
      failedNotificationCount: input.failedSupportNotifications,
      failedOrTimedOutAuditCount: input.failedSupportAudits,
    },
    jobsAndSystems: {
      failedAgentRunCountLast24Hours: input.failedAgentRunsLast24Hours,
      failedMessageJobCount: input.failedMessageJobs,
      staleMessageJobCount: input.staleMessageJobs,
      failedBroadcastCount: input.failedBroadcasts,
    },
    safety: {
      reportedNetworkSafetyCount: input.reportedNetworkSafety,
      activeMessagingSuspensionCount: input.activeMessagingSuspensions,
    },
    redFlagCount: errorCount + behaviorFlagCount + (supportVolumeSpike ? 1 : 0),
    notice:
      'Read-only operator signals. Counts do not expose private Rep Network conversations, attachments, billing, or customer profile data. A human must review and approve any response or fix.',
  }
}

export async function getControlCenterOperatorHealth(
  supabase: SupabaseClient,
  now = new Date(),
) {
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1_000)
  const previous24Hours = new Date(now.getTime() - 48 * 60 * 60 * 1_000)
  const staleMessageCutoff = new Date(now.getTime() - 15 * 60 * 1_000)

  const results = await Promise.all([
    supabase
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', last24Hours.toISOString()),
    supabase
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', previous24Hours.toISOString())
      .lt('created_at', last24Hours.toISOString()),
    supabase
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing'])
      .in('urgency', ['blocking', 'showtime_urgent']),
    supabase
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .eq('notification_status', 'failed'),
    supabase
      .from('support_reports')
      .select('id', { count: 'exact', head: true })
      .in('audit_status', ['failed', 'timed_out']),
    supabase
      .from('agent_runs')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', last24Hours.toISOString()),
    supabase
      .from('workspace_message_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('workspace_message_outbox')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'processing')
      .lt('claimed_at', staleMessageCutoff.toISOString()),
    supabase
      .from('workspace_message_publications')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'failed'),
    supabase
      .from('workspace_conversation_reports')
      .select('id', { count: 'exact', head: true })
      .in('status', ['open', 'reviewing']),
    supabase
      .from('workspace_rep_messaging_suspensions')
      .select('rep_id', { count: 'exact', head: true })
      .is('lifted_at', null),
  ])

  return buildOperatorHealthSnapshot({
    generatedAt: now.toISOString(),
    supportLast24Hours: countOf(results[0]),
    supportPrevious24Hours: countOf(results[1]),
    urgentOpenSupport: countOf(results[2]),
    failedSupportNotifications: countOf(results[3]),
    failedSupportAudits: countOf(results[4]),
    failedAgentRunsLast24Hours: countOf(results[5]),
    failedMessageJobs: countOf(results[6]),
    staleMessageJobs: countOf(results[7]),
    failedBroadcasts: countOf(results[8]),
    reportedNetworkSafety: countOf(results[9]),
    activeMessagingSuspensions: countOf(results[10]),
  })
}
