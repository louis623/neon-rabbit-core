import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import { listToolNamesForIntents } from '@/lib/nic-nac/tools'
import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'

export const SUITE_WORK_REQUIRED_MESSAGE =
  'I need you to log in to Sparkle Suite for us to do any Sparkle Suite work.'

export const LAB_PRODUCTION_MUTATION_BLOCKED_MESSAGE =
  'Sparkle Lab can study, replay, and recommend, but it cannot change production Sparkle Suite data.'

export type NicNacToolBlockReason =
  | 'suite_workspace_required'
  | 'lab_cannot_mutate_production'

export interface NicNacBlockedToolIntent {
  intent: NicNacToolIntent
  reason: NicNacToolBlockReason
  message: string
}

export interface NicNacToolPolicyResult {
  allowedIntents: NicNacToolIntent[]
  blockedIntents: NicNacBlockedToolIntent[]
  allowedToolNames: string[]
  blockedToolNames: string[]
}

export function filterNicNacToolIntentsForContext(
  context: NicNacProductContext,
  requestedIntents: NicNacToolIntent[],
): NicNacToolPolicyResult {
  const allowedIntents: NicNacToolIntent[] = []
  const blockedIntents: NicNacBlockedToolIntent[] = []

  for (const intent of requestedIntents) {
    const block = getBlockForIntent(context, intent)
    if (block) {
      blockedIntents.push({
        intent,
        reason: block.reason,
        message: block.message,
      })
    } else if (!allowedIntents.includes(intent)) {
      allowedIntents.push(intent)
    }
  }

  return {
    allowedIntents,
    blockedIntents,
    allowedToolNames: listToolNamesForIntents(allowedIntents),
    blockedToolNames: listToolNamesForIntents(
      blockedIntents.map((blocked) => blocked.intent),
    ),
  }
}

function getBlockForIntent(
  context: NicNacProductContext,
  _intent: NicNacToolIntent,
): { reason: NicNacToolBlockReason; message: string } | null {
  if (context.product === 'sparkle_lab') {
    return {
      reason: 'lab_cannot_mutate_production',
      message: LAB_PRODUCTION_MUTATION_BLOCKED_MESSAGE,
    }
  }

  if (!context.permissions.canMutateSuiteWorkspace) {
    return {
      reason: 'suite_workspace_required',
      message: SUITE_WORK_REQUIRED_MESSAGE,
    }
  }

  return null
}
