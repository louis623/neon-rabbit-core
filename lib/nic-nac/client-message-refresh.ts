import type { UIMessage } from 'ai'

export function mergeServerMessages(
  current: UIMessage[],
  incoming: UIMessage[],
): UIMessage[] {
  const seen = new Set(current.map((message) => message.id))
  const appended = incoming.filter((message) => {
    if (seen.has(message.id)) return false
    seen.add(message.id)
    return true
  })

  return appended.length > 0 ? [...current, ...appended] : current
}
