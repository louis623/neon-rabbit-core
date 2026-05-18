export interface ProviderRecoveryContract {
  id: string
  sourceLabel: string
  expectedCode: string
  testFile: string
  liveProviderRequired: boolean
  notes: string
}

export const PROVIDER_RECOVERY_CONTRACTS: ProviderRecoveryContract[] = [
  {
    id: 'signwell.not-configured',
    sourceLabel: '/api/prelaunch/signwell/agreement',
    expectedCode: 'SIGNWELL_NOT_CONFIGURED',
    testFile: 'tests/prelaunch/prelaunch-signwell-route.test.ts',
    liveProviderRequired: false,
    notes:
      'Operator route returns a disabled/not-configured response before any SignWell send attempt.',
  },
  {
    id: 'signwell.live-send-blocked',
    sourceLabel: '/api/prelaunch/signwell/agreement',
    expectedCode: 'SIGNWELL_LIVE_SEND_BLOCKED',
    testFile: 'tests/prelaunch/prelaunch-signwell-route.test.ts',
    liveProviderRequired: false,
    notes:
      'Operator route remains parked after config exists unless an explicit live-send flag enables sends.',
  },
  {
    id: 'payment-gates.price-not-configured',
    sourceLabel: '/api/prelaunch/payment-gates/checkout',
    expectedCode: 'PAYMENT_GATE_PRICE_NOT_CONFIGURED',
    testFile: 'tests/prelaunch/prelaunch-payment-gates-route.test.ts',
    liveProviderRequired: false,
    notes:
      'Operator route returns not-configured when a gate does not have a Stripe price id.',
  },
  {
    id: 'payment-gates.checkout-disabled',
    sourceLabel: '/api/prelaunch/payment-gates/checkout',
    expectedCode: 'PAYMENT_GATE_CHECKOUT_NOT_ENABLED',
    testFile: 'tests/prelaunch/prelaunch-payment-gates-route.test.ts',
    liveProviderRequired: false,
    notes:
      'Operator route remains parked after price config until Stripe price review explicitly enables checkout.',
  },
  {
    id: 'sms.not-configured',
    sourceLabel: 'send_sms_notification',
    expectedCode: 'SMS_NOT_CONFIGURED',
    testFile: 'tests/nic-nac/send-sms-notification.test.ts',
    liveProviderRequired: false,
    notes:
      'SMS tool fails before wallet debit, log insert, or Telnyx request when Telnyx env is absent.',
  },
  {
    id: 'sms.telnyx-reject-refund',
    sourceLabel: 'Carrier blocked the message.',
    expectedCode: 'SMS_DELIVERY_FAILED',
    testFile: 'tests/nic-nac/send-sms-notification.test.ts',
    liveProviderRequired: false,
    notes:
      'Mocked Telnyx rejection marks the log failed and refunds the SMS wallet charge.',
  },
  {
    id: 'photoroom.provider-failed',
    sourceLabel: 'photoroom',
    expectedCode: 'PHOTO_ENHANCEMENT_PROVIDER_FAILED',
    testFile: 'tests/services/photo-enhancement-execution.test.ts',
    liveProviderRequired: false,
    notes:
      'Mocked image-provider failure is wrapped in a user-safe ServiceError with request metadata.',
  },
  {
    id: 'audit.write-isolated',
    sourceLabel: 'audit table unreachable',
    expectedCode: 'audit_write_failed',
    testFile: 'tests/nic-nac/trade-board-tools.test.ts',
    liveProviderRequired: false,
    notes:
      'Audit write failures are logged as incidents and must not reverse successful business mutations.',
  },
]
