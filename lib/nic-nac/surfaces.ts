export const NIC_NAC_SURFACES = [
  'public_landing',
  'rep_workspace',
  'customer_site',
  'sparkle_finder',
] as const

export type NicNacSurface = (typeof NIC_NAC_SURFACES)[number]
