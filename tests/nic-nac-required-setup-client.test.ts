import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveNicNacWorkspaceMode } from '@/lib/nic-nac/required-setup-client-mode'

const client = readFileSync(resolve(process.cwd(), 'app/nic-nac/_client.tsx'), 'utf8')
const requiredSetupHome = readFileSync(
  resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.tsx'),
  'utf8',
)
const liveQueuePanel = readFileSync(
  resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupLiveQueuePanel.tsx'),
  'utf8',
)
const startForm = readFileSync(
  resolve(process.cwd(), 'app/start/StartSparkleSuiteForm.tsx'),
  'utf8',
)
const startPage = readFileSync(resolve(process.cwd(), 'app/start/page.tsx'), 'utf8')

describe('Nic-Nac required setup client', () => {
  it('uses a reusable chat body component', () => {
    expect(client).toContain("from './components/NicNacChatBody'")
    expect(client).not.toContain('function ChatBody(')
  })

  it('loads setup state and routes required setup before the full dashboard', () => {
    expect(client).toContain('/api/self-serve/setup-state')
    expect(client).toContain('RequiredSetupHome')
    expect(client).toContain('resolveNicNacWorkspaceMode')
    expect(client).toContain("searchParams.get('onboarding') === 'required-setup'")
    expect(client).toContain("workspaceMode === 'dashboard_unlocked'")
  })

  it('does not bypass real setup state with a local preview fallback', () => {
    expect(client).not.toContain("searchParams.get('preview') === 'setup'")
    expect(client).not.toContain('canUseLocalRequiredSetupPreview')
    expect(client).not.toContain('buildLocalRequiredSetupPreviewState')
  })

  it('surfaces a local setup-state load blocker instead of spinning forever', () => {
    expect(client).toContain('SETUP_STATE_TIMEOUT_MS')
    expect(client).toContain("controller.abort('timeout')")
    expect(client).toContain('Setup state did not load')
  })

  it('syncs a returned Stripe checkout session before loading required setup', () => {
    expect(client).toContain('/api/stripe/sync')
    expect(client).toContain('CHECKOUT_SYNC_TIMEOUT_MS')
    expect(client).toContain("searchParams.get('billing')")
    expect(client).toContain("searchParams.get('session_id')")
    expect(client).toContain("billingState === 'subscription-success'")
    expect(client).toContain('syncReturnedCheckoutSession(checkoutSessionId')
    expect(client).toContain('Finalizing Stripe checkout')
    expect(client).toContain('Stripe checkout sync did not finish')
  })

  it('passes the Stripe success return into workspace mode resolution', () => {
    expect(client).toContain('isCheckoutSuccessReturn: isFinalizingCheckout')
  })

  it('sends the setup chat mode only during required setup', () => {
    expect(client).toContain("mode: isRequiredSetupMode ? 'required_setup' : 'workspace'")
    expect(client).toContain("chatMode={isRequiredSetupMode ? 'required_setup' : 'workspace'}")
  })

  it('passes the active setup step into chat so setup can show step-specific UI', () => {
    expect(client).toContain('requiredSetupStep={setupState?.currentStep ?? null}')
  })

  it('passes the assigned Live Queue sync code into chat for Live Queue setup', () => {
    expect(client).toContain('requiredSetupSyncCode={requiredSetupSyncCode}')
    expect(client).toContain('setupState?.liveQueueSyncCode ?? null')
    expect(client).not.toContain('formatExtensionRepId(setupState?.repId)')
  })

  it('passes the exact required setup preview href into chat', () => {
    expect(client).toContain('requiredSetupPreviewHref={requiredSetupPreviewHref}')
    expect(client).toContain('buildCustomerSparkleSiteHref(setupState?.repId)')
  })

  it('uses current required setup product language in setup surfaces', () => {
    const source = `${requiredSetupHome}\n${startForm}\n${startPage}`

    expect(source).not.toContain('Site skin')
    expect(source).not.toContain('public site')
    expect(source).not.toContain('dancefloor/trade board')
    expect(source).toContain('customer-facing website')
    expect(source).toContain('Live Queue')
    expect(source).toContain('Trade Board')
  })

  it('sends structured Live Queue completion evidence from the setup panel', () => {
    expect(liveQueuePanel).toContain('extensionInstalled: true')
    expect(liveQueuePanel).toContain('syncCodeEntered: true')
    expect(liveQueuePanel).toContain('partyOrdersOpen: true')
    expect(liveQueuePanel).toContain('partyFilterSet: true')
    expect(liveQueuePanel).toContain('liveQueueConnected: true')
    expect(liveQueuePanel).toContain('Live Queue status is connected')
  })

  it('refreshes setup state after required setup chat responses settle', () => {
    expect(client).toContain('wasStreamingRef')
    expect(client).toContain('void loadSetupState()')
  })

  it('auto-opens checkout instead of rendering a duplicate checkout page', () => {
    expect(client).toContain("searchParams.get('onboarding') === 'checkout-required'")
    expect(client).toContain('/api/stripe/create-checkout')
    expect(client).toContain("planType: 'monthly'")
    expect(client).toContain('agreementAccepted: true')
    expect(client).toContain('void handleStartCheckout()')
    expect(client).toContain('Opening checkout...')
    expect(client).not.toContain('CheckoutRequiredHome')
    expect(client).not.toContain("onboarding') === 'self-serve-started'")
  })
})

describe('required setup client mode precedence', () => {
  it.each([
    ['checkout_required', 'checkout_required'],
    ['payment_pending', 'checkout_required'],
    ['required_setup', 'required_setup'],
    ['setup_blocked', 'required_setup'],
    ['dashboard_unlocked', 'dashboard_unlocked'],
  ] as const)('uses structured %s setup state before URL hints', (setupStatus, mode) => {
    expect(
      resolveNicNacWorkspaceMode({
        setupStatus,
        wantsCheckout: setupStatus === 'dashboard_unlocked',
        wantsRequiredSetup:
          setupStatus === 'checkout_required' || setupStatus === 'payment_pending',
      }),
    ).toBe(mode)
  })

  it('uses URL hints only before structured setup state is available', () => {
    expect(
      resolveNicNacWorkspaceMode({
        setupStatus: null,
        wantsCheckout: false,
        wantsRequiredSetup: true,
      }),
    ).toBe('required_setup')
    expect(
      resolveNicNacWorkspaceMode({
        setupStatus: undefined,
        wantsCheckout: true,
        wantsRequiredSetup: false,
      }),
    ).toBe('checkout_required')
  })

  it('keeps the Stripe success return in required setup even if stale preview state says unlocked', () => {
    expect(
      resolveNicNacWorkspaceMode({
        setupStatus: 'dashboard_unlocked',
        wantsCheckout: false,
        wantsRequiredSetup: true,
        isCheckoutSuccessReturn: true,
      }),
    ).toBe('required_setup')
  })
})
