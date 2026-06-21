import type { NicNacToolIntent } from '@/lib/nic-nac/tools'
import { listToolNamesForIntents } from '@/lib/nic-nac/tools'
import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'

export const SUITE_WORK_REQUIRED_MESSAGE =
  'I need you to log in to Sparkle Suite for us to do any Sparkle Suite work.'

export const LAB_PRODUCTION_MUTATION_BLOCKED_MESSAGE =
  'Sparkle Lab can study, replay, and recommend, but it cannot change production Sparkle Suite data.'

export const SHARED_MEMORY_UNAVAILABLE_MESSAGE =
  'I can only use shared Nic-Nac memory after you are logged in with a linked Sparkle account.'

export type NicNacToolBlockReason =
  | 'suite_workspace_required'
  | 'shared_memory_unavailable'
  | 'lab_cannot_mutate_production'

export type NicNacToolIntentCapabilityRequirement =
  | 'shared_memory'
  | 'suite_workspace'

export interface NicNacToolIntentCapability {
  requirement: NicNacToolIntentCapabilityRequirement
}

export const NIC_NAC_TOOL_INTENT_CAPABILITIES: Record<
  NicNacToolIntent,
  NicNacToolIntentCapability
> = {
  memory: { requirement: 'shared_memory' },
  show_memory: { requirement: 'suite_workspace' },
  trade_board: { requirement: 'suite_workspace' },
  trade_requests: { requirement: 'suite_workspace' },
  fulfillment: { requirement: 'suite_workspace' },
  catalog: { requirement: 'suite_workspace' },
  calendar: { requirement: 'suite_workspace' },
  site: { requirement: 'suite_workspace' },
  notification: { requirement: 'suite_workspace' },
  audience: { requirement: 'suite_workspace' },
  resources: { requirement: 'suite_workspace' },
  required_setup: { requirement: 'suite_workspace' },
}

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
  intent: NicNacToolIntent,
): { reason: NicNacToolBlockReason; message: string } | null {
  const capability = NIC_NAC_TOOL_INTENT_CAPABILITIES[intent]

  if (context.product === 'sparkle_lab') {
    return {
      reason: 'lab_cannot_mutate_production',
      message: LAB_PRODUCTION_MUTATION_BLOCKED_MESSAGE,
    }
  }

  if (capability.requirement === 'shared_memory') {
    if (
      context.permissions.canReadSharedMemory ||
      context.permissions.canWriteSharedMemory
    ) {
      return null
    }

    return {
      reason: 'shared_memory_unavailable',
      message: SHARED_MEMORY_UNAVAILABLE_MESSAGE,
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
