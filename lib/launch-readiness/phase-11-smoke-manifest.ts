export const PHASE_11_SMOKE_STATUSES = ['covered', 'partial', 'missing'] as const

export type Phase11SmokeStatus = (typeof PHASE_11_SMOKE_STATUSES)[number]

export const PHASE_11_JOURNEY_IDS = [
  'onboarding',
  'daily-workflow',
  'live-show',
  'post-show',
  'dashboard-nic-nac',
  'cancellation',
  'multi-rep-isolation',
  'error-recovery',
  'mobile-final-responsive',
] as const

export type Phase11JourneyId = (typeof PHASE_11_JOURNEY_IDS)[number]

export type Phase11SafeSmokeCommand = {
  command: string
  note: string
}

export type Phase11SmokeManifestEntry = {
  id: Phase11JourneyId
  label: string
  status: Phase11SmokeStatus
  evidenceFiles: string[]
  safeSmokeCommand: Phase11SafeSmokeCommand | null
  defaultProviderActions: string[]
  nextAction: string
}

export const PHASE_11_SMOKE_MANIFEST: Phase11SmokeManifestEntry[] = [
  {
    id: 'onboarding',
    label: 'Onboarding',
    status: 'partial',
    evidenceFiles: [
      'docs/sparkle-suite/demo-launch-runbook-2026-05-18.md',
      'docs/sparkle-suite/launch-readiness-2026-05-18.md',
      'lib/launch-readiness/onboarding-smoke.ts',
      'scripts/run-onboarding-smoke.ts',
      'tests/onboarding-smoke.test.ts',
      'tests/prelaunch/demo-launch-flow-seed.test.ts',
      'tests/prelaunch/prelaunch-safe-smoke-status.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm run smoke:onboarding:provider-free',
      note: 'Provider-free composed onboarding smoke for intake, setup profile, launch gates, launch checks, and ready launch-build state.',
    },
    defaultProviderActions: [],
    nextAction:
      'Attach a passing onboarding smoke artifact to the launch readiness report before launch signoff.',
  },
  {
    id: 'daily-workflow',
    label: 'Daily workflow',
    status: 'partial',
    evidenceFiles: [
      'docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md',
      'tests/nic-nac-dashboard-placeholder.test.ts',
      'tests/nic-nac-workspace-refresh-events.test.ts',
      'tests/nic-nac/trade-board-tools.test.ts',
      'tests/nic-nac/calendar-tools.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-workspace-refresh-events.test.ts',
      note: 'Focused local tests for the current dashboard shell and workspace refresh surfaces.',
    },
    defaultProviderActions: [],
    nextAction:
      'Promote the browser walkthrough into a repeatable local workflow smoke for dashboard tabs, calendar, trade board, audience, and billing summary.',
  },
  {
    id: 'live-show',
    label: 'Live show',
    status: 'partial',
    evidenceFiles: [
      'docs/sparkle-suite/sms/phase-5-closeout-runbook-2026-05-25.md',
      'lib/launch-readiness/live-show-smoke.ts',
      'tests/live-show-smoke.test.ts',
      'tests/services/live-queue.test.ts',
      'tests/services/pre-show-reminders.test.ts',
      'tests/pre-show-reminders-route.test.ts',
      'tests/nic-nac/show-session-tools.test.ts',
      'tests/amethyst-trade-request-route.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/live-show-smoke.test.ts tests/services/live-queue.test.ts tests/services/pre-show-reminders.test.ts tests/pre-show-reminders-route.test.ts tests/nic-nac/show-session-tools.test.ts',
      note: 'Provider-free composed smoke plus unit coverage for queue snapshots, dry-run reminders, and show-session tools.',
    },
    defaultProviderActions: [],
    nextAction:
      'Wire the composed provider-free live-show smoke into the launch smoke report and capture a real local artifact before launch signoff.',
  },
  {
    id: 'post-show',
    label: 'Post-show',
    status: 'partial',
    evidenceFiles: [
      'docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md',
      'tests/nic-nac/trade-fulfillment.test.ts',
      'tests/nic-nac-fulfillment-queue-route.test.ts',
      'tests/nic-nac-trade-history-route.test.ts',
      'tests/nic-nac/show-sessions.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/nic-nac/trade-fulfillment.test.ts tests/nic-nac-fulfillment-queue-route.test.ts tests/nic-nac-trade-history-route.test.ts',
      note: 'Local route and service coverage for fulfillment queue and trade-history surfaces.',
    },
    defaultProviderActions: [],
    nextAction:
      'Tie completed show state, approved trades, fulfillment updates, and follow-up summaries into one post-show launch smoke.',
  },
  {
    id: 'dashboard-nic-nac',
    label: 'Dashboard / Nic-Nac',
    status: 'covered',
    evidenceFiles: [
      'docs/sparkle-suite/brand/03-nic-nac-positioning.md',
      'docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md',
      'tests/nic-nac-dashboard-placeholder.test.ts',
      'tests/nic-nac-legacy-name-guard.test.ts',
      'tests/nic-nac/prompt-routing.test.ts',
      'tests/nic-nac/site-customization-tools.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-legacy-name-guard.test.ts tests/nic-nac/prompt-routing.test.ts',
      note: 'Local tests for the rep workspace shell, assistant naming, and prompt routing guardrails.',
    },
    defaultProviderActions: [],
    nextAction:
      'Keep this as the dashboard baseline and extend it only after Phase 11 composed journey smokes need shared Nic-Nac assertions.',
  },
  {
    id: 'cancellation',
    label: 'Cancellation',
    status: 'partial',
    evidenceFiles: [
      'docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md',
      'lib/launch-readiness/cancellation-smoke.ts',
      'tests/cancellation-smoke.test.ts',
      'tests/stripe-create-checkout-route.test.ts',
      'tests/stripe-create-portal-session-route.test.ts',
      'tests/stripe-webhook-route.test.ts',
      'tests/services/account-billing.test.ts',
      'tests/nic-nac/calendar-tools.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/cancellation-smoke.test.ts tests/stripe-create-portal-session-route.test.ts tests/services/account-billing.test.ts tests/nic-nac/calendar-tools.test.ts',
      note: 'Provider-free cancellation smoke plus local tests for portal return state, billing summary, and show-cancellation approval boundaries.',
    },
    defaultProviderActions: [],
    nextAction:
      'Wire the provider-free cancellation smoke into launch smoke report artifacts before final launch signoff.',
  },
  {
    id: 'multi-rep-isolation',
    label: 'Multi-rep isolation',
    status: 'partial',
    evidenceFiles: [
      'lib/launch-readiness/multi-rep-isolation-smoke.ts',
      'tests/multi-rep-isolation-smoke.test.ts',
      'tests/nic-nac/attack-5-poisoned-rep-notes.test.ts',
      'tests/nic-nac/show-sessions.test.ts',
      'tests/nic-nac/trade-board-tools.test.ts',
      'tests/nic-nac/trade-requests.test.ts',
      'tests/amethyst-request-rep-target.test.ts',
      'tests/amethyst-preview-rep.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/multi-rep-isolation-smoke.test.ts tests/nic-nac/attack-5-poisoned-rep-notes.test.ts tests/nic-nac/show-sessions.test.ts tests/amethyst-request-rep-target.test.ts tests/amethyst-preview-rep.test.ts',
      note: 'Provider-free two-rep smoke plus focused isolation checks for rep-scoped memory, show context, and Amethyst target resolution.',
    },
    defaultProviderActions: [],
    nextAction:
      'Run the two-rep smoke against route-level adapters once the launch report runner accepts composed Phase 11 smoke artifacts.',
  },
  {
    id: 'error-recovery',
    label: 'Error recovery',
    status: 'covered',
    evidenceFiles: [
      'tests/prelaunch-provider-recovery-contract.test.ts',
      'tests/prelaunch/prelaunch-payment-gates-route.test.ts',
      'tests/prelaunch/prelaunch-signwell-route.test.ts',
      'tests/nic-nac/send-sms-notification.test.ts',
      'tests/nic-nac/send-email-notification.test.ts',
      'tests/services/photo-enhancement-queue.test.ts',
      'tests/services/message-send-limits.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/prelaunch-provider-recovery-contract.test.ts tests/prelaunch/prelaunch-payment-gates-route.test.ts tests/prelaunch/prelaunch-signwell-route.test.ts',
      note: 'Provider-free contract tests for disabled checkout, SignWell blocked sends, and recovery evidence.',
    },
    defaultProviderActions: [],
    nextAction:
      'Fold the existing recovery contracts into Phase 11 smoke reporting so blocked provider states show as expected recovery paths.',
  },
  {
    id: 'mobile-final-responsive',
    label: 'Mobile / final responsive',
    status: 'missing',
    evidenceFiles: [
      'docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md',
      'tests/amethyst-homepage-template.test.ts',
      'tests/amethyst-join-template.test.ts',
      'tests/amethyst-trade-template.test.ts',
      'tests/nic-nac-dashboard-placeholder.test.ts',
      'tests/prelaunch/prelaunch-icon-metadata.test.ts',
    ],
    safeSmokeCommand: {
      command: 'npm exec vitest run tests/amethyst-homepage-template.test.ts tests/amethyst-join-template.test.ts tests/amethyst-trade-template.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/prelaunch/prelaunch-icon-metadata.test.ts',
      note: 'CSS and metadata safeguards only; this is not a rendered viewport smoke.',
    },
    defaultProviderActions: [],
    nextAction:
      'Add rendered mobile viewport smoke for /prelaunch, /nic-nac, and Amethyst homepage and trade surfaces.',
  },
]
