import type { Tool } from 'ai'

import { runAuditedOperatorSupportMutation } from '@/lib/operator-support/audit'
import { getOperatorSupportToolPolicy } from '@/lib/nic-nac/core/operator-support-policy'
import type { ToolContext } from '../types'

export function withOperatorSupportAudit(
  toolName: string,
  ctx: ToolContext,
  tool: Tool,
): Tool {
  const support = ctx.operatorSupport
  if (!support) return tool

  const policy = getOperatorSupportToolPolicy(toolName)
  if (!policy) {
    throw new Error(`[nic-nac] operator support tool is not authorized: ${toolName}`)
  }

  const original = (tool as { execute?: (...args: unknown[]) => unknown }).execute
  if (typeof original !== 'function' || !policy.mutation) return tool

  const wrapped = async (...args: unknown[]) =>
    runAuditedOperatorSupportMutation(
      ctx.supabase,
      {
        supportSessionId: support.supportSessionId,
        operatorRepId: support.operatorRepId,
        targetRepId: ctx.repId,
        workspaceArea: policy.workspaceArea,
        capability: policy.capability,
        resourceType: 'nic_nac_tool',
        resourceId: ctx.conversationId,
        actionName: toolName,
        safeDiff: () => ({ toolName }),
      },
      () => Promise.resolve(original.apply(tool, args)),
    )

  return { ...(tool as object), execute: wrapped } as Tool
}
