export function isAboutNarrativeCopySubmission(args: {
  latestUserText: string
  previousAssistantText: string
}): boolean {
  const latest = args.latestUserText.trim()
  const previous = args.previousAssistantText
  const assistantAskedForAboutCopy =
    /\babout\b/i.test(previous) &&
    /\b(?:send|share|paste|give|write|provide)\b/i.test(previous) &&
    /\b(?:text|copy|narrative|story)\b/i.test(previous)

  // A rep may paste the finished copy without repeating words such as
  // "website" or "About." Require substantive prose so a short reply still
  // uses ordinary follow-up routing instead of triggering a site mutation.
  const substantiveCopy = latest.length >= 160 || latest.split(/\s+/).filter(Boolean).length >= 32

  return assistantAskedForAboutCopy && substantiveCopy
}
