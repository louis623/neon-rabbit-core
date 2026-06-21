import { generateText } from 'ai'
import { NextResponse } from 'next/server'

import {
  parsePublicNicNacRequest,
  type PublicNicNacResponse,
} from '@/lib/sparkle-suite/public-nic-nac-contract'
import {
  classifyPublicNicNacQuestion,
  publicNicNacBlockedMessage,
  publicNicNacHandoffMessage,
  sanitizePublicNicNacAnswer,
} from '@/lib/sparkle-suite/public-nic-nac-guardrails'
import { buildPublicNicNacPrompt } from '@/lib/sparkle-suite/public-nic-nac-prompt'
import { getNicNacModelPolicy } from '@/lib/nic-nac/core/model-policy'
import {
  getNicNacLanguageModel,
  getNicNacProviderOptions,
} from '@/lib/nic-nac/core/model-provider'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function json(body: PublicNicNacResponse, status = 200) {
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let rawBody: unknown

  try {
    rawBody = await request.json()
  } catch {
    return json({ kind: 'error', message: 'Ask Nic-Nac a question and try again.' }, 400)
  }

  const body = parsePublicNicNacRequest(rawBody)
  if (!body) {
    return json({ kind: 'error', message: 'Ask Nic-Nac a question and try again.' }, 400)
  }

  const classification = classifyPublicNicNacQuestion(body.question)
  if (classification.kind === 'blocked') {
    return json({ kind: 'blocked', message: publicNicNacBlockedMessage() })
  }

  if (classification.kind === 'handoff') {
    return json({
      kind: 'handoff',
      message: publicNicNacHandoffMessage(),
      collectContact: true,
    })
  }

  try {
    const modelPolicy = getNicNacModelPolicy('human_default')
    const result = await generateText({
      model: getNicNacLanguageModel(modelPolicy),
      system: buildPublicNicNacPrompt(),
      prompt: body.question,
      temperature: 0.4,
      maxOutputTokens: 220,
      providerOptions: getNicNacProviderOptions(modelPolicy),
    })
    const sanitized = sanitizePublicNicNacAnswer(result.text)

    if (sanitized.kind === 'blocked') {
      return json({ kind: 'blocked', message: sanitized.message })
    }

    return json({ kind: 'answer', message: sanitized.message })
  } catch {
    return json({
      kind: 'error',
      message:
        "I'm having trouble answering right now. You can try again in a moment, or leave your question here for Louis to review.",
    })
  }
}
