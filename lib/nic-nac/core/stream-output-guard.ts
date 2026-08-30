import type { UIMessageChunk } from 'ai'

export const NIC_NAC_EMPTY_RESPONSE_FALLBACK =
  "I’m sorry—I didn’t produce a response that time. Please send that again."

const RENDERABLE_CHUNK_TYPES = new Set<UIMessageChunk['type']>([
  'tool-input-available',
  'tool-input-error',
  'tool-approval-request',
  'tool-output-available',
  'tool-output-error',
  'tool-output-denied',
  'source-url',
  'source-document',
  'file',
])

export function isRenderableNicNacStreamChunk(chunk: UIMessageChunk) {
  if (chunk.type === 'text-delta') return /\S/.test(chunk.delta)
  return RENDERABLE_CHUNK_TYPES.has(chunk.type)
}
