import { describe, expect, it } from 'vitest'
import {
  createSuiteOperatorSupportProductContext,
  createSuitePublicLandingProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'
import { buildNicNacCapabilityCatalog } from '@/lib/nic-nac/agent/capability-catalog'
import type { ToolContext } from '@/lib/nic-nac/tools/types'

function toolContext(
  operatorSupport?: ToolContext['operatorSupport'],
): ToolContext {
  return {
    repId: 'rep-1',
    conversationId: 'conversation-1',
    runId: 'run-1',
    supabase: {} as ToolContext['supabase'],
    operatorSupport,
  }
}

describe('Nic-Nac permission-scoped capability catalog', () => {
  it('gives a Workspace rep the whole normal capability catalog without required-setup tools', () => {
    const catalog = buildNicNacCapabilityCatalog({
      productContext: createSuiteRepWorkspaceProductContext({ repId: 'rep-1' }),
      toolContext: toolContext(),
    })

    expect(catalog.source).toBe('workspace_permissions')
    expect(catalog.toolNames).toEqual(
      expect.arrayContaining([
        'list_my_shows',
        'add_show',
        'list_my_trade_board',
        'add_listing',
        'get_show_session_context',
        'get_help_resources',
        'search_work_knowledge',
        'get_customer_audience',
      ]),
    )
    expect(catalog.toolNames).not.toContain('get_required_setup_state')
    expect(catalog.toolNames).not.toContain('unlock_required_setup')
    expect(catalog.requestedIntents).not.toContain('required_setup')
    expect(catalog.toolSafety).toHaveLength(catalog.toolNames.length)
    expect(catalog.toolSafety).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'list_my_shows',
          domain: 'calendar',
          operation: 'read',
        }),
        expect.objectContaining({
          name: 'add_show',
          domain: 'calendar',
          operation: 'write',
        }),
      ]),
    )
  })

  it('exposes only required-setup capabilities in setup mode', () => {
    const catalog = buildNicNacCapabilityCatalog({
      mode: 'required_setup',
      productContext: createSuiteRepWorkspaceProductContext({ repId: 'rep-1' }),
      toolContext: toolContext(),
    })

    expect(catalog.source).toBe('required_setup_permissions')
    expect(catalog.allowedIntents).toEqual(['required_setup'])
    expect(catalog.toolNames).toEqual([
      'get_required_setup_state',
      'ensure_live_queue_sync_code',
      'save_required_setup_answer',
      'request_required_setup_support',
      'unlock_required_setup',
    ])
    expect(catalog.toolNames).not.toContain('add_show')
    expect(catalog.toolNames).not.toContain('add_listing')
  })

  it('applies exact operator support capabilities after product policy', () => {
    const support = {
      supportSessionId: 'support-1',
      operatorRepId: 'operator-1',
      capabilities: ['calendar.manage'] as const,
    }
    const catalog = buildNicNacCapabilityCatalog({
      productContext: createSuiteOperatorSupportProductContext({
        targetRepId: 'rep-1',
        targetUserId: 'user-1',
        operatorRepId: support.operatorRepId,
        supportSessionId: support.supportSessionId,
      }),
      toolContext: toolContext({
        ...support,
        capabilities: [...support.capabilities],
      }),
    })

    expect(catalog.toolNames).toEqual([
      'prepare_calendar_work',
      'add_show',
      'list_my_shows',
      'update_show',
      'cancel_show',
      'skip_show_occurrence',
      'cancel_show_series',
      'pause_show_series',
    ])
    expect(catalog.toolNames).not.toContain('end_show')
    expect(catalog.toolNames).not.toContain('add_listing')
    expect(catalog.toolNames).not.toContain('ensure_live_queue_sync_code')
    expect(catalog.operatorRestrictedToolNames).toEqual(
      expect.arrayContaining(['end_show', 'add_listing']),
    )
  })

  it('keeps private Workspace tools off a public surface', () => {
    const catalog = buildNicNacCapabilityCatalog({
      productContext: createSuitePublicLandingProductContext(),
      toolContext: toolContext(),
    })

    expect(catalog.toolNames).toEqual([])
    expect(catalog.allowedIntents).toEqual([])
    expect(catalog.blockedToolNames).toEqual(
      expect.arrayContaining(['add_show', 'add_listing', 'write_rep_note']),
    )
  })

  it('preserves approval metadata on allowed write tools', () => {
    const catalog = buildNicNacCapabilityCatalog({
      productContext: createSuiteRepWorkspaceProductContext({ repId: 'rep-1' }),
      toolContext: toolContext(),
    })
    const cancelShow = catalog.tools.cancel_show as { needsApproval?: boolean }

    expect(cancelShow.needsApproval).toBe(true)
    expect((catalog.tools.send_sms_notification as { needsApproval?: boolean }).needsApproval)
      .toBe(true)
    expect((catalog.tools.send_email_notification as { needsApproval?: boolean }).needsApproval)
      .toBe(true)
  })
})
