import { AuthError, getAuthenticatedRep } from './auth'
import { createAdminClient } from './admin'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'

const CONTROL_CENTER_SESSION_COOKIE = 'sparkle_control_center_session'
const CONTROL_CENTER_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12

type OperatorContext = Awaited<ReturnType<typeof getAuthenticatedRep>>

type ControlCenterSession = {
  authUserId: string
  email: string
  expiresAt: number
  repId: string
}

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
    .select('id, auth_user_id, email, display_name, business_name, stripe_customer_id, public_site_slug, time_zone, status')
    .eq('email', email)
    .single()

  if (error || !rep) {
    throw new AuthError('Dev operator rep not found')
  }

  return { repId: rep.id as string, rep }
}

export async function getAuthenticatedOperator() {
  let context: OperatorContext

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

function getControlCenterSessionSecret() {
  return process.env.CONTROL_CENTER_SESSION_SECRET ?? null
}

function signControlCenterSession(payload: string, sessionSecret: string) {
  return createHmac('sha256', sessionSecret).update(payload).digest('base64url')
}

function encodeControlCenterSession(session: ControlCenterSession, sessionSecret: string) {
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url')
  return `${payload}.${signControlCenterSession(payload, sessionSecret)}`
}

function decodeControlCenterSession(value: string, sessionSecret: string) {
  const [payload, signature] = value.split('.')
  if (!payload || !signature) return null
  const actual = Buffer.from(signature)
  const expected = Buffer.from(signControlCenterSession(payload, sessionSecret))
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Partial<ControlCenterSession>
    if (
      typeof session.authUserId !== 'string' ||
      typeof session.email !== 'string' ||
      typeof session.repId !== 'string' ||
      typeof session.expiresAt !== 'number' ||
      session.expiresAt <= Date.now()
    ) return null
    return session as ControlCenterSession
  } catch {
    return null
  }
}

export async function authenticateControlCenterOperator(email: string, password: string): Promise<OperatorContext> {
  const username = email.trim().toLowerCase()
  const configuredUsername = process.env.CONTROL_CENTER_USERNAME?.trim().toLowerCase()
  const configuredPassword = process.env.CONTROL_CENTER_PASSWORD
  if (!username || !password) throw new AuthError('Username and password are required.')
  if (!configuredUsername || !configuredPassword) {
    throw new Error('Control Center credentials are not configured.')
  }

  const suppliedUsername = Buffer.from(username)
  const expectedUsername = Buffer.from(configuredUsername)
  const suppliedPassword = Buffer.from(password)
  const expectedPassword = Buffer.from(configuredPassword)
  const usernameMatches = suppliedUsername.length === expectedUsername.length && timingSafeEqual(suppliedUsername, expectedUsername)
  const passwordMatches = suppliedPassword.length === expectedPassword.length && timingSafeEqual(suppliedPassword, expectedPassword)
  if (!usernameMatches || !passwordMatches) throw new AuthError('That username or password is not valid.')

  const operatorEmail = (process.env.CONTROL_CENTER_OPERATOR_EMAIL ?? configuredUsername).trim().toLowerCase()
  if (!getOperatorEmails().includes(operatorEmail)) {
    throw new OperatorAuthError('Control Center operator identity is not authorized.')
  }

  const admin = createAdminClient()
  const { data: rep, error: repError } = await admin
    .from('reps')
    .select('id, auth_user_id, email, display_name, business_name, stripe_customer_id, public_site_slug, time_zone, status')
    .eq('email', operatorEmail)
    .single()
  if (repError || !rep) throw new AuthError('Operator account was not found.')

  return { repId: rep.id as string, rep }
}

export function createControlCenterSessionValue(operator: OperatorContext) {
  const sessionSecret = getControlCenterSessionSecret()
  if (!sessionSecret) throw new Error('Control Center operator sessions are not configured.')
  const expiresAt = Date.now() + CONTROL_CENTER_SESSION_MAX_AGE_SECONDS * 1000
  return {
    value: encodeControlCenterSession({
      authUserId: operator.rep.auth_user_id,
      email: operator.rep.email.trim().toLowerCase(),
      expiresAt,
      repId: operator.repId,
    }, sessionSecret),
    expiresAt,
  }
}

export async function getControlCenterSession() {
  const sessionSecret = getControlCenterSessionSecret()
  if (!sessionSecret) return null
  const value = (await cookies()).get(CONTROL_CENTER_SESSION_COOKIE)?.value
  return value ? decodeControlCenterSession(value, sessionSecret) : null
}

export async function getControlCenterAccess() {
  const session = await getControlCenterSession()
  if (!session) throw new AuthError('Control Center sign in is required.')
  return { method: 'control_center_session' as const, operator: { email: session.email, repId: session.repId } }
}

export const controlCenterSessionCookie = {
  maxAge: CONTROL_CENTER_SESSION_MAX_AGE_SECONDS,
  name: CONTROL_CENTER_SESSION_COOKIE,
  options: {
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
  },
}

export { AuthError }
