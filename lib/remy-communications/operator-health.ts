import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'

type CountResult = {
  count: number | null
  error: unknown
}

export type ProductionEndpointHealth = {
  url: string
  answered: boolean
  healthy: boolean
  statusCode: number | null
  fiveXx: boolean
  checkedAt: string
  responseTimeMs: number | null
}

type ProductionHealthInput = {
  suite: ProductionEndpointHealth
  finder: ProductionEndpointHealth
}

const SUITE_PRODUCTION_URL = 'https://www.yoursparklesuite.com'
const FINDER_PRODUCTION_URL = 'https://yoursparklefinder.com'

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
  production?: ProductionHealthInput
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
  const productionFlagCount = input.production
    ? [input.production.suite, input.production.finder].filter(
        (product) => !product.healthy,
      ).length
    : 0

  return {
    generatedAt: input.generatedAt,
    status:
      errorCount > 0 ||
      behaviorFlagCount > 0 ||
      productionFlagCount > 0 ||
      supportVolumeSpike
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
    production: {
      suite: input.production
        ? { ...input.production.suite, failedDeploymentCount: null }
        : null,
      finder: input.production
        ? { ...input.production.finder, failedDeploymentCount: null }
        : null,
      failedDeploymentCount: null,
      failedDeploymentSource: null,
    },
    productCounts: {
      suite: {
        supportCreatedLast24Hours: input.supportLast24Hours,
        urgentOpenSupportCount: input.urgentOpenSupport,
        failedAgentRunCountLast24Hours: input.failedAgentRunsLast24Hours,
        reportedNetworkSafetyCount: input.reportedNetworkSafety,
      },
      finder: {
        supportCreatedLast24Hours: null,
        urgentOpenSupportCount: null,
        failedAgentRunCountLast24Hours: null,
        reportedNetworkSafetyCount: null,
      },
    },
    coverageHoles: [
      'Failed deployment history is not available to this read model; no Vercel credential or new monitoring vendor is used.',
      'Finder operator counts live behind Finder\'s separate data boundary and are not available in the Suite Control Center database.',
    ],
    redFlagCount:
      errorCount +
      behaviorFlagCount +
      productionFlagCount +
      (supportVolumeSpike ? 1 : 0),
    notice:
      'Read-only operator signals. Counts do not expose private Rep Network conversations, attachments, billing, or customer profile data. A human must review and approve any response or fix.',
  }
}

export async function probeProductionEndpoint(
  url: string,
  now = new Date(),
): Promise<ProductionEndpointHealth> {
  const startedAt = Date.now()

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(5_000),
    })
    return {
      url,
      answered: true,
      healthy: response.ok,
      statusCode: response.status,
      fiveXx: response.status >= 500,
      checkedAt: now.toISOString(),
      responseTimeMs: Math.max(0, Date.now() - startedAt),
    }
  } catch {
    return {
      url,
      answered: false,
      healthy: false,
      statusCode: null,
      fiveXx: false,
      checkedAt: now.toISOString(),
      responseTimeMs: null,
    }
  }
}

export async function getControlCenterOperatorHealth(
  supabase: SupabaseClient,
  now = new Date(),
  probe: (url: string, now?: Date) => Promise<ProductionEndpointHealth> =
    probeProductionEndpoint,
) {
  const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1_000)
  const previous24Hours = new Date(now.getTime() - 48 * 60 * 60 * 1_000)
  const staleMessageCutoff = new Date(now.getTime() - 15 * 60 * 1_000)

  const [results, production] = await Promise.all([
    Promise.all([
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
    ]),
    Promise.all([
      probe(SUITE_PRODUCTION_URL, now),
      probe(FINDER_PRODUCTION_URL, now),
    ]),
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
    production: {
      suite: production[0],
      finder: production[1],
    },
  })
}
