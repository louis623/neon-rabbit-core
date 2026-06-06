import { AuthError, getAuthenticatedRep } from './auth'
import { createAdminClient } from './admin'

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
  return (
    process.env.NODE_ENV === 'development' ||
    process.env.CONTROL_CENTER_DEV_AUTH_BYPASS === 'true'
  )
}

async function getDevBypassOperator() {
  const email = getOperatorEmails()[0] ?? 'louis@neonrabbit.net'
  const admin = createAdminClient()
  const { data: rep, error } = await admin
    .from('reps')
    .select('id, auth_user_id, email, display_name, stripe_customer_id, public_site_slug')
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

export { AuthError }
