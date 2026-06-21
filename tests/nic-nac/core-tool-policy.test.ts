import { describe, expect, it } from 'vitest'
import {
  createSparkleFinderProductContext,
  createSparkleLabProductContext,
  createSuiteCustomerSiteProductContext,
  createSuiteRepWorkspaceProductContext,
} from '@/lib/nic-nac/core/product-context'
import {
  SUITE_WORK_REQUIRED_MESSAGE,
  filterNicNacToolIntentsForContext,
} from '@/lib/nic-nac/core/tool-policy'

describe('Nic-Nac core tool policy', () => {
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
