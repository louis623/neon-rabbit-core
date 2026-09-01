import assert from 'node:assert/strict'
import { buildNicNacCapabilityCatalog } from '@/lib/nic-nac/agent/capability-catalog'
import { buildNicNacAgentInstructions } from '@/lib/nic-nac/agent/instructions'
import {
  canNicNacAgentHarnessBeEnabled,
  isNicNacAgentHarnessEnabled,
} from '@/lib/nic-nac/agent/rollout'
import { createSuiteRepWorkspaceProductContext } from '@/lib/nic-nac/core/product-context'
import { searchNicNacWorkKnowledge } from '@/lib/nic-nac/knowledge/search-work-knowledge'
import {
  buildAllTools,
  listRegisteredNicNacToolMetadata,
  listToolNamesForIntents,
  WORKSPACE_TOOL_INTENTS,
} from '@/lib/nic-nac/tools'
import {
  auditNicNacToolSafetyLedger,
  type NicNacToolApprovalPolicy,
} from '@/lib/nic-nac/tools/safety-ledger'
import type { ToolContext } from '@/lib/nic-nac/tools/types'

const toolContext = {
  repId: '00000000-0000-4000-8000-000000000001',
  conversationId: '00000000-0000-4000-8000-000000000002',
  runId: '00000000-0000-4000-8000-000000000003',
  supabase: {} as never,
} satisfies ToolContext

const builtTools = buildAllTools(toolContext)
const safetyFindings = auditNicNacToolSafetyLedger({
  registeredTools: listRegisteredNicNacToolMetadata().map((metadata) => {
    const needsApproval = (
      builtTools[metadata.name] as {
        needsApproval?: boolean | ((...args: never[]) => unknown)
      }
    ).needsApproval
    const approvalPolicy: NicNacToolApprovalPolicy =
      typeof needsApproval === 'function'
        ? 'dynamic'
        : needsApproval === true
          ? 'required'
          : 'not_required'
    return { ...metadata, approvalPolicy }
  }),
  normalWorkspaceToolNames: listToolNamesForIntents([
    ...WORKSPACE_TOOL_INTENTS,
  ]),
  requiredSetupToolNames: listToolNamesForIntents(['required_setup']),
})
assert.deepEqual(safetyFindings, [])

const productContext = createSuiteRepWorkspaceProductContext({
  repId: toolContext.repId,
})
const catalog = buildNicNacCapabilityCatalog({
  productContext,
  toolContext,
})
assert.equal(catalog.toolNames.length, 47)
assert.equal(catalog.toolSafety.length, catalog.toolNames.length)
assert.ok(catalog.toolNames.includes('list_my_shows'))
assert.ok(catalog.toolNames.includes('add_show'))
assert.ok(catalog.toolNames.includes('list_my_trade_board'))
assert.ok(catalog.toolNames.includes('search_work_knowledge'))
assert.ok(!catalog.toolNames.includes('prepare_calendar_work'))
assert.deepEqual(catalog.harnessExcludedToolNames, ['prepare_calendar_work'])
assert.ok(!catalog.toolNames.includes('unlock_required_setup'))

const instructions = buildNicNacAgentInstructions({
  productContext,
  taskContext: 'Paused goal: add one dancer after the current question.',
})
assert.match(instructions, /latest explicit request or correction wins/i)
assert.match(instructions, /prior unfinished task is context, not a lock/i)
assert.match(instructions, /Choose tools yourself/i)

const knowledge = searchNicNacWorkKnowledge(
  'How should I troubleshoot audio during a TikTok live?',
)
assert.equal(knowledge.matched, true)
assert.equal(knowledge.results[0]?.scope, 'live_streaming_practice')
assert.ok(knowledge.results[0]?.sourceId)
assert.ok(knowledge.results[0]?.reviewedAt)

const rolloutIdentity = {
  repId: toolContext.repId,
  email: 'synthetic-reviewer@example.com',
}
assert.equal(
  isNicNacAgentHarnessEnabled(rolloutIdentity, { NODE_ENV: 'production' }),
  false,
)
assert.equal(canNicNacAgentHarnessBeEnabled({ NODE_ENV: 'production' }), false)
assert.equal(
  isNicNacAgentHarnessEnabled(rolloutIdentity, {
    NODE_ENV: 'production',
    NIC_NAC_AGENT_HARNESS_EMAILS: rolloutIdentity.email,
  }),
  true,
)

console.log(
  JSON.stringify(
    {
      status: 'pass',
      paidModelCalls: 0,
      registeredTools: Object.keys(builtTools).length,
      workspaceAgentTools: catalog.toolNames.length,
      harnessExcludedTools: catalog.harnessExcludedToolNames,
      approvalLedgerFindings: safetyFindings.length,
      productionDefaultOff: true,
      exactCohortEnablement: true,
      groundedKnowledgeSource: knowledge.results[0]?.sourceId,
    },
    null,
    2,
  ),
)
