import { readFile } from 'node:fs/promises'
import { extname, join } from 'node:path'

const PUBLIC_ASSET_MEDIA_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
}

export async function loadCustomerSiteBrandImageDataUri(assetPath: string) {
  const mediaType = PUBLIC_ASSET_MEDIA_TYPES[extname(assetPath).toLowerCase()]
  if (!mediaType) throw new Error(`Unsupported customer-site brand image: ${assetPath}`)

  const data = await readFile(
    join(process.cwd(), 'public', assetPath),
    'base64',
  )

  return `data:${mediaType};base64,${data}`
}
