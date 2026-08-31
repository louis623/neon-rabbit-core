import type { UIMessageChunk } from 'ai'

export const NIC_NAC_EMPTY_RESPONSE_FALLBACK =
  "I’m sorry—I didn’t produce a response that time. Please send that again."

export function isRenderableNicNacStreamChunk(chunk: UIMessageChunk) {
  if (chunk.type === 'text-delta') return /\S/.test(chunk.delta)
  if (chunk.type === 'tool-approval-request') return true
  return chunk.type === 'data-trade-request-card'
}
