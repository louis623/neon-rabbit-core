import { AuthError, getAuthenticatedRep } from './auth'
import { createAdminClient } from './admin'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const CONTROL_CENTER_SESSION_COOKIE = 'sparkle_control_center_session'
const CONTROL_CENTER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

export class OperatorAuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'OperatorAuthError'
  }
}

function getOperatorEmails() {
  const configured = process.env.INTERNAL_OPERATOR_EMAILS
  if (!configured) return ['louis@neonrabbit.net']
  return configured
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean)
}

function isControlCenterDevAuthBypassEnabled() {
  return process.env.NODE_ENV === 'development'
}

async function getDevBypassOperator() {
  const email = getOperatorEmails()[0] ?? 'louis@neonrabbit.net'
  const admin = createAdminClient()
  const { data: rep, error } = await admin
    .from('reps')
    .select('id, auth_user_id, email, display_name, business_name, stripe_customer_id, public_site_slug, time_zone')
    .eq('email', email)
    .single()

  if (error || !rep) {
    throw new AuthError('Dev operator rep not found')
  }

  return { repId: rep.id as string, rep }
}

export async function getAuthenticatedOperator() {
  let context: Awaited<ReturnType<typeof getAuthenticatedRep>>

  try {
    context = await getAuthenticatedRep()
  } catch (error) {
    if (error instanceof AuthError && isControlCenterDevAuthBypassEnabled()) {
      context = await getDevBypassOperator()
    } else {
      throw error
    }
  }

  const email = context.rep.email.trim().toLowerCase()

  if (!getOperatorEmails().includes(email)) {
    throw new OperatorAuthError('Authenticated rep is not an operator')
  }

  return context
}

function controlCenterSecrets() {
  const accessCode = process.env.CONTROL_CENTER_ACCESS_CODE
  const sessionSecret = process.env.CONTROL_CENTER_SESSION_SECRET
  return accessCode && sessionSecret ? { accessCode, sessionSecret } : null
}

function signControlCenterSession(expiresAt: number, sessionSecret: string) {
  const payload = String(expiresAt)
  const signature = createHmac('sha256', sessionSecret).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

export function isValidControlCenterAccessCode(value: string) {
  const secrets = controlCenterSecrets()
  if (!secrets) return false
  const actual = Buffer.from(value)
  const expected = Buffer.from(secrets.accessCode)
  return actual.length === expected.length && timingSafeEqual(actual, expected)
}

export function createControlCenterSessionValue() {
  const secrets = controlCenterSecrets()
  if (!secrets) throw new Error('Control Center access is not configured.')
  const expiresAt = Date.now() + CONTROL_CENTER_SESSION_MAX_AGE_SECONDS * 1000
  return { value: signControlCenterSession(expiresAt, secrets.sessionSecret), expiresAt }
}

export async function hasControlCenterAccessSession() {
  const secrets = controlCenterSecrets()
  if (!secrets) return false
  const value = (await cookies()).get(CONTROL_CENTER_SESSION_COOKIE)?.value
  if (!value) return false
  const [expiresAtValue, signature] = value.split('.')
  const expiresAt = Number(expiresAtValue)
  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now() || !signature) return false
  const expected = signControlCenterSession(expiresAt, secrets.sessionSecret).split('.')[1]
  const actualBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expected)
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer)
}

export async function getControlCenterAccess() {
  try {
    return { method: 'sparkle_suite_operator' as const, operator: await getAuthenticatedOperator() }
  } catch (error) {
    if (await hasControlCenterAccessSession()) return { method: 'control_center_session' as const }
    throw error
  }
}

export const controlCenterSessionCookie = {
  maxAge: CONTROL_CENTER_SESSION_MAX_AGE_SECONDS,
  name: CONTROL_CENTER_SESSION_COOKIE,
  options: {
    httpOnly: true,
    // The Control Center UI lives at /control-center while its mutations use
    // /api/control-center. The cookie must reach both paths without replacing
    // the separate Sparkle Suite authentication cookie.
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
}

export { AuthError }
