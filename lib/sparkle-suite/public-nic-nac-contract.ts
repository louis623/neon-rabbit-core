import { z } from 'zod'

export const PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH = 600

export type PublicNicNacRequest = {
  question: string
}

export type PublicNicNacResponse =
  | {
      kind: 'answer'
      message: string
    }
  | {
      kind: 'handoff'
      message: string
      collectContact: true
    }
  | {
      kind: 'blocked'
      message: string
    }
  | {
      kind: 'error'
      message: string
    }

const publicNicNacRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(1)
    .max(PUBLIC_NIC_NAC_MAX_QUESTION_LENGTH),
})

export function parsePublicNicNacRequest(input: unknown): PublicNicNacRequest | null {
  const result = publicNicNacRequestSchema.safeParse(input)
  return result.success ? result.data : null
}
