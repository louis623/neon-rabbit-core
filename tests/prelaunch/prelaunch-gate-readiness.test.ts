import { describe, expect, it } from 'vitest'

import { getPrelaunchGateReadiness } from '@/lib/prelaunch/gate-readiness'

describe('prelaunch gate readiness', () => {
  it('marks all launch gates blocked when provider config is missing', () => {
    expect(getPrelaunchGateReadiness({})).toEqual([
      {
        key: 'sms_campaign',
        label: 'SMS campaign',
        status: 'blocked',
        displayStatus: 'Pending Telnyx review',
        detail:
          'Live SMS is blocked until campaign approval, number attachment, and real handset smoke succeed.',
      },
      {
        key: 'agreement',
        label: 'Agreement gate',
        status: 'blocked',
        displayStatus: 'SignWell not configured',
        detail: 'Agreement sending is disabled until SignWell config is complete.',
      },
      {
        key: 'start_work_fee',
        label: 'Start work fee',
        status: 'blocked',
        displayStatus: 'Stripe price missing',
        detail: 'Checkout is disabled until the start-work price is configured.',
      },
      {
        key: 'launch_fee',
        label: 'Launch fee',
        status: 'blocked',
        displayStatus: 'Stripe price missing',
        detail: 'Checkout is disabled until the launch-fee price is configured.',
      },
    ])
  })

  it('keeps gates disabled after config exists until final review enables them', () => {
    expect(
      getPrelaunchGateReadiness({
        SIGNWELL_API_KEY: 'signwell_api_key',
        SIGNWELL_API_BASE_URL: 'https://www.signwell.com/api/v1',
        SIGNWELL_TEMPLATE_ID: 'template_123',
        STRIPE_PRICE_START_WORK_FEE: 'price_start_123',
        STRIPE_PRICE_LAUNCH_FEE: 'price_launch_123',
      }),
    ).toEqual([
      {
        key: 'sms_campaign',
        label: 'SMS campaign',
        status: 'blocked',
        displayStatus: 'Pending Telnyx review',
        detail:
          'Live SMS is blocked until campaign approval, number attachment, and real handset smoke succeed.',
      },
      {
        key: 'agreement',
        label: 'Agreement gate',
        status: 'disabled',
        displayStatus: 'Send not enabled',
        detail: 'Agreement sending is waiting for final legal/template review.',
      },
      {
        key: 'start_work_fee',
        label: 'Start work fee',
        status: 'disabled',
        displayStatus: 'Checkout not enabled',
        detail: 'Checkout is waiting for final Stripe price review.',
      },
      {
        key: 'launch_fee',
        label: 'Launch fee',
        status: 'disabled',
        displayStatus: 'Checkout not enabled',
        detail: 'Checkout is waiting for final Stripe price review.',
      },
    ])
  })
})
