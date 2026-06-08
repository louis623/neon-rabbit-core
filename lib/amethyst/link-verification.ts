export interface AmethystLinkCheck {
  kind: 'local' | 'production'
  label: string
  url: string
}

const AMETHYST_PAGES = [
  { label: 'homepage', path: '/amethyst/Homepage.html' },
  { label: 'trade board', path: '/amethyst/Trade.html' },
]

interface BuildAmethystLinkChecksOptions {
  includeProduction?: boolean
  localBaseUrl: string
  productionBaseUrl: string
}

function joinBaseUrl(baseUrl: string, path: string) {
  return `${baseUrl.replace(/\/$/, '')}${path}`
}

export function buildAmethystLinkChecks({
  includeProduction = false,
  localBaseUrl,
  productionBaseUrl,
}: BuildAmethystLinkChecksOptions): AmethystLinkCheck[] {
  const localChecks = AMETHYST_PAGES.map((page) => ({
    kind: 'local' as const,
    label: `Local Amethyst ${page.label}`,
    url: joinBaseUrl(localBaseUrl, page.path),
  }))

  if (!includeProduction) return localChecks

  return [
    ...localChecks,
    ...AMETHYST_PAGES.map((page) => ({
      kind: 'production' as const,
      label: `Production Amethyst ${page.label}`,
      url: joinBaseUrl(productionBaseUrl, page.path),
    })),
  ]
}
