export function normalizeNicNacAssistantText(value: string) {
  return value
    .replace(/([.!?])(?=[A-Z])/g, '$1 ')
    .replace(/(:)(?=[A-Z])/g, '$1 ')
    .replace(/\s{3,}/g, '  ')
}

export function normalizeNicNacAssistantParts<T extends Array<unknown>>(parts: T): T {
  return parts.map((part) => {
    const maybeTextPart = part as { type?: string; text?: unknown }
    if (maybeTextPart.type !== 'text' || typeof maybeTextPart.text !== 'string') {
      return part
    }

    return {
      ...(part as Record<string, unknown>),
      text: normalizeNicNacAssistantText(maybeTextPart.text),
    }
  }) as T
}
