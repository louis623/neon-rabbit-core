export function normalizeOperatorSupportMutationRequestId(
  value: string | null | undefined,
) {
  const requestId = value?.trim() ?? ''
  if (
    requestId.length < 8 ||
    requestId.length > 200 ||
    !/^[A-Za-z0-9._:-]+$/.test(requestId)
  ) {
    return null
  }
  return requestId
}
