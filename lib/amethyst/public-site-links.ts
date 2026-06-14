import type { AmethystHomepageEventCard } from './homepage-upcoming-shows'
import type { AmethystPreviewTemplateData } from './preview-template-data'
import { validatePublicSiteSlug } from '@/lib/public-site/show-link'

export function getPublicSiteSlugFromRequest(request: Request) {
  const slug = new URL(request.url).searchParams.get('publicSiteSlug')?.trim().toLowerCase()
  if (!slug || !validatePublicSiteSlug(slug).ok) return null
  return slug
}

function rewriteTradeHrefForPublicSlug(href: string, slug: string) {
  if (!href.startsWith('/amethyst/Trade.html')) return href
  const parsed = new URL(href, 'https://www.yoursparklesuite.com')
  return `/${slug}/trade${parsed.search}${parsed.hash}`
}

export function applyPublicSiteSlugToTemplateData(
  data: AmethystPreviewTemplateData,
  slug: string | null,
): AmethystPreviewTemplateData {
  if (!slug) return data
  const homeHref = `/${slug}`
  const tradeHref = `/${slug}/trade`

  return {
    ...data,
    homepage: {
      ...data.homepage,
      footerLinks: {
        ...data.homepage.footerLinks,
        home: homeHref,
        tradeBoard: tradeHref,
      },
    },
    trade: {
      ...data.trade,
      footerLinks: {
        ...data.trade.footerLinks,
        home: homeHref,
        tradeBoard: tradeHref,
        pastShows: `${homeHref}#events`,
      },
    },
  }
}

export function applyPublicSiteSlugToHomepageEvents(
  events: AmethystHomepageEventCard[],
  slug: string | null,
) {
  if (!slug) return events

  return events.map((event) => ({
    ...event,
    collections: event.collections.map((collection) => ({
      ...collection,
      href: rewriteTradeHrefForPublicSlug(collection.href, slug),
    })),
  }))
}
