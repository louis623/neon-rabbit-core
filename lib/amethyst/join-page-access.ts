import { resolveAmethystPreviewRep } from './preview-rep'
import type { AmethystRequestTarget } from './request-rep-target'
import { getTargetedJoinPageAccessFlags } from '@/lib/services/site-settings'
import { createAdminClient } from '@/lib/supabase/admin'

type JoinPageAccessDependencies = {
  createAdminClient?: typeof createAdminClient
  resolveAmethystPreviewRep?: typeof resolveAmethystPreviewRep
  getTargetedJoinPageAccessFlags?: typeof getTargetedJoinPageAccessFlags
}

/**
 * Public Join content is opt-in. Any targeted request that cannot prove both
 * the operator entitlement and the rep visibility setting fails closed.
 */
export async function canServeTargetedAmethystJoinPage(
  target: AmethystRequestTarget,
  dependencies: JoinPageAccessDependencies = {},
) {
  if (!target.targeted) return true

  try {
    const admin = (dependencies.createAdminClient ?? createAdminClient)()
    const rep = await (dependencies.resolveAmethystPreviewRep ??
      resolveAmethystPreviewRep)(admin, {
      // An explicit rep/domain target must win over a path-derived slug. On a
      // rewritten custom-domain `/join` request, the visible path can be
      // interpreted as the slug `join`, even though `c` already carries the
      // verified tenant domain.
      publicSiteSlug: target.repId ? null : target.publicSiteSlug,
      repId: target.repId ?? target.customDomain,
      select: 'id, email',
      strict: true,
    })
    if (!rep) return false

    const settings = await (dependencies.getTargetedJoinPageAccessFlags ??
      getTargetedJoinPageAccessFlags)(admin, rep.id)
    return (
      settings.joinTeamAccessEnabled === true && settings.showJoinPage === true
    )
  } catch {
    return false
  }
}
