import { describe, expect, it } from 'vitest'
import {
  createSparkleFinderProductContext,
  createSparkleLabProductContext,
  createSuiteCustomerSiteProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'
import {
  NIC_NAC_TOOL_INTENT_CAPABILITIES,
  SUITE_WORK_REQUIRED_MESSAGE,
  filterNicNacToolIntentsForContext,
} from '@/lib/nic-nac/core/tool-policy'

describe('Nic-Nac core tool policy', () => {
  it('assigns every routed tool intent to an explicit capability requirement', () => {
    expect(Object.keys(NIC_NAC_TOOL_INTENT_CAPABILITIES).sort()).toEqual([
      'audience',
      'calendar',
      'catalog',
      'fulfillment',
      'memory',
      'notification',
      'required_setup',
      'resources',
      'show_memory',
      'site',
      'trade_board',
      'trade_requests',
    ])
    expect(NIC_NAC_TOOL_INTENT_CAPABILITIES.memory.requirement).toBe(
      'shared_memory',
    )
    expect(NIC_NAC_TOOL_INTENT_CAPABILITIES.trade_board.requirement).toBe(
      'suite_workspace',
    )
    expect(NIC_NAC_TOOL_INTENT_CAPABILITIES.resources.requirement).toBe(
      'suite_workspace',
    )
  })

  it('allows Sparkle Suite workspace reps to use Suite workspace tool intents', () => {
    const result = filterNicNacToolIntentsForContext(
      createSuiteRepWorkspaceProductContext({ repId: 'suite-rep-1' }),
      ['trade_board', 'calendar', 'site'],
    )

    expect(result.allowedIntents).toEqual(['trade_board', 'calendar', 'site'])
    expect(result.blockedIntents).toEqual([])
    expect(result.allowedToolNames).toContain('add_listing')
    expect(result.allowedToolNames).toContain('add_show')
    expect(result.allowedToolNames).toContain('update_site_setting')
  })

  it('blocks Suite workspace mutations when the same linked rep is in Sparkle Finder', () => {
    const result = filterNicNacToolIntentsForContext(
      createSparkleFinderProductContext({
        finderUserId: 'finder-user-1',
        linkedSuiteRepId: 'suite-rep-1',
        accountTier: 'silver',
      }),
      ['trade_board', 'calendar'],
    )

    expect(result.allowedIntents).toEqual([])
    expect(result.allowedToolNames).toEqual([])
    expect(result.blockedIntents).toEqual([
      {
        intent: 'trade_board',
        reason: 'suite_workspace_required',
        message: SUITE_WORK_REQUIRED_MESSAGE,
      },
      {
        intent: 'calendar',
        reason: 'suite_workspace_required',
        message: SUITE_WORK_REQUIRED_MESSAGE,
      },
    ])
    expect(result.blockedToolNames).toContain('add_listing')
    expect(result.blockedToolNames).toContain('add_show')
  })

  it('keeps linked Finder memory available while blocking Suite workspace mutations', () => {
    const result = filterNicNacToolIntentsForContext(
      createSparkleFinderProductContext({
        finderUserId: 'finder-user-1',
        linkedSuiteRepId: 'suite-rep-1',
        accountTier: 'silver',
      }),
      ['memory', 'trade_board'],
    )

    expect(result.allowedIntents).toEqual(['memory'])
    expect(result.blockedIntents).toEqual([
      {
        intent: 'trade_board',
        reason: 'suite_workspace_required',
        message: SUITE_WORK_REQUIRED_MESSAGE,
      },
    ])
  })

  it('blocks rep workspace mutations from customer-site conversations', () => {
    const result = filterNicNacToolIntentsForContext(
      createSuiteCustomerSiteProductContext({
        publicSiteSlug: 'blingkitchen',
        suiteRepId: 'suite-rep-1',
      }),
      ['trade_board', 'notification'],
    )

    expect(result.allowedIntents).toEqual([])
    expect(result.blockedIntents.map((blocked) => blocked.reason)).toEqual([
      'suite_workspace_required',
      'suite_workspace_required',
    ])
    expect(result.blockedToolNames).toContain('send_sms_notification')
  })

  it('blocks production mutation intents from Sparkle Lab context', () => {
    const result = filterNicNacToolIntentsForContext(
      createSparkleLabProductContext({ operatorUserId: 'operator-1' }),
      ['trade_board', 'required_setup'],
    )

    expect(result.allowedIntents).toEqual([])
    expect(result.blockedIntents).toEqual([
      {
        intent: 'trade_board',
        reason: 'lab_cannot_mutate_production',
        message:
          'Sparkle Lab can study, replay, and recommend, but it cannot change production Sparkle Suite data.',
      },
      {
        intent: 'required_setup',
        reason: 'lab_cannot_mutate_production',
        message:
          'Sparkle Lab can study, replay, and recommend, but it cannot change production Sparkle Suite data.',
      },
    ])
    expect(result.blockedToolNames).toContain('add_listing')
    expect(result.blockedToolNames).toContain('unlock_required_setup')
  })
})
