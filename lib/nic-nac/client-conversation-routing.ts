const CONVERSATION_PARAM = 'conversationId'

export function getConversationIdFromSearch(search: string) {
  const params = new URLSearchParams(normalizeSearch(search))
  return params.get(CONVERSATION_PARAM)?.trim() || null
}

export function putConversationIdInSearch(search: string, conversationId: string) {
  const params = new URLSearchParams(normalizeSearch(search))
  params.set(CONVERSATION_PARAM, conversationId)
  return params.toString()
}

export function buildConversationStateUrl(conversationId?: string | null) {
  const cleaned = conversationId?.trim()
  if (!cleaned) return '/api/nic-nac/conversation-state'

  const params = new URLSearchParams({ conversationId: cleaned })
  return `/api/nic-nac/conversation-state?${params.toString()}`
}

export async function readJsonResponse<T>(response: Response, label: string) {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.toLowerCase().includes('application/json')) {
    throw new Error(`${label} returned ${response.status} with ${contentType || 'no content type'}`)
  }
  return (await response.json()) as T
}

function normalizeSearch(search: string) {
  return search.startsWith('?') ? search.slice(1) : search
}
