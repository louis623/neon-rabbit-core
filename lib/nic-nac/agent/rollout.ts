export type NicNacAgentRolloutIdentity = {
  repId: string
  email?: string | null
}

function isTruthy(value: string | undefined) {
  return /^(?:1|true|yes|on)$/i.test(value?.trim() ?? '')
}

function isFalsy(value: string | undefined) {
  return /^(?:0|false|no|off)$/i.test(value?.trim() ?? '')
}

function commaSeparatedSet(value: string | undefined) {
  return new Set(
    (value ?? '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean),
  )
}

/**
 * Production is default-off. An exact rep/email cohort can opt in without
 * enabling every workspace, and the explicit false value is a kill switch.
 * Local development and tests use the harness unless explicitly disabled.
 */
export function isNicNacAgentHarnessEnabled(
  identity: NicNacAgentRolloutIdentity,
  env: NodeJS.ProcessEnv = process.env,
) {
  const broadSetting = env.NIC_NAC_AGENT_HARNESS_ENABLED
  if (isFalsy(broadSetting)) return false
  if (isTruthy(broadSetting)) return true

  const repIds = commaSeparatedSet(env.NIC_NAC_AGENT_HARNESS_REP_IDS)
  if (repIds.has(identity.repId.trim().toLowerCase())) return true

  const email = identity.email?.trim().toLowerCase()
  const emails = commaSeparatedSet(env.NIC_NAC_AGENT_HARNESS_EMAILS)
  if (email && emails.has(email)) return true

  return env.NODE_ENV !== 'production'
}

/** Fast path used before authentication so ordinary production traffic does
 * not pay for a duplicate identity lookup while the harness is default-off. */
export function canNicNacAgentHarnessBeEnabled(
  env: NodeJS.ProcessEnv = process.env,
) {
  const broadSetting = env.NIC_NAC_AGENT_HARNESS_ENABLED
  if (isFalsy(broadSetting)) return false
  if (isTruthy(broadSetting)) return true
  if (commaSeparatedSet(env.NIC_NAC_AGENT_HARNESS_REP_IDS).size > 0) return true
  if (commaSeparatedSet(env.NIC_NAC_AGENT_HARNESS_EMAILS).size > 0) return true
  return env.NODE_ENV !== 'production'
}
