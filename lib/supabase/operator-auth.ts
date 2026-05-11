import { AuthError, getAuthenticatedRep } from './auth'

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

export async function getAuthenticatedOperator() {
  const context = await getAuthenticatedRep()
  const email = context.rep.email.trim().toLowerCase()

  if (!getOperatorEmails().includes(email)) {
    throw new OperatorAuthError('Authenticated rep is not an operator')
  }

  return context
}

export { AuthError }
