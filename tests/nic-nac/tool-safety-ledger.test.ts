import { describe, expect, it } from 'vitest'

import {
  buildAllTools,
  listRegisteredNicNacToolMetadata,
  listToolNamesForIntents,
  WORKSPACE_TOOL_INTENTS,
} from '@/lib/nic-nac/tools'
import {
  auditNicNacToolSafetyLedger,
  getNicNacToolSafetyEntry,
  NIC_NAC_TOOL_SAFETY_LEDGER,
  type NicNacToolApprovalPolicy,
} from '@/lib/nic-nac/tools/safety-ledger'
import type { ToolContext } from '@/lib/nic-nac/tools/types'

function runtimeContracts() {
  const ctx = {
    repId: '11111111-1111-4111-8111-111111111111',
    conversationId: '22222222-2222-4222-8222-222222222222',
    runId: '33333333-3333-4333-8333-333333333333',
    supabase: {} as never,
  } satisfies ToolContext
  const built = buildAllTools(ctx)

  return listRegisteredNicNacToolMetadata().map((registered) => {
    const needsApproval = (
      built[registered.name] as { needsApproval?: boolean | ((...args: never[]) => unknown) }
    ).needsApproval
    const approvalPolicy: NicNacToolApprovalPolicy =
      typeof needsApproval === 'function'
        ? 'dynamic'
        : needsApproval === true
          ? 'required'
          : 'not_required'
    return { ...registered, approvalPolicy }
  })
}

describe('Nic-Nac tool safety ledger', () => {
  it('classifies every registered tool and matches enforced metadata and surfaces', () => {
    const findings = auditNicNacToolSafetyLedger({
      registeredTools: runtimeContracts(),
      normalWorkspaceToolNames: listToolNamesForIntents([
        ...WORKSPACE_TOOL_INTENTS,
      ]),
      requiredSetupToolNames: listToolNamesForIntents(['required_setup']),
    })

    expect(findings.filter((finding) => finding.severity === 'error')).toEqual([])
    expect(Object.keys(NIC_NAC_TOOL_SAFETY_LEDGER)).toHaveLength(53)
  })

  it('has no unresolved approval decisions before agent rollout', () => {
    const findings = auditNicNacToolSafetyLedger({
      registeredTools: runtimeContracts(),
    })

    expect(findings).toEqual([])
    expect(getNicNacToolSafetyEntry('add_show')?.approval).toMatchObject({
      policy: 'not_required',
      review: 'accepted',
      rationale: expect.stringContaining('direct, unambiguous request'),
    })
    expect(getNicNacToolSafetyEntry('unlock_required_setup')?.approval).toMatchObject({
      policy: 'not_required',
      review: 'accepted',
      rationale: expect.stringContaining('required-setup mode'),
    })
  })

  it('preserves the current approval gates exactly', () => {
    const requiredApproval = Object.values(NIC_NAC_TOOL_SAFETY_LEDGER)
      .filter((entry) => entry.approval.policy === 'required')
      .map((entry) => entry.name)
      .sort()

    expect(requiredApproval).toEqual([
      'approve_trade',
      'approve_trade_swap',
      'cancel_show',
      'cancel_show_series',
      'manage_customer_contact',
      'pause_show_series',
      'remove_listing',
      'report_jewelry_catalog_issue',
      'send_email_notification',
      'send_sms_notification',
      'set_notification_preferences',
      'set_show_reminder_override',
      'skip_show_occurrence',
    ])

    const dynamicApproval = Object.values(NIC_NAC_TOOL_SAFETY_LEDGER)
      .filter((entry) => entry.approval.policy === 'dynamic')
      .map((entry) => entry.name)
      .sort()

    expect(dynamicApproval).toEqual([
      'manage_join_team_roster',
      'manage_site_recipes',
      'start_show_session',
    ])
  })

  it('keeps setup credential and entitlement tools out of normal and operator-support work', () => {
    expect(getNicNacToolSafetyEntry('ensure_live_queue_sync_code')).toMatchObject({
      operation: 'write',
      sideEffect: { risk: 'critical', kind: 'access_credential' },
      availability: {
        normalWorkspace: false,
        requiredSetup: true,
        operatorSupport: { allowed: false, reason: 'permanently_blocked' },
      },
    })
    expect(getNicNacToolSafetyEntry('unlock_required_setup')).toMatchObject({
      operation: 'write',
      sideEffect: { risk: 'critical', kind: 'account_entitlement' },
      availability: {
        normalWorkspace: false,
        requiredSetup: true,
        operatorSupport: { allowed: false, reason: 'permanently_blocked' },
      },
    })
  })

  it('classifies support draft preparation as non-mutating while retaining support audit policy', () => {
    expect(getNicNacToolSafetyEntry('submit_support_report')).toMatchObject({
      operation: 'read',
      sideEffect: { risk: 'low', kind: 'client_navigation' },
      availability: {
        operatorSupport: {
          allowed: true,
          capability: 'communications.manage',
          auditedAsMutation: true,
        },
      },
    })
  })

  it('detects duplicate and unclassified registered tools instead of silently accepting them', () => {
    const registered = runtimeContracts()
    const duplicate = auditNicNacToolSafetyLedger({
      registeredTools: [...registered, registered[0]],
    })
    expect(duplicate).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'duplicate_registered_tool',
      toolName: registered[0].name,
    }))

    const missing = auditNicNacToolSafetyLedger({
      registeredTools: [
        ...registered,
        { name: 'future_unclassified_tool', readOnly: false, approvalPolicy: 'not_required' },
      ],
    })
    expect(missing).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'missing_ledger_entry',
      toolName: 'future_unclassified_tool',
    }))
  })

  it('contains no billing, DNS, domain-ownership, or payment capability', () => {
    expect(Object.keys(NIC_NAC_TOOL_SAFETY_LEDGER)).not.toEqual(
      expect.arrayContaining([
        expect.stringMatching(/billing|stripe|payment|charge|dns|nameserver|domain_ownership/),
      ]),
    )
  })
})
