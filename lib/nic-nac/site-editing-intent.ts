export function isAboutNarrativeCopySubmission(args: {
  latestUserText: string
  previousAssistantText: string
}): boolean {
  const latest = args.latestUserText.trim()
  const previous = args.previousAssistantText
  const assistantAskedForAboutCopy =
    /\babout\b/i.test(previous) &&
    /\b(?:send|share|paste|give|write|provide|update)\b/i.test(previous)

  // A rep may paste the finished copy without repeating words such as
  // "website" or "About." Require substantive prose so a short reply still
  // uses ordinary follow-up routing instead of triggering a site mutation.
  const substantiveCopy = latest.length >= 160 || latest.split(/\s+/).filter(Boolean).length >= 32

  return assistantAskedForAboutCopy && substantiveCopy
}

export function isAboutSectionCorrection(args: {
  latestUserText: string
  previousAssistantText: string
}): boolean {
  const latest = args.latestUserText.trim()
  const previous = args.previousAssistantText
  const assistantJustUpdatedAbout =
    /\babout(?:\s+section)?\b/i.test(previous) &&
    /\b(?:updated|saved|done|published)\b/i.test(previous)
  const asksForTheMissingSection =
    /\b(?:whole|full|all of (?:it|that)|rest of (?:it|that))\b/i.test(latest) &&
    /\b(?:about|section|thing|copy|part)\b/i.test(latest)
  const identifiesAnIncompleteSave =
    /\b(?:only|just)\s+(?:added|updated|saved)\b[\s\S]{0,80}\b(?:part|body|section|copy)\b/i.test(latest)

  return assistantJustUpdatedAbout && (asksForTheMissingSection || identifiesAnIncompleteSave)
}
