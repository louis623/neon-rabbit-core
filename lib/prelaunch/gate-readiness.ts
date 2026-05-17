import { getPrelaunchPaymentGatePriceId } from '@/lib/prelaunch/payment-gates'
import { getPrelaunchSignWellConfig } from '@/lib/prelaunch/signwell'

type EnvLike = Record<string, string | undefined>

export type PrelaunchGateReadinessStatus = 'blocked' | 'disabled'

export interface PrelaunchGateReadinessItem {
  key: 'sms_campaign' | 'agreement' | 'start_work_fee' | 'launch_fee'
  label: string
  status: PrelaunchGateReadinessStatus
  displayStatus: string
  detail: string
}

export function getPrelaunchGateReadiness(
  env: EnvLike = process.env,
): PrelaunchGateReadinessItem[] {
  const signWellConfig = getPrelaunchSignWellConfig(env)
  const startWorkPriceId = getPrelaunchPaymentGatePriceId(
    'start_work_fee',
    env,
  )
  const launchPriceId = getPrelaunchPaymentGatePriceId('launch_fee', env)

  return [
    {
      key: 'sms_campaign',
      label: 'SMS campaign',
      status: 'blocked',
      displayStatus: 'Pending Telnyx review',
      detail:
        'Live SMS is blocked until campaign approval, number attachment, and real handset smoke succeed.',
    },
    signWellConfig
      ? {
          key: 'agreement',
          label: 'Agreement gate',
          status: 'disabled',
          displayStatus: 'Send not enabled',
          detail:
            'Agreement sending is waiting for final legal/template review.',
        }
      : {
          key: 'agreement',
          label: 'Agreement gate',
          status: 'blocked',
          displayStatus: 'SignWell not configured',
          detail:
            'Agreement sending is disabled until SignWell config is complete.',
        },
    startWorkPriceId
      ? {
          key: 'start_work_fee',
          label: 'Start work fee',
          status: 'disabled',
          displayStatus: 'Checkout not enabled',
          detail: 'Checkout is waiting for final Stripe price review.',
        }
      : {
          key: 'start_work_fee',
          label: 'Start work fee',
          status: 'blocked',
          displayStatus: 'Stripe price missing',
          detail:
            'Checkout is disabled until the start-work price is configured.',
        },
    launchPriceId
      ? {
          key: 'launch_fee',
          label: 'Launch fee',
          status: 'disabled',
          displayStatus: 'Checkout not enabled',
          detail: 'Checkout is waiting for final Stripe price review.',
        }
      : {
          key: 'launch_fee',
          label: 'Launch fee',
          status: 'blocked',
          displayStatus: 'Stripe price missing',
          detail:
            'Checkout is disabled until the launch-fee price is configured.',
        },
  ]
}
