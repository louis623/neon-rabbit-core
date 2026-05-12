import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const runtime = 'nodejs'

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

const AMETHYST_ASSETS = new Set([
  'Amethyst Design System.html',
  'components.css',
  'homepage.css',
  'Homepage.html',
  'homepage.jsx',
  'join.css',
  'Join.html',
  'join.jsx',
  'README.md',
  'tokens.css',
  'trade.css',
  'Trade.html',
  'trade.jsx',
  'tweaks-panel.jsx',
  'Unsubscribe.html',
  'unsubscribe.jsx',
])

function getContentType(filePath: string | URL) {
  const pathname = typeof filePath === 'string' ? filePath : filePath.pathname
  const dotIndex = pathname.lastIndexOf('.')
  const ext = dotIndex >= 0 ? pathname.slice(dotIndex).toLowerCase() : ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

function resolveAmethystAsset(asset: string[]) {
  const assetPath = asset.join('/')
  if (!AMETHYST_ASSETS.has(assetPath)) return null

  return join(process.cwd(), 'public', 'amethyst', assetPath)
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await params
  const filePath = resolveAmethystAsset(asset)
  if (!filePath) return new Response('Not found', { status: 404 })

  try {
    const body = await readFile(filePath)
    return new Response(body, {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': getContentType(filePath),
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
