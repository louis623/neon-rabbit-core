import type { NicNacSurface } from '@/lib/nic-nac/surfaces'

export type NicNacProduct =
  | 'sparkle_suite'
  | 'sparkle_finder'
  | 'sparkle_lab'

export type NicNacProductSurface =
  | NicNacSurface
  | 'sparkle_lab'
  | 'operator_support_workspace'

export type NicNacActorType =
  | 'rep'
  | 'collector'
  | 'public_visitor'
  | 'operator'

export type NicNacAccountTier =
  | 'none'
  | 'free'
  | 'silver'
  | 'suite_rep'
  | 'operator'

export interface NicNacProductActor {
  type: NicNacActorType
  accountTier: NicNacAccountTier
  userId?: string
  suiteRepId?: string
  linkedSuiteRepId?: string
  finderUserId?: string
  operatorRepId?: string
  supportSessionId?: string
  subjectUserId?: string
}

export function createSuiteOperatorSupportProductContext(input: {
  targetRepId: string
  targetUserId?: string
  operatorRepId: string
  supportSessionId: string
}): NicNacProductContext {
  return {
    product: 'sparkle_suite',
    surface: 'operator_support_workspace',
    actor: {
      type: 'operator',
      accountTier: 'operator',
      suiteRepId: input.targetRepId,
      linkedSuiteRepId: input.targetRepId,
      operatorRepId: input.operatorRepId,
      supportSessionId: input.supportSessionId,
      subjectUserId: input.targetUserId,
    },
    permissions: {
      canReadSharedMemory: true,
      canWriteSharedMemory: true,
      canMutateSuiteWorkspace: true,
      canMutateFinderAccount: false,
      canRunSparkleLab: false,
    },
  }
}

export interface NicNacProductPermissions {
  canReadSharedMemory: boolean
  canWriteSharedMemory: boolean
  canMutateSuiteWorkspace: boolean
  canMutateFinderAccount: boolean
  canRunSparkleLab: boolean
}

export interface NicNacProductContext {
  product: NicNacProduct
  surface: NicNacProductSurface
  actor: NicNacProductActor
  permissions: NicNacProductPermissions
  publicSiteSlug?: string
}

export function createSuiteRepWorkspaceProductContext(input: {
  repId: string
  userId?: string
}): NicNacProductContext {
  return {
    product: 'sparkle_suite',
    surface: 'rep_workspace',
    actor: {
      type: 'rep',
      accountTier: 'suite_rep',
      userId: input.userId,
      suiteRepId: input.repId,
      linkedSuiteRepId: input.repId,
    },
    permissions: {
      canReadSharedMemory: true,
      canWriteSharedMemory: true,
      canMutateSuiteWorkspace: true,
      canMutateFinderAccount: false,
      canRunSparkleLab: false,
    },
  }
}

export function createSuitePublicLandingProductContext(): NicNacProductContext {
  return {
    product: 'sparkle_suite',
    surface: 'public_landing',
    actor: {
      type: 'public_visitor',
      accountTier: 'none',
    },
    permissions: {
      canReadSharedMemory: false,
      canWriteSharedMemory: false,
      canMutateSuiteWorkspace: false,
      canMutateFinderAccount: false,
      canRunSparkleLab: false,
    },
  }
}

export function createSuiteCustomerSiteProductContext(input: {
  publicSiteSlug?: string
  suiteRepId?: string
} = {}): NicNacProductContext {
  return {
    product: 'sparkle_suite',
    surface: 'customer_site',
    publicSiteSlug: input.publicSiteSlug,
    actor: {
      type: 'public_visitor',
      accountTier: 'none',
      suiteRepId: input.suiteRepId,
    },
    permissions: {
      canReadSharedMemory: false,
      canWriteSharedMemory: false,
      canMutateSuiteWorkspace: false,
      canMutateFinderAccount: false,
      canRunSparkleLab: false,
    },
  }
}

export function createSparkleFinderProductContext(input: {
  finderUserId?: string
  linkedSuiteRepId?: string
  accountTier?: Extract<NicNacAccountTier, 'free' | 'silver'>
} = {}): NicNacProductContext {
  const isLinkedRep = Boolean(input.linkedSuiteRepId)
  const accountTier = input.accountTier ?? 'free'
  const canUseFinderMutationTools = accountTier === 'silver'

  return {
    product: 'sparkle_finder',
    surface: 'sparkle_finder',
    actor: {
      type: isLinkedRep ? 'rep' : 'collector',
      accountTier,
      finderUserId: input.finderUserId,
      linkedSuiteRepId: input.linkedSuiteRepId,
    },
    permissions: {
      canReadSharedMemory: isLinkedRep,
      canWriteSharedMemory: isLinkedRep,
      canMutateSuiteWorkspace: false,
      canMutateFinderAccount: canUseFinderMutationTools,
      canRunSparkleLab: false,
    },
  }
}

export function createSparkleLabProductContext(input: {
  operatorUserId?: string
} = {}): NicNacProductContext {
  return {
    product: 'sparkle_lab',
    surface: 'sparkle_lab',
    actor: {
      type: 'operator',
      accountTier: 'operator',
      userId: input.operatorUserId,
    },
    permissions: {
      canReadSharedMemory: false,
      canWriteSharedMemory: false,
      canMutateSuiteWorkspace: false,
      canMutateFinderAccount: false,
      canRunSparkleLab: true,
    },
  }
}
