import type { UIMessage } from 'ai'

export function mergeServerMessages(
  current: UIMessage[],
  incoming: UIMessage[],
): UIMessage[] {
  const incomingById = new Map(incoming.map((message) => [message.id, message]))
  const seen = new Set<string>()
  let changed = false

  const merged = current.map((message) => {
    const serverMessage = incomingById.get(message.id)
    if (!serverMessage) return message
    seen.add(message.id)
    if (serverMessage === message) return message
    changed = true
    return serverMessage
  })

  const appended = incoming.filter((message) => {
    if (seen.has(message.id)) return false
    seen.add(message.id)
    return true
  })

  if (appended.length > 0) changed = true
  return changed ? [...merged, ...appended] : current
}
