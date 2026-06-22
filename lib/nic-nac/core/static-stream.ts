import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from 'ai'

export function createNicNacStaticTextStreamResponse({
  message,
  messageId,
  headers,
}: {
  message: string
  messageId: string
  headers?: HeadersInit
}): Response {
  const stream = createUIMessageStream<UIMessage>({
    generateId: () => messageId,
    execute: ({ writer }) => {
      writer.write({ type: 'start', messageId })
      writer.write({ type: 'text-start', id: 'text-1' })
      writer.write({ type: 'text-delta', id: 'text-1', delta: message })
      writer.write({ type: 'text-end', id: 'text-1' })
    },
  })

  return createUIMessageStreamResponse({
    stream,
    headers,
  })
}
