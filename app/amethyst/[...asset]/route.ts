import { renderAmethystPublicAssetResponse } from '@/lib/amethyst/public-asset-response'

export const runtime = 'nodejs'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await params
  return renderAmethystPublicAssetResponse(request, asset)
}
