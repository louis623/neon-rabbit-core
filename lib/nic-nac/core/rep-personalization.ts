export function normalizeRepDisplayName(repDisplayName: string | undefined) {
  return (
    repDisplayName
      ?.replace(/[\u0000-\u001f\u007f]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80) ?? ''
  )
}

export function buildPersonalizedRepGreeting(input: {
  latestUserText: string
  repDisplayName: string | undefined
}) {
  const text = input.latestUserText.trim()
  const greetingMatch = text.match(
    /^(hello|hi|hey|good morning|good afternoon|good evening)(?:[\s,]+(?:there|nic[- ]?nac))?[!.?]*$/i,
  )
  if (!greetingMatch) return null

  const displayName = normalizeRepDisplayName(input.repDisplayName)
  const givenName = displayName.split(' ')[0]?.trim() ?? ''
  const greeting = greetingMatch[1]!.toLowerCase()
  const opening =
    greeting === 'good morning'
      ? 'Good morning'
      : greeting === 'good afternoon'
        ? 'Good afternoon'
        : greeting === 'good evening'
          ? 'Good evening'
          : greeting === 'hey'
            ? 'Hey'
            : 'Hello'

  return givenName
    ? `${opening}, ${givenName}! How can I help you today?`
    : `${opening}! How can I help you today?`
}
