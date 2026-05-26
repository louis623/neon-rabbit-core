export type MultiRepIsolationState = 'isolated' | 'leak_detected'

export interface MultiRepIsolationProviderActions {
  sendSms: false
  sendEmail: false
  chargeStripe: false
  sendSignWellLiveAgreement: false
  callPhotoroom: false
  callPostHog: false
}

export interface MultiRepIsolationStep {
  id: string
  label: string
  ok: boolean
  providerAction: false
  details: Record<string, unknown>
}

export interface MultiRepIsolationLeak {
  ownerRepId: string
  exposedInRepId: string
  surface: 'workspace' | 'public_site'
  value: string
}

export interface MultiRepIsolationWorkspaceSnapshot {
  repId: string
  route: string
  listingIds?: string[]
  tradeRequestIds?: string[]
  audienceMemberIds?: string[]
  showSessionIds?: string[]
}

export interface MultiRepIsolationPublicSiteSnapshot {
  repId: string
  route: string
  host: string
  listingIds?: string[]
  audienceSignupIds?: string[]
}

export interface MultiRepIsolationRepInput {
  repId: string
  publicHost?: string
  ownedWorkspaceIds?: string[]
  ownedPublicSiteIds?: string[]
}

export interface MultiRepIsolationDependencyInput {
  repId: string
  publicHost?: string
  now: Date
  providerFree: true
}

export interface MultiRepIsolationDependencies {
  loadWorkspaceRoute?: (
    input: Omit<MultiRepIsolationDependencyInput, 'publicHost'>,
  ) => Promise<MultiRepIsolationWorkspaceSnapshot>
  loadPublicSiteRoute?: (
    input: MultiRepIsolationDependencyInput,
  ) => Promise<MultiRepIsolationPublicSiteSnapshot>
}

export interface MultiRepIsolationInput {
  reps: [MultiRepIsolationRepInput, MultiRepIsolationRepInput]
  now?: Date
  dependencies?: MultiRepIsolationDependencies & Record<string, unknown>
}

export interface MultiRepIsolationReport {
  ok: boolean
  isolationState: MultiRepIsolationState
  reps: string[]
  steps: MultiRepIsolationStep[]
  leaks: MultiRepIsolationLeak[]
  providerActions: MultiRepIsolationProviderActions
  nextEvidenceSuggestions: string[]
}

interface LoadedRepSnapshot {
  repId: string
  ownedWorkspaceIds?: string[]
  ownedPublicSiteIds?: string[]
  workspace: MultiRepIsolationWorkspaceSnapshot
  publicSite: MultiRepIsolationPublicSiteSnapshot
}

const PROVIDER_ACTIONS: MultiRepIsolationProviderActions = {
  sendSms: false,
  sendEmail: false,
  chargeStripe: false,
  sendSignWellLiveAgreement: false,
  callPhotoroom: false,
  callPostHog: false,
}

function step(
  id: string,
  label: string,
  ok: boolean,
  details: Record<string, unknown>,
): MultiRepIsolationStep {
  return {
    id,
    label,
    ok,
    providerAction: false,
    details,
  }
}

function stepSuffix(repId: string) {
  return repId.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_')
}

async function defaultWorkspaceRoute(
  input: Omit<MultiRepIsolationDependencyInput, 'publicHost'>,
): Promise<MultiRepIsolationWorkspaceSnapshot> {
  return {
    repId: input.repId,
    route: '/api/nic-nac/workspace',
    listingIds: [],
    tradeRequestIds: [],
    audienceMemberIds: [],
    showSessionIds: [],
  }
}

async function defaultPublicSiteRoute(
  input: MultiRepIsolationDependencyInput,
): Promise<MultiRepIsolationPublicSiteSnapshot> {
  return {
    repId: input.repId,
    route: '/api/amethyst/public-site',
    host: input.publicHost ?? 'localhost',
    listingIds: [],
    audienceSignupIds: [],
  }
}

function workspaceValues(snapshot: MultiRepIsolationWorkspaceSnapshot) {
  return [
    ...(snapshot.listingIds ?? []),
    ...(snapshot.tradeRequestIds ?? []),
    ...(snapshot.audienceMemberIds ?? []),
    ...(snapshot.showSessionIds ?? []),
  ]
}

function publicSiteValues(snapshot: MultiRepIsolationPublicSiteSnapshot) {
  return [
    ...(snapshot.listingIds ?? []),
    ...(snapshot.audienceSignupIds ?? []),
  ]
}

function ownedWorkspaceValues(snapshot: LoadedRepSnapshot) {
  return snapshot.ownedWorkspaceIds ?? workspaceValues(snapshot.workspace)
}

function ownedPublicSiteValues(snapshot: LoadedRepSnapshot) {
  return snapshot.ownedPublicSiteIds ?? publicSiteValues(snapshot.publicSite)
}

function findLeaks(snapshots: LoadedRepSnapshot[]): MultiRepIsolationLeak[] {
  const leaks: MultiRepIsolationLeak[] = []

  for (const exposed of snapshots) {
    const workspaceExposed = new Set(workspaceValues(exposed.workspace))
    const publicExposed = new Set(publicSiteValues(exposed.publicSite))

    for (const owner of snapshots) {
      if (owner.repId === exposed.repId) continue

      for (const value of ownedWorkspaceValues(owner)) {
        if (!workspaceExposed.has(value)) continue
        leaks.push({
          ownerRepId: owner.repId,
          exposedInRepId: exposed.repId,
          surface: 'workspace',
          value,
        })
      }

      for (const value of ownedPublicSiteValues(owner)) {
        if (!publicExposed.has(value)) continue
        leaks.push({
          ownerRepId: owner.repId,
          exposedInRepId: exposed.repId,
          surface: 'public_site',
          value,
        })
      }
    }
  }

  return leaks
}

function evidenceSuggestions(state: MultiRepIsolationState): string[] {
  const suggestions = [
    'Attach this report to the multi-rep Phase 11 evidence bundle.',
    'Keep the providerActions block in the smoke artifact for launch signoff.',
  ]

  if (state === 'leak_detected') {
    suggestions.push(
      'Fix the rep-scoping leak before launch signoff and rerun this smoke.',
    )
  }

  return suggestions
}

export async function runMultiRepIsolationSmoke(
  input: MultiRepIsolationInput,
): Promise<MultiRepIsolationReport> {
  const dependencies = input.dependencies ?? {}
  const now = input.now ?? new Date()
  const steps: MultiRepIsolationStep[] = []
  const snapshots: LoadedRepSnapshot[] = []

  for (const rep of input.reps) {
    const workspace = await (
      dependencies.loadWorkspaceRoute ?? defaultWorkspaceRoute
    )({
      repId: rep.repId,
      now,
      providerFree: true,
    })
    steps.push(
      step(
        `workspace_${stepSuffix(rep.repId)}`,
        `Workspace route for ${rep.repId}`,
        workspace.repId === rep.repId,
        {
          requestedRepId: rep.repId,
          returnedRepId: workspace.repId,
          route: workspace.route,
          itemCount: workspaceValues(workspace).length,
        },
      ),
    )

    const publicSite = await (
      dependencies.loadPublicSiteRoute ?? defaultPublicSiteRoute
    )({
      repId: rep.repId,
      publicHost: rep.publicHost,
      now,
      providerFree: true,
    })
    steps.push(
      step(
        `public_site_${stepSuffix(rep.repId)}`,
        `Public-site route for ${rep.repId}`,
        publicSite.repId === rep.repId,
        {
          requestedRepId: rep.repId,
          returnedRepId: publicSite.repId,
          route: publicSite.route,
          host: publicSite.host,
          itemCount: publicSiteValues(publicSite).length,
        },
      ),
    )

    snapshots.push({
      repId: rep.repId,
      ownedWorkspaceIds: rep.ownedWorkspaceIds,
      ownedPublicSiteIds: rep.ownedPublicSiteIds,
      workspace,
      publicSite,
    })
  }

  const leaks = findLeaks(snapshots)
  const isolationState: MultiRepIsolationState =
    leaks.length === 0 ? 'isolated' : 'leak_detected'
  steps.push(
    step('cross_rep_leak_check', 'Cross-rep leak check', leaks.length === 0, {
      checkedRepIds: input.reps.map((rep) => rep.repId),
      leakCount: leaks.length,
      leaks,
    }),
  )

  return {
    ok: steps.every((item) => item.ok),
    isolationState,
    reps: input.reps.map((rep) => rep.repId),
    steps,
    leaks,
    providerActions: PROVIDER_ACTIONS,
    nextEvidenceSuggestions: evidenceSuggestions(isolationState),
  }
}
