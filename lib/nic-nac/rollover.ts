import type { UIMessage } from 'ai'

export const NIC_NAC_ROLLOVER_TAIL_MESSAGES = 12

export type NicNacConversationRunHealth = {
  rolloverRecommended?: boolean | null
} | null | undefined

export function shouldStartNicNacRollover(
  runHealth: NicNacConversationRunHealth,
): boolean {
  return runHealth?.rolloverRecommended === true
}

export function buildNicNacRolloverMessages(
  messages: UIMessage[],
  limit = NIC_NAC_ROLLOVER_TAIL_MESSAGES,
): UIMessage[] {
  const tail = messages.slice(-Math.max(1, limit))
  return tail.map((message, index) => ({
    ...message,
    id: `rollover-${index}-${message.id}`,
  }))
}
