import { getAmethystCustomDomainCandidates } from './host-routing'
import { PAID_WORKSPACE_STATUSES } from '@/lib/nic-nac/subscription-access'

export const DEFAULT_AMETHYST_PREVIEW_EMAIL = 'testrep@neonrabbit.net'

interface AmethystPreviewRep {
  id: string
  email: string
  shop_link?: string | null
  streaming_links?: unknown
}

interface ResolveAmethystPreviewRepOptions {
  env?: Record<string, string | undefined>
  repId?: string | null
  select?: string
}

type PreviewAdminClient = {
  from(table: string): {
    select(columns: string): unknown
  }
}

function cleanEmail(value: string | undefined) {
  return value?.trim().toLowerCase() || null
}

function getCandidateEmails(env: Record<string, string | undefined>) {
  return [
    cleanEmail(env.AMETHYST_HOMEPAGE_PREVIEW_EMAIL),
    cleanEmail(env.AMETHYST_TRADE_PREVIEW_EMAIL),
    cleanEmail(env.DEMO_REP_EMAIL),
  ].filter((value): value is string => Boolean(value))
}

async function loadRepByEmail(
  admin: PreviewAdminClient,
  email: string,
  select: string,
): Promise<AmethystPreviewRep | null> {
  const query = admin.from('reps').select(select) as {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: AmethystPreviewRep | null; error: unknown }>
    }
  }
  const { data, error } = await query.eq('email', email).maybeSingle()
  if (error) throw error
  return data ?? null
}

async function loadRepById(
  admin: PreviewAdminClient,
  repId: string,
  select: string,
): Promise<AmethystPreviewRep | null> {
  const query = admin.from('reps').select(select) as {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: AmethystPreviewRep | null; error: unknown }>
    }
  }
  const { data, error } = await query.eq('id', repId).maybeSingle()
  if (error) throw error
  return data ?? null
}

async function loadRepByCustomDomain(
  admin: PreviewAdminClient,
  customDomain: string,
  select: string,
): Promise<AmethystPreviewRep | null> {
  const query = admin.from('reps').select(select) as {
    eq(column: string, value: string): {
      maybeSingle(): Promise<{ data: AmethystPreviewRep | null; error: unknown }>
    }
  }
  const { data, error } = await query.eq('custom_domain', customDomain).maybeSingle()
  if (error) throw error
  return data ?? null
}

async function loadLatestReadyLaunchRepId(admin: PreviewAdminClient) {
  const query = admin.from('sparkle_suite_launch_builds').select('rep_id') as {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        not(column: string, operator: string, value: null): {
          order(
            column: string,
            options: { ascending: boolean },
          ): {
            limit(count: number): {
              maybeSingle(): Promise<{
                data: { rep_id: string | null } | null
                error: unknown
              }>
            }
          }
        }
      }
    }
  }
  const { data, error } = await query
    .eq('stage', 'ready_for_launch')
    .eq('status', 'ready')
    .not('rep_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.rep_id?.trim() || null
}

async function hasPaidPublicCustomerSiteAccess(
  admin: PreviewAdminClient,
  repId: string,
) {
  const query = admin.from('subscriptions').select('id, status') as {
    eq(column: string, value: string): {
      in(column: string, value: string[]): {
        order(
          column: string,
          options: { ascending: boolean },
        ): {
          limit(count: number): {
            maybeSingle(): Promise<{
              data: { id: string; status: string } | null
              error: unknown
            }>
          }
        }
      }
    }
  }

  const { data, error } = await query
    .eq('rep_id', repId)
    .in('status', [...PAID_WORKSPACE_STATUSES])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function hasReadyLaunchBuild(admin: PreviewAdminClient, repId: string) {
  const query = admin.from('sparkle_suite_launch_builds').select('id') as {
    eq(column: string, value: string): {
      eq(column: string, value: string): {
        eq(column: string, value: string): {
          order(
            column: string,
            options: { ascending: boolean },
          ): {
            limit(count: number): {
              maybeSingle(): Promise<{
                data: { id: string } | null
                error: unknown
              }>
            }
          }
        }
      }
    }
  }

  const { data, error } = await query
    .eq('rep_id', repId)
    .eq('stage', 'ready_for_launch')
    .eq('status', 'ready')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return Boolean(data)
}

async function canServePublicCustomerSite(
  admin: PreviewAdminClient,
  repId: string,
) {
  return (
    (await hasPaidPublicCustomerSiteAccess(admin, repId)) ||
    (await hasReadyLaunchBuild(admin, repId))
  )
}

export async function resolveAmethystPreviewRep(
  admin: PreviewAdminClient,
  options: ResolveAmethystPreviewRepOptions = {},
): Promise<AmethystPreviewRep | null> {
  const env = options.env ?? process.env
  const select = options.select ?? 'id, email'
  const repId = options.repId?.trim()

  if (repId) {
    const rep = await loadRepById(admin, repId, select)
    if (rep) return (await canServePublicCustomerSite(admin, rep.id)) ? rep : null

    for (const customDomain of getAmethystCustomDomainCandidates(repId)) {
      const customDomainRep = await loadRepByCustomDomain(admin, customDomain, select)
      if (customDomainRep) {
        return (await canServePublicCustomerSite(admin, customDomainRep.id))
          ? customDomainRep
          : null
      }
    }
  }

  for (const email of getCandidateEmails(env)) {
    const rep = await loadRepByEmail(admin, email, select)
    if (rep) return rep
  }

  let launchRepId: string | null = null
  try {
    launchRepId = await loadLatestReadyLaunchRepId(admin)
  } catch {
    launchRepId = null
  }

  if (launchRepId) {
    const rep = await loadRepById(admin, launchRepId, select)
    if (rep) return rep
  }

  return loadRepByEmail(admin, DEFAULT_AMETHYST_PREVIEW_EMAIL, select)
}
