export function resolveAmethystRequestRepId(request: Request) {
  const requestUrl = new URL(request.url)
  const directRepId =
    requestUrl.searchParams.get('c') ?? requestUrl.searchParams.get('repId')

  if (directRepId?.trim()) return directRepId.trim()

  const referer = request.headers.get('referer')
  if (!referer) return null

  try {
    const refererUrl = new URL(referer)
    return (
      refererUrl.searchParams.get('c')?.trim() ||
      refererUrl.searchParams.get('repId')?.trim() ||
      null
    )
  } catch {
    return null
  }
}
