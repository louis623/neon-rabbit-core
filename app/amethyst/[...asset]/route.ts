import { readFile } from 'node:fs/promises'

export const runtime = 'nodejs'

const CONTENT_TYPES: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.jsx': 'text/javascript; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
}

const AMETHYST_ASSET_PATHS = new Map<string, URL>(
  [
    ['Amethyst Design System.html', '../../../public/amethyst/Amethyst Design System.html'],
    ['components.css', '../../../public/amethyst/components.css'],
    ['homepage.css', '../../../public/amethyst/homepage.css'],
    ['Homepage.html', '../../../public/amethyst/Homepage.html'],
    ['homepage.jsx', '../../../public/amethyst/homepage.jsx'],
    ['join.css', '../../../public/amethyst/join.css'],
    ['Join.html', '../../../public/amethyst/Join.html'],
    ['join.jsx', '../../../public/amethyst/join.jsx'],
    ['README.md', '../../../public/amethyst/README.md'],
    ['tokens.css', '../../../public/amethyst/tokens.css'],
    ['trade.css', '../../../public/amethyst/trade.css'],
    ['Trade.html', '../../../public/amethyst/Trade.html'],
    ['trade.jsx', '../../../public/amethyst/trade.jsx'],
    ['tweaks-panel.jsx', '../../../public/amethyst/tweaks-panel.jsx'],
    ['Unsubscribe.html', '../../../public/amethyst/Unsubscribe.html'],
    ['unsubscribe.jsx', '../../../public/amethyst/unsubscribe.jsx'],
  ].map(([asset, path]) => [asset, new URL(path, import.meta.url)]),
)

function getContentType(filePath: string | URL) {
  const pathname = typeof filePath === 'string' ? filePath : filePath.pathname
  const dotIndex = pathname.lastIndexOf('.')
  const ext = dotIndex >= 0 ? pathname.slice(dotIndex).toLowerCase() : ''
  return CONTENT_TYPES[ext] ?? 'application/octet-stream'
}

function resolveAmethystAsset(asset: string[]) {
  return AMETHYST_ASSET_PATHS.get(asset.join('/')) ?? null
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
