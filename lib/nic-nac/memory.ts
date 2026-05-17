export const REP_MEMORY_TYPES = [
  'preference',
  'show_process',
  'customer_pattern',
  'follow_up',
  'show_summary',
  'issue',
  'general',
] as const

export type RepMemoryType = (typeof REP_MEMORY_TYPES)[number]

export const REP_MEMORY_SOURCES = [
  'explicit',
  'automatic_high_signal',
  'guarded',
] as const

export type RepMemorySource = (typeof REP_MEMORY_SOURCES)[number]

export const DEFAULT_REP_MEMORY_TYPE: RepMemoryType = 'general'
export const DEFAULT_REP_MEMORY_SOURCE: RepMemorySource = 'automatic_high_signal'
