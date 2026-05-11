import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  SiteAnalyticsDashboardResult,
  SiteAnalyticsOperationalSnapshot,
} from '@/lib/services/types'

async function countRows(
  supabase: SupabaseClient,
  table: string,
  filters: Array<[string, unknown]>,
) {
  let query = supabase.from(table).select('id', { head: true, count: 'exact' })
  for (const [column, value] of filters) {
    query = query.eq(column, value)
  }
  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

async function getOperationalSnapshot(
  supabase: SupabaseClient,
  repId: string,
): Promise<SiteAnalyticsOperationalSnapshot> {
  const [activeListings, pendingRequests, upcomingShows, reachableCustomers] =
    await Promise.all([
      countRows(supabase, 'trade_listings', [
        ['rep_id', repId],
        ['status', 'available'],
      ]),
      supabase
        .from('trade_requests')
        .select('id, listing:trade_listings!inner(rep_id)', { count: 'exact' })
        .eq('status', 'pending')
        .eq('listing.rep_id', repId)
        .then(({ count, error }) => {
          if (error) throw error
          return count ?? 0
        }),
      supabase
        .from('calendar_events')
        .select('id', { head: true, count: 'exact' })
        .eq('rep_id', repId)
        .eq('status', 'scheduled')
        .gt('event_time', new Date().toISOString())
        .then(({ count, error }) => {
          if (error) throw error
          return count ?? 0
        }),
      supabase
        .from('customer_audience')
        .select('id', { head: true, count: 'exact' })
        .eq('rep_id', repId)
        .or(
          'and(sms_consent.eq.true,sms_opted_out_at.is.null,stop_keyword_received_at.is.null),and(email_consent.eq.true,email_opted_out_at.is.null)',
        )
        .then(({ count, error }) => {
          if (error) throw error
          return count ?? 0
        }),
    ])

  return {
    activeListings,
    pendingRequests,
    upcomingShows,
    reachableCustomers,
  }
}

export async function getSiteAnalyticsDashboard(args: {
  supabase: SupabaseClient
  repId: string
}): Promise<SiteAnalyticsDashboardResult> {
  const configured = Boolean(
    process.env.NEXT_PUBLIC_POSTHOG_KEY && process.env.NEXT_PUBLIC_POSTHOG_HOST,
  )

  return {
    configured,
    privacy: {
      disablesIpCapture: true,
      masksSensitiveInputs: true,
      identifiesAfterLoginOnly: true,
    },
    overview: {
      pageViews30d: null,
      uniqueVisitors30d: null,
      topTrafficSource: null,
      topDeviceType: null,
    },
    topPages: [],
    trafficSources: [],
    deviceMix: [],
    operationalSnapshot: await getOperationalSnapshot(args.supabase, args.repId),
  }
}
