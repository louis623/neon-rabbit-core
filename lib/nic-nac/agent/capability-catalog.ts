import type { ToolSet } from 'ai'
import type { NicNacProductContext } from '@/lib/nic-nac/core/product-context'
import {
  filterNicNacToolIntentsForContext,
  type NicNacBlockedToolIntent,
} from '@/lib/nic-nac/core/tool-policy'
import {
  WORKSPACE_TOOL_INTENTS,
  buildToolsForIntents,
  type NicNacToolIntent,
} from '@/lib/nic-nac/tools'
import {
  getNicNacToolSafetyEntry,
  type NicNacToolSafetyLedgerEntry,
} from '@/lib/nic-nac/tools/safety-ledger'
import type { ToolContext } from '@/lib/nic-nac/tools/types'
import type { NicNacAgentMode } from '@/lib/nic-nac/agent/instructions'

export type NicNacCapabilityCatalogSource =
  | 'workspace_permissions'
  | 'required_setup_permissions'

export type NicNacCapabilityCatalog = {
  source: NicNacCapabilityCatalogSource
  mode: NicNacAgentMode
  tools: ToolSet
  toolNames: string[]
  toolSafety: NicNacToolSafetyLedgerEntry[]
  requestedIntents: NicNacToolIntent[]
  allowedIntents: NicNacToolIntent[]
  blockedIntents: NicNacBlockedToolIntent[]
  blockedToolNames: string[]
  operatorRestrictedToolNames: string[]
}

export type BuildNicNacCapabilityCatalogInput = {
  mode?: NicNacAgentMode
  productContext: NicNacProductContext
  toolContext: ToolContext
}

function unique(values: readonly string[]): string[] {
  return Array.from(new Set(values))
}

/**
 * Builds the complete capability set for the current product surface.
 *
 * This deliberately does not inspect user text or old workflow intent. The
 * product policy, authenticated permissions, support-session capabilities,
 * and required-setup mode decide what the model is allowed to use. The model
 * decides which allowed capability fits the current request.
 */
export function buildNicNacCapabilityCatalog({
  mode = 'workspace',
  productContext,
  toolContext,
}: BuildNicNacCapabilityCatalogInput): NicNacCapabilityCatalog {
  const requestedIntents: NicNacToolIntent[] =
    mode === 'required_setup'
      ? ['required_setup']
      : [...WORKSPACE_TOOL_INTENTS]
  const policy = filterNicNacToolIntentsForContext(
    productContext,
    requestedIntents,
  )
  const tools = buildToolsForIntents(toolContext, policy.allowedIntents)
  const toolNames = Object.keys(tools)
  const toolSafety = toolNames.map((toolName) => {
    const entry = getNicNacToolSafetyEntry(toolName)
    if (!entry) {
      throw new Error(
        `[nic-nac] Refusing to expose unclassified agent tool: ${toolName}`,
      )
    }
    return entry
  })
  const operatorRestrictedToolNames = toolContext.operatorSupport
    ? policy.allowedToolNames.filter((name) => !toolNames.includes(name))
    : []

  return {
    source:
      mode === 'required_setup'
        ? 'required_setup_permissions'
        : 'workspace_permissions',
    mode,
    tools,
    toolNames,
    toolSafety,
    requestedIntents,
    allowedIntents: policy.allowedIntents,
    blockedIntents: policy.blockedIntents,
    blockedToolNames: unique([
      ...policy.blockedToolNames,
      ...operatorRestrictedToolNames,
    ]),
    operatorRestrictedToolNames,
  }
}
