import { NextResponse } from 'next/server'
import { z } from 'zod'

import { SPARKLE_FINDER_APPEARANCE_PRESET_IDS } from '@/lib/sparkle-finder/appearance-presets'
import { saveSparkleFinderAppearanceSetting } from '@/lib/sparkle-finder/appearance'
import { createAdminClient } from '@/lib/supabase/admin'
import { AuthError, getControlCenterAccess, OperatorAuthError } from '@/lib/supabase/operator-auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const updateSchema = z.object({
  appearancePreset: z.enum(SPARKLE_FINDER_APPEARANCE_PRESET_IDS),
}).strict()

export async function PATCH(request: Request) {
  try {
    const { operator } = await getControlCenterAccess()
    const input = updateSchema.parse(await request.json())
    const appearance = await saveSparkleFinderAppearanceSetting(
      createAdminClient(),
      input.appearancePreset,
      operator.email,
    )
    return NextResponse.json({ appearance })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 })
    }
    if (error instanceof OperatorAuthError) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 })
    }
    if (error instanceof SyntaxError || error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Choose a valid appearance.' }, { status: 400 })
    }
    console.error('[control-center/finder-appearance] Save failed:', error)
    return NextResponse.json({ error: 'Sparkle Finder appearance could not be saved.' }, { status: 500 })
  }
}
