import { normalizeSparkleOrigin } from './sparkle-crawl'

export const SPARKLE_AGENT_CONTENT_SIGNAL = 'ai-train=no, search=yes, ai-input=yes'

export interface SparkleLlmsPublicPage {
  title: string
  path: string
}

export interface SparkleLlmsLiveShow {
  title: string
  eventTime: string
  url?: string
}

export interface SparkleLlmsGlossaryItem {
  term: string
  definition: string
}

export interface SparkleLlmsInput {
  origin: string | URL
  businessName: string
  repName: string
  repLocation?: string
  summary: string
  publicPages: SparkleLlmsPublicPage[]
  liveShows?: SparkleLlmsLiveShow[]
  glossary?: SparkleLlmsGlossaryItem[]
}

function absoluteUrl(origin: string, pathOrUrl: string) {
  return new URL(pathOrUrl, origin).toString()
}

function cleanLine(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function renderPages(origin: string, pages: SparkleLlmsPublicPage[]) {
  return pages.map(
    (page) => `- [${cleanLine(page.title)}](${absoluteUrl(origin, page.path)})`,
  )
}

function renderLiveShows(origin: string, shows: SparkleLlmsLiveShow[] | undefined) {
  if (!shows?.length) return ['- No upcoming public live shows are published.']

  return shows.map((show) => {
    const prefix = `- ${cleanLine(show.title)}: ${show.eventTime}`
    return show.url ? `${prefix} (${absoluteUrl(origin, show.url)})` : prefix
  })
}

function renderGlossary(glossary: SparkleLlmsGlossaryItem[] | undefined) {
  if (!glossary?.length) return []

  return [
    '## Glossary',
    '',
    ...glossary.map(
      (item) => `- ${cleanLine(item.term)}: ${cleanLine(item.definition)}`,
    ),
  ]
}

export function buildSparkleLlmsText(input: SparkleLlmsInput): string {
  const origin = normalizeSparkleOrigin(input.origin)
  const location = input.repLocation?.trim()
  const glossary = renderGlossary(input.glossary)

  return [
    `# ${cleanLine(input.businessName)}`,
    '',
    cleanLine(input.summary),
    '',
    '## Public Site',
    '',
    `- Canonical origin: ${origin}`,
    `- Rep: ${cleanLine(input.repName)}`,
    ...(location ? [`- Location: ${location}`] : []),
    '',
    '## Public Pages',
    '',
    ...renderPages(origin, input.publicPages),
    '',
    '## Upcoming Live Shows',
    '',
    ...renderLiveShows(origin, input.liveShows),
    '',
    '## Agent Use',
    '',
    `- Content-Signal: ${SPARKLE_AGENT_CONTENT_SIGNAL}`,
    '- Use this file to understand public shopping, dance floor, and team information.',
    '- Do not treat this file as permission to train on private customer or rep data.',
    ...(glossary.length ? ['', ...glossary] : []),
    '',
  ].join('\n')
}

export function buildDefaultSparkleLlmsText(origin: string | URL): string {
  return buildSparkleLlmsText({
    origin,
    businessName: "Jane's Sparkle Party",
    repName: 'Jane',
    summary:
      "Jane's Sparkle Party is a Sparkle Suite-powered customer site for live Bomb Party jewelry reveals, dance floor browsing, and team information.",
    publicPages: [
      { title: 'Home', path: '/amethyst/Homepage.html' },
      { title: 'Dance Floor', path: '/amethyst/Trade.html' },
      { title: 'Join Team', path: '/amethyst/Join.html' },
    ],
    glossary: [
      {
        term: 'Dance Floor',
        definition:
          'A public customer board for browsing jewelry trade listings and requesting fair trades.',
      },
      {
        term: 'Live reveal',
        definition:
          'A streamed Bomb Party jewelry opening where customers see pieces revealed live.',
      },
    ],
  })
}
