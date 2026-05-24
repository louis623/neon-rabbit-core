export type NicNacClientAttachment = {
  id: string
  dataUrl: string
  mediaType: 'image/jpeg'
  width: number
  height: number
  blurRisk: number
  lightingRisk: number
  subjectCoverage: number
  subjectCentered: boolean
}

export type ResolvedAttachmentResult = {
  index: number
  attachment: NicNacClientAttachment
} | null

export function orderResolvedAttachments(
  results: ResolvedAttachmentResult[],
): NicNacClientAttachment[] {
  return results
    .filter((result): result is NonNullable<typeof result> => result !== null)
    .sort((a, b) => a.index - b.index)
    .map((result) => result.attachment)
}
