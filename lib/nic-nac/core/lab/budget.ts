export type SparkleLabRunType = 'weekly' | 'manual' | 'urgent'

export type SparkleLabLimitHit =
  | 'cost_cap'
  | 'monthly_scheduled_cap'
  | 'model_call_cap'
  | 'premium_call_cap'
  | 'runtime_cap'
  | 'candidate_record_cap'
  | 'deep_item_cap'
  | 'headline_finding_cap'
  | 'active_priority_cap'

export interface SparkleLabCaps {
  runType: SparkleLabRunType
  costCapCents: number
  monthlyScheduledCapCents?: number
  modelCallCap: number
  premiumCallCap: number
  runtimeCapSeconds: number
  candidateRecordCap: number
  deepItemCap: number
  headlineFindingCap: number
  activePriorityCap: number
}

export interface SparkleLabUsage {
  estimatedCostCents: number
  monthlyScheduledCostCents?: number
  modelCallCount: number
  premiumCallCount: number
  runtimeSeconds: number
  candidateRecordCount: number
  deepItemCount: number
  headlineFindingCount: number
  activePriorityCount: number
}

export type SparkleLabCapOverrides = Partial<
  Omit<SparkleLabCaps, 'runType'>
>

const DEFAULT_CAPS: Record<SparkleLabRunType, SparkleLabCaps> = {
  weekly: {
    runType: 'weekly',
    costCapCents: 500,
    monthlyScheduledCapCents: 2_000,
    modelCallCap: 20,
    premiumCallCap: 4,
    runtimeCapSeconds: 20 * 60,
    candidateRecordCap: 250,
    deepItemCap: 25,
    headlineFindingCap: 3,
    activePriorityCap: 2,
  },
  manual: {
    runType: 'manual',
    costCapCents: 200,
    modelCallCap: 8,
    premiumCallCap: 2,
    runtimeCapSeconds: 10 * 60,
    candidateRecordCap: 75,
    deepItemCap: 10,
    headlineFindingCap: 3,
    activePriorityCap: 2,
  },
  urgent: {
    runType: 'urgent',
    costCapCents: 300,
    modelCallCap: 10,
    premiumCallCap: 2,
    runtimeCapSeconds: 10 * 60,
    candidateRecordCap: 75,
    deepItemCap: 10,
    headlineFindingCap: 3,
    activePriorityCap: 2,
  },
}

export function getSparkleLabCaps(
  runType: SparkleLabRunType,
  overrides: SparkleLabCapOverrides = {},
): SparkleLabCaps {
  return {
    ...DEFAULT_CAPS[runType],
    ...overrides,
    runType,
  }
}

export function shouldStopSparkleLabRun(
  usage: SparkleLabUsage,
  caps: SparkleLabCaps,
): { shouldStop: boolean; limitsHit: SparkleLabLimitHit[] } {
  const limitsHit = getSparkleLabLimitsHit(usage, caps)
  const limitsExceeded = getSparkleLabLimitsExceeded(usage, caps)

  return {
    shouldStop: limitsExceeded.length > 0,
    limitsHit,
  }
}

export function getSparkleLabLimitsHit(
  usage: SparkleLabUsage,
  caps: SparkleLabCaps,
): SparkleLabLimitHit[] {
  return collectSparkleLabLimits(usage, caps, (value, cap) => value >= cap)
}

export function getSparkleLabLimitsExceeded(
  usage: SparkleLabUsage,
  caps: SparkleLabCaps,
): SparkleLabLimitHit[] {
  return collectSparkleLabLimits(usage, caps, (value, cap) => value > cap)
}

function collectSparkleLabLimits(
  usage: SparkleLabUsage,
  caps: SparkleLabCaps,
  isLimitReached: (usage: number, cap: number) => boolean,
): SparkleLabLimitHit[] {
  const limitsHit: SparkleLabLimitHit[] = []

  addLimitHit(
    limitsHit,
    usage.estimatedCostCents,
    caps.costCapCents,
    'cost_cap',
    isLimitReached,
  )
  if (caps.monthlyScheduledCapCents !== undefined) {
    addLimitHit(
      limitsHit,
      usage.monthlyScheduledCostCents ?? 0,
      caps.monthlyScheduledCapCents,
      'monthly_scheduled_cap',
      isLimitReached,
    )
  }
  addLimitHit(
    limitsHit,
    usage.modelCallCount,
    caps.modelCallCap,
    'model_call_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.premiumCallCount,
    caps.premiumCallCap,
    'premium_call_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.runtimeSeconds,
    caps.runtimeCapSeconds,
    'runtime_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.candidateRecordCount,
    caps.candidateRecordCap,
    'candidate_record_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.deepItemCount,
    caps.deepItemCap,
    'deep_item_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.headlineFindingCount,
    caps.headlineFindingCap,
    'headline_finding_cap',
    isLimitReached,
  )
  addLimitHit(
    limitsHit,
    usage.activePriorityCount,
    caps.activePriorityCap,
    'active_priority_cap',
    isLimitReached,
  )

  return limitsHit
}

function addLimitHit(
  limitsHit: SparkleLabLimitHit[],
  usage: number,
  cap: number,
  limit: SparkleLabLimitHit,
  isLimitReached: (usage: number, cap: number) => boolean,
) {
  if (isLimitReached(usage, cap)) limitsHit.push(limit)
}
