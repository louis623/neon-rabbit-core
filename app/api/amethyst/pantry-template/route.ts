import { NextResponse } from 'next/server'

import {
  applyPublicSiteSlugToPantryTemplateData,
  buildBlingKitchenPantryTemplateData,
  buildAmethystPantryBootstrapScript,
  defaultAmethystPantryTemplateData,
  mapPublicSiteRecipeToPantryRecipe,
} from '@/lib/amethyst/pantry-template-data'
import { resolveAmethystPreviewRep } from '@/lib/amethyst/preview-rep'
import { resolveAmethystRequestTarget } from '@/lib/amethyst/request-rep-target'
import { BLING_KITCHEN_PROFILE } from '@/lib/bling-kitchen/profile'
import { getPublicSiteRecipes } from '@/lib/services/site-recipes'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function isBlingKitchenTarget(
  publicSiteSlug: string | null,
  email: string | null | undefined,
) {
  const slug = publicSiteSlug?.trim().toLowerCase()
  const normalizedEmail = email?.trim().toLowerCase()
  return (
    slug === BLING_KITCHEN_PROFILE.publicSiteSlug ||
    normalizedEmail === BLING_KITCHEN_PROFILE.email
  )
}

export async function GET(request: Request) {
  const target = resolveAmethystRequestTarget(request)
  const rawRepId = target.repId ?? target.customDomain
  const targeted = target.targeted
  const publicSiteSlug = target.publicSiteSlug
  let repId = rawRepId
  let repEmail: string | null = null
  let baseTemplateData = defaultAmethystPantryTemplateData

  try {
    const admin = createAdminClient()
    const rep = await resolveAmethystPreviewRep(admin, {
      ...(publicSiteSlug ? { publicSiteSlug } : {}),
      repId: rawRepId,
      select: 'id, email',
    })

    if (rep) {
      repId = rep.id
      repEmail = rep.email
      const recipes = await getPublicSiteRecipes(admin, rep.id, {
        visibleOnly: true,
      })
      if (recipes.length > 0) {
        baseTemplateData = buildBlingKitchenPantryTemplateData(
          recipes.map(mapPublicSiteRecipeToPantryRecipe),
        )
      } else if (isBlingKitchenTarget(publicSiteSlug, rep.email)) {
        baseTemplateData = defaultAmethystPantryTemplateData
      } else {
        baseTemplateData = buildBlingKitchenPantryTemplateData([])
      }
    } else if (!isBlingKitchenTarget(publicSiteSlug, null)) {
      baseTemplateData = buildBlingKitchenPantryTemplateData([])
    }
  } catch {
    baseTemplateData = isBlingKitchenTarget(publicSiteSlug, repEmail)
      ? defaultAmethystPantryTemplateData
      : buildBlingKitchenPantryTemplateData([])
  }

  const templateData = applyPublicSiteSlugToPantryTemplateData(
    baseTemplateData,
    publicSiteSlug,
  )

  return new NextResponse(
    buildAmethystPantryBootstrapScript(templateData, {
      publicSiteSlug,
      repId,
      targeted,
    }),
    {
      headers: {
        'content-type': 'application/javascript; charset=utf-8',
        'cache-control': 'no-store',
      },
    },
  )
}
