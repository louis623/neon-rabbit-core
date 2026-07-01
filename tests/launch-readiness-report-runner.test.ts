import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { describe, expect, it } from 'vitest'

import {
  buildLaunchReadinessReport,
  formatLaunchReadinessReportText,
  parseLaunchReadinessReportArgs,
  runLaunchReadinessReportFromArtifacts,
  writeLaunchReadinessReport,
} from '@/lib/launch-readiness/launch-report-runner'
import type { CancellationSmokeReport } from '@/lib/launch-readiness/cancellation-smoke'
import type { LiveShowSmokeReport } from '@/lib/launch-readiness/live-show-smoke'
import type { MultiRepIsolationReport } from '@/lib/launch-readiness/multi-rep-isolation-smoke'
import type { OnboardingSmokeReport } from '@/lib/launch-readiness/onboarding-smoke'
import type { RecipeChatSmokeResult } from '@/scripts/smoke-nic-nac-recipe-chat'

const generatedAt = new Date('2026-05-26T18:30:00.000Z')

const onboardingCovered: OnboardingSmokeReport = {
  ok: true,
  target: 'local',
  generatedAt: '2026-05-26T18:30:00.000Z',
  onboardingState: 'ready',
  leadEmail: 'demo@example.com',
  providerActions: {
    sendSms: false,
    sendEmail: false,
    sendSignWellLiveAgreement: false,
    chargeStripe: false,
    callPaidNicNac: false,
    attachReservedPhone: false,
  },
  steps: [
    {
      id: 'launch_build_ready',
      label: 'Launch build ready',
      ok: true,
      providerAction: false,
      details: {
        stage: 'ready_for_launch',
        status: 'ready',
      },
    },
  ],
  nextEvidenceSuggestions: [
    'Attach this report to the onboarding Phase 11 evidence bundle.',
  ],
}

const liveShowCovered: LiveShowSmokeReport = {
  ok: true,
  queueState: 'fresh',
  providerActions: {
    sendSms: false,
    sendEmail: false,
    chargeStripe: false,
    sendSignWellLiveAgreement: false,
    callPhotoroom: false,
    callPostHog: false,
  },
  steps: [
    {
      id: 'live_queue_snapshot',
      label: 'Live queue snapshot',
      ok: true,
      providerAction: false,
      details: {
        queueState: 'fresh',
        queueLength: 2,
      },
    },
  ],
  nextEvidenceSuggestions: [
    'Attach this report to the live-show Phase 11 evidence bundle.',
  ],
}

const cancellationCovered: CancellationSmokeReport = {
  ok: true,
  cancellationState: 'ends_at_period_end',
  providerActions: {
    retrieveStripeSubscription: false,
    cancelStripeSubscription: false,
    createStripeRefund: false,
    createBillingPortalSession: false,
    constructStripeWebhook: false,
  },
  steps: [
    {
      id: 'end_of_period_state',
      label: 'End-of-period cancellation state',
      ok: true,
      providerAction: false,
      details: {
        cancelAtPeriodEnd: true,
      },
    },
  ],
  nextEvidenceSuggestions: [
    'Attach this report to the cancellation Phase 11 evidence bundle.',
  ],
}

const dashboardNicNacCovered: RecipeChatSmokeResult = {
  ok: true,
  status: 'passed',
  appUrl: 'https://sparkle-suite-demo.vercel.app',
  conversationId: 'recipe-chat-conversation',
  rep: { id: 'rep-1', email: 'sparkle-reviewer@example.com' },
  turns: [
    {
      turn: 'draft_recipe',
      runId: 'run-draft',
      assistantText: 'I built the recipe draft.',
      observedTools: ['build_site_recipe_draft'],
    },
    {
      turn: 'save_recipe',
      runId: 'run-save',
      assistantText: 'I saved the Pantry recipe.',
      observedTools: ['manage_site_recipes'],
    },
  ],
  recipeId: 'recipe-1',
  cleanup: { skipped: false, removedRecipeIds: ['recipe-1'] },
  message:
    'Nic-Nac recipe chat smoke passed through draft, save, and recipe database assertions.',
}

const dashboardNicNacFailed: RecipeChatSmokeResult = {
  ok: false,
  status: 'model_unavailable',
  appUrl: 'https://sparkle-suite-demo.vercel.app',
  conversationId: 'recipe-chat-conversation',
  turns: [
    {
      turn: 'draft_recipe',
      runId: 'run-draft',
      assistantText: '',
      observedTools: ['build_site_recipe_draft'],
    },
  ],
  message:
    'Nic-Nac selected build_site_recipe_draft, but the recipe-card vision builder reported MODEL_UNAVAILABLE.',
}

const dashboardNicNacQuotaBlocked: RecipeChatSmokeResult = {
  ok: true,
  status: 'model_unavailable',
  appUrl: 'https://sparkle-suite-demo.vercel.app',
  conversationId: 'recipe-chat-conversation',
  rep: {
    id: 'rep-1',
    email: 'sparkle-reviewer@example.com',
    displayName: 'Britt Test Rep',
  },
  turns: [],
  message:
    'error:insufficient_quota: You exceeded your current quota, please check your plan and billing details.',
}

const multiRepCovered: MultiRepIsolationReport = {
  ok: true,
  isolationState: 'isolated',
  reps: ['rep-a', 'rep-b'],
  providerActions: {
    sendSms: false,
    sendEmail: false,
    chargeStripe: false,
    sendSignWellLiveAgreement: false,
    callPhotoroom: false,
    callPostHog: false,
  },
  leaks: [],
  steps: [
    {
      id: 'cross_rep_leak_check',
      label: 'Cross-rep leak check',
      ok: true,
      providerAction: false,
      details: {
        leakCount: 0,
      },
    },
  ],
  nextEvidenceSuggestions: [
    'Attach this report to the multi-rep Phase 11 evidence bundle.',
  ],
}

describe('launch readiness report runner', () => {
  it('builds an offline aggregate report from the Phase 11 manifest', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      target: 'local',
    })

    expect(report.generatedAt).toBe('2026-05-26T18:30:00.000Z')
    expect(report.target).toBe('local')
    expect(report.safeByDefault).toBe(true)
    expect(report.providerActions).toEqual({
      sendSms: false,
      sendEmail: false,
      chargeStripe: false,
      sendSignWellLiveAgreement: false,
      callPhotoroom: false,
      callPostHog: false,
      retrieveStripeSubscription: false,
      cancelStripeSubscription: false,
      createStripeRefund: false,
      createBillingPortalSession: false,
      constructStripeWebhook: false,
    })
    expect(report.journeys).toHaveLength(9)
    expect(report.journeys.map((journey) => journey.id)).toEqual([
      'onboarding',
      'daily-workflow',
      'live-show',
      'post-show',
      'dashboard-nic-nac',
      'cancellation',
      'multi-rep-isolation',
      'error-recovery',
      'mobile-final-responsive',
    ])
    expect(report.summary).toEqual({
      total: 9,
      covered: 2,
      partial: 6,
      missing: 1,
      blocked: 1,
      ready: false,
    })
    expect(report.journeys.every((journey) => journey.defaultProviderActions.length === 0)).toBe(true)
    expect(report.journeys.find((journey) => journey.id === 'mobile-final-responsive')).toMatchObject({
      status: 'missing',
      blockedItems: [
        'Add rendered mobile viewport smoke for /prelaunch, /nic-nac, and Amethyst homepage and trade surfaces.',
      ],
    })
  })

  it('promotes composed and rendered smoke artifacts without running provider actions', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      target: 'local',
      composedSmokes: {
        onboarding: {
          artifactPath:
            '.local/launch-readiness-results/onboarding-2026-05-26.json',
          report: onboardingCovered,
        },
        'live-show': {
          artifactPath:
            '.local/launch-readiness-results/live-show-2026-05-26.json',
          report: liveShowCovered,
        },
      },
      renderedMobileSmoke: {
        ok: true,
        artifactPath:
          '.local/launch-readiness-results/rendered-mobile-2026-05-26.json',
        routes: [
          '/prelaunch',
          '/nic-nac',
          '/amethyst/Homepage.html',
          '/amethyst/Trade.html',
        ],
      },
    })

    expect(report.summary).toMatchObject({
      covered: 5,
      partial: 4,
      missing: 0,
      blocked: 0,
      ready: false,
    })
    expect(report.journeys.find((journey) => journey.id === 'onboarding')).toMatchObject({
      status: 'covered',
      smokeProof: {
        ok: true,
        artifactPath:
          '.local/launch-readiness-results/onboarding-2026-05-26.json',
        stepCount: 1,
      },
      blockedItems: [],
    })
    expect(report.journeys.find((journey) => journey.id === 'live-show')).toMatchObject({
      status: 'covered',
      smokeProof: {
        ok: true,
        artifactPath:
          '.local/launch-readiness-results/live-show-2026-05-26.json',
        stepCount: 1,
      },
      blockedItems: [],
    })
    expect(
      report.journeys.find((journey) => journey.id === 'mobile-final-responsive'),
    ).toMatchObject({
      status: 'covered',
      renderedProof: {
        ok: true,
        routeCount: 4,
        artifactPath:
          '.local/launch-readiness-results/rendered-mobile-2026-05-26.json',
      },
    })
    expect(Object.values(report.providerActions)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ])
  })

  it('keeps provider proof categories blocked until explicit approval evidence is attached', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      providerProofChecklist: [
        {
          id: 'photoroom_provider_proof',
          label: 'Photoroom provider proof',
          status: 'blocked',
          approvalGate: 'PHOTOROOM_PROVIDER_PROOF=true',
          evidence: [],
          defaultAction: 'blocked',
        },
        {
          id: 'signwell_provider_sandbox',
          label: 'SignWell sandbox provider draft',
          status: 'prepared',
          approvalGate: 'SIGNWELL_SANDBOX_PROVIDER_CALL=true',
          evidence: ['.local/launch-smoke-results/signwell-sandbox.json'],
          defaultAction: 'none',
        },
      ],
    })

    expect(report.providerProofChecklist).toEqual([
      {
        id: 'photoroom_provider_proof',
        label: 'Photoroom provider proof',
        status: 'blocked',
        approvalGate: 'PHOTOROOM_PROVIDER_PROOF=true',
        evidence: [],
        defaultAction: 'blocked',
      },
      {
        id: 'signwell_provider_sandbox',
        label: 'SignWell sandbox provider draft',
        status: 'prepared',
        approvalGate: 'SIGNWELL_SANDBOX_PROVIDER_CALL=true',
        evidence: ['.local/launch-smoke-results/signwell-sandbox.json'],
        defaultAction: 'none',
      },
    ])
    expect(report.summary.ready).toBe(false)
    expect(report.summary.blocked).toBe(2)
  })

  it('downgrades Dashboard / Nic-Nac when an attached recipe chat artifact fails', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      composedSmokes: {
        'dashboard-nic-nac': {
          artifactPath:
            '.local/launch-readiness-results/dashboard-nic-nac-failed.json',
          report: dashboardNicNacFailed,
        },
      },
    })

    expect(report.summary).toMatchObject({
      covered: 1,
      partial: 7,
      missing: 1,
      blocked: 1,
      ready: false,
    })
    expect(report.journeys.find((journey) => journey.id === 'dashboard-nic-nac')).toMatchObject({
      status: 'partial',
      smokeProof: {
        ok: false,
        stepCount: 1,
        artifactPath:
          '.local/launch-readiness-results/dashboard-nic-nac-failed.json',
      },
      blockedItems: [
        'Nic-Nac selected build_site_recipe_draft, but the recipe-card vision builder reported MODEL_UNAVAILABLE.',
      ],
    })
  })

  it('does not promote Dashboard / Nic-Nac for quota-blocked provider-free recipe chat artifacts', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      composedSmokes: {
        'dashboard-nic-nac': {
          artifactPath:
            '.local/launch-readiness-results/nic-nac-recipe-chat-latest.json',
          report: dashboardNicNacQuotaBlocked,
        },
      },
    })

    expect(report.summary).toMatchObject({
      covered: 1,
      partial: 7,
      missing: 1,
      blocked: 1,
      ready: false,
    })
    expect(report.journeys.find((journey) => journey.id === 'dashboard-nic-nac')).toMatchObject({
      status: 'partial',
      smokeProof: {
        ok: false,
        stepCount: 0,
        artifactPath:
          '.local/launch-readiness-results/nic-nac-recipe-chat-latest.json',
      },
      blockedItems: [
        'error:insufficient_quota: You exceeded your current quota, please check your plan and billing details.',
      ],
    })
  })

  it('writes a readable artifact under the supplied output directory', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'launch-readiness-'))
    try {
      const report = buildLaunchReadinessReport({
        generatedAt,
        target: 'preview',
      })

      const outputPath = await writeLaunchReadinessReport(report, { outputDir })
      const written = JSON.parse(await readFile(outputPath, 'utf8'))

      expect(outputPath).toContain('launch-readiness-preview-2026-05-26T18-30-00-000Z.json')
      expect(written).toMatchObject({
        target: 'preview',
        summary: {
          total: 9,
          ready: false,
        },
      })
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })

  it('parses safe report-runner CLI options without enabling live actions', () => {
    expect(
      parseLaunchReadinessReportArgs([
        '--target',
        'preview',
        '--launch-smoke-report',
        '.local/launch-smoke-results/launch-preview.json',
        '--onboarding-report',
        '.local/launch-readiness-results/onboarding.json',
        '--live-show-report',
        '.local/launch-readiness-results/live-show.json',
        '--dashboard-nic-nac-report',
        '.local/launch-readiness-results/dashboard-nic-nac.json',
        '--rendered-mobile-report',
        '.local/rendered-smoke/mobile.json',
        '--write-report',
        '--json',
      ]),
    ).toEqual({
      target: 'preview',
      json: true,
      writeReport: true,
      launchSmokeReportPath: '.local/launch-smoke-results/launch-preview.json',
      onboardingReportPath: '.local/launch-readiness-results/onboarding.json',
      liveShowReportPath: '.local/launch-readiness-results/live-show.json',
      dashboardNicNacReportPath:
        '.local/launch-readiness-results/dashboard-nic-nac.json',
      cancellationReportPath: null,
      multiRepIsolationReportPath: null,
      renderedMobileReportPath: '.local/rendered-smoke/mobile.json',
    })

    expect(parseLaunchReadinessReportArgs([])).toEqual({
      target: null,
      json: false,
      writeReport: false,
      launchSmokeReportPath: null,
      onboardingReportPath: null,
      liveShowReportPath: null,
      dashboardNicNacReportPath: null,
      cancellationReportPath: null,
      multiRepIsolationReportPath: null,
      renderedMobileReportPath: null,
    })

    expect(() =>
      parseLaunchReadinessReportArgs(['--target', 'production']),
    ).toThrow('--target must be one of: local, preview')
    expect(() =>
      parseLaunchReadinessReportArgs(['--unknown']),
    ).toThrow('Unknown launch readiness report option: --unknown')
  })

  it('builds the aggregate report from existing JSON artifacts without executing smokes', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'launch-readiness-inputs-'))
    try {
      const launchSmokePath = join(outputDir, 'launch-smoke.json')
      const onboardingPath = join(outputDir, 'onboarding.json')
      const liveShowPath = join(outputDir, 'live-show.json')
      const dashboardNicNacPath = join(outputDir, 'dashboard-nic-nac.json')
      const renderedMobilePath = join(outputDir, 'rendered-mobile.json')

      await Promise.all([
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(
            launchSmokePath,
            JSON.stringify({
              generatedAt: generatedAt.toISOString(),
              target: 'preview',
              ok: true,
              categories: [
                {
                  category: 'local_static',
                  ok: true,
                  results: [{ id: 'static', ok: true, detail: 'ok' }],
                },
              ],
            }),
            'utf8',
          ),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(onboardingPath, JSON.stringify(onboardingCovered), 'utf8'),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(liveShowPath, JSON.stringify(liveShowCovered), 'utf8'),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(
            dashboardNicNacPath,
            JSON.stringify(dashboardNicNacCovered),
            'utf8',
          ),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(
            renderedMobilePath,
            JSON.stringify({
              ok: true,
              routes: ['/prelaunch', '/nic-nac'],
            }),
            'utf8',
          ),
        ),
      ])

      const result = await runLaunchReadinessReportFromArtifacts({
        generatedAt,
        launchSmokeReportPath: launchSmokePath,
        onboardingReportPath: onboardingPath,
        liveShowReportPath: liveShowPath,
        dashboardNicNacReportPath: dashboardNicNacPath,
        renderedMobileReportPath: renderedMobilePath,
        writeReport: true,
        outputDir,
      })

      expect(result.outputPath).toContain(
        'launch-readiness-preview-2026-05-26T18-30-00-000Z.json',
      )
      expect(result.report.target).toBe('preview')
      expect(result.report.journeys.find((journey) => journey.id === 'onboarding')).toMatchObject({
        status: 'covered',
        smokeProof: {
          artifactPath: onboardingPath,
          ok: true,
        },
      })
      expect(result.report.journeys.find((journey) => journey.id === 'live-show')).toMatchObject({
        status: 'covered',
        smokeProof: {
          artifactPath: liveShowPath,
          ok: true,
        },
        launchSmokeCategories: ['local_static'],
      })
      expect(result.report.journeys.find((journey) => journey.id === 'dashboard-nic-nac')).toMatchObject({
        status: 'covered',
        smokeProof: {
          artifactPath: dashboardNicNacPath,
          ok: true,
          stepCount: 2,
        },
      })
      expect(
        result.report.journeys.find(
          (journey) => journey.id === 'mobile-final-responsive',
        ),
      ).toMatchObject({
        status: 'covered',
        renderedProof: {
          artifactPath: renderedMobilePath,
          ok: true,
          routeCount: 2,
        },
      })
      expect(Object.values(result.report.providerActions)).toEqual([
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
        false,
      ])
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })

  it('infers preview target through parsed CLI options and promotes cancellation and isolation artifacts', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'launch-readiness-cli-'))
    try {
      const launchSmokePath = join(outputDir, 'launch-smoke-preview.json')
      const cancellationPath = join(outputDir, 'cancellation.json')
      const multiRepPath = join(outputDir, 'multi-rep.json')

      await Promise.all([
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(
            launchSmokePath,
            JSON.stringify({
              generatedAt: generatedAt.toISOString(),
              target: 'preview',
              ok: true,
              categories: [],
            }),
            'utf8',
          ),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(
            cancellationPath,
            JSON.stringify(cancellationCovered),
            'utf8',
          ),
        ),
        import('node:fs/promises').then(({ writeFile }) =>
          writeFile(multiRepPath, JSON.stringify(multiRepCovered), 'utf8'),
        ),
      ])

      const parsed = parseLaunchReadinessReportArgs([
        '--launch-smoke-report',
        launchSmokePath,
        '--cancellation-report',
        cancellationPath,
        '--multi-rep-isolation-report',
        multiRepPath,
      ])

      const result = await runLaunchReadinessReportFromArtifacts({
        ...parsed,
        generatedAt,
      })

      expect(result.report.target).toBe('preview')
      expect(result.report.journeys.find((journey) => journey.id === 'cancellation')).toMatchObject({
        status: 'covered',
        smokeProof: {
          artifactPath: cancellationPath,
          stepCount: 1,
        },
      })
      expect(
        result.report.journeys.find(
          (journey) => journey.id === 'multi-rep-isolation',
        ),
      ).toMatchObject({
        status: 'covered',
        smokeProof: {
          artifactPath: multiRepPath,
          stepCount: 1,
        },
      })
    } finally {
      await rm(outputDir, { recursive: true, force: true })
    }
  })

  it('formats a concise human-readable readiness summary', () => {
    const report = buildLaunchReadinessReport({
      generatedAt,
      target: 'local',
      composedSmokes: {
        'live-show': {
          artifactPath: '.local/launch-readiness-results/live-show.json',
          report: liveShowCovered,
        },
      },
    })

    expect(formatLaunchReadinessReportText(report)).toContain(
      '[launch-readiness] target=local ready=false covered=3 partial=5 missing=1 blocked=1',
    )
    expect(formatLaunchReadinessReportText(report)).toContain(
      '- covered Live show',
    )
    expect(formatLaunchReadinessReportText(report)).toContain(
      '- missing Mobile / final responsive',
    )
    expect(formatLaunchReadinessReportText(report)).toContain(
      'provider_actions=none',
    )
  })
})
