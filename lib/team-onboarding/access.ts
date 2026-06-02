import { createHash } from 'node:crypto'

export function hashInviteToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export function getBearerToken(authorizationHeader: string | null): string | null {
  if (!authorizationHeader) {
    return null
  }

  const match = authorizationHeader.match(/^bearer\s+(\S+)$/i)

  return match?.[1] ?? null
}

export function assertQuestionText(input: unknown): string {
  if (typeof input !== 'string') {
    throw new Error('Question text is required.')
  }

  const questionText = input.trim()

  if (questionText.length < 3) {
    throw new Error('Question text must be at least 3 characters.')
  }

  if (questionText.length > 1000) {
    throw new Error('Question text must be 1000 characters or fewer.')
  }

  return questionText
}
