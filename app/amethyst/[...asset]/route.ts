import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import {
  type AmethystPublicMetaTag,
  type AmethystPublicPage,
  buildAmethystPublicMetadata,
  buildAmethystPublicMetaTags,
} from '@/lib/seo/amethyst-public-metadata'
import {
  buildAmethystPublicPageJsonLd,
  serializeJsonLd,
} from '@/lib/seo/amethyst-structured-data'
import { resolveSparkleRequestOrigin } from '@/lib/seo/sparkle-crawl'

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

const AMETHYST_PUBLIC_HTML_PAGES: Record<string, AmethystPublicPage> = {
  'Homepage.html': 'homepage',
  'Trade.html': 'trade',
  'Join.html': 'join',
}

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

function escapeHtmlAttribute(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function escapeHtmlText(value: string) {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function renderMetaTag(tag: AmethystPublicMetaTag) {
  if (tag.tag === 'title') {
    return `<title>${escapeHtmlText(tag.text)}</title>`
  }

  if (tag.tag === 'link') {
    return `<link rel="${tag.rel}" href="${escapeHtmlAttribute(tag.href)}" />`
  }

  if ('property' in tag) {
    return `<meta property="${tag.property}" content="${escapeHtmlAttribute(
      tag.content,
    )}" />`
  }

  return `<meta name="${tag.name}" content="${escapeHtmlAttribute(tag.content)}" />`
}

function renderMetadataBlock(page: AmethystPublicPage, origin: string) {
  return buildAmethystPublicMetaTags(page, { origin }).map(renderMetaTag).join('\n')
}

function injectAmethystJsonLd(
  html: string,
  page: AmethystPublicPage,
  origin: string,
) {
  const metadata = buildAmethystPublicMetadata(page, { origin })
  const jsonLd = buildAmethystPublicPageJsonLd({
    origin,
    path: metadata.path,
    title: metadata.title,
    description: metadata.description,
    repName: 'Jane',
    businessName: "Jane's Sparkle Party",
    shopUrl: 'https://bombparty.com',
  })
  const script = `<script type="application/ld+json">${serializeJsonLd(
    jsonLd,
  )}</script>`

  return html.replace(/\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '')
    .replace('</head>', `${script}\n</head>`)
}

function rewriteAmethystPublicHtml(
  html: string,
  page: AmethystPublicPage,
  origin: string,
) {
  const metadataBlock = renderMetadataBlock(page, origin)
  const rewritten = html.replace(
    /<title>[\s\S]*?<meta name="twitter:image" content="[^"]+" \/>\r?\n?/,
    `${metadataBlock}\n`,
  )

  return injectAmethystJsonLd(rewritten, page, origin)
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ asset: string[] }> },
) {
  const { asset } = await params
  const filePath = resolveAmethystAsset(asset)
  if (!filePath) return new Response('Not found', { status: 404 })

  try {
    const body = await readFile(filePath)
    const contentType = getContentType(filePath)
    const page = AMETHYST_PUBLIC_HTML_PAGES[asset.join('/')]
    const responseBody =
      page && contentType.startsWith('text/html')
        ? rewriteAmethystPublicHtml(
            body.toString('utf8'),
            page,
            resolveSparkleRequestOrigin(request),
          )
        : body

    return new Response(responseBody, {
      headers: {
        'Cache-Control': 'public, max-age=0, must-revalidate',
        'Content-Type': contentType,
      },
    })
  } catch {
    return new Response('Not found', { status: 404 })
  }
}
