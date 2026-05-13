import {
  SPARKLE_PUBLIC_ORIGIN,
  normalizeSparkleOrigin,
} from './sparkle-crawl'

export type AmethystPublicPage = 'homepage' | 'trade' | 'join'

export interface AmethystPublicPageDefinition {
  path: string
  title: string
  description: string
}

export interface BuildAmethystPublicMetadataOptions {
  origin?: string | URL
}

export interface AmethystPublicMetadata {
  page: AmethystPublicPage
  path: string
  title: string
  description: string
  robots: 'index,follow'
  canonicalUrl: string
  openGraph: {
    type: 'website'
    siteName: 'Sparkle Suite'
    title: string
    description: string
    url: string
    image: string
  }
  twitter: {
    card: 'summary_large_image'
    title: string
    description: string
    image: string
  }
}

export type AmethystPublicMetaTag =
  | {
      tag: 'title'
      text: string
    }
  | {
      tag: 'link'
      rel: 'canonical'
      href: string
    }
  | {
      tag: 'meta'
      name: string
      content: string
    }
  | {
      tag: 'meta'
      property: string
      content: string
    }

export const AMETHYST_PUBLIC_PAGES: Record<
  AmethystPublicPage,
  AmethystPublicPageDefinition
> = {
  homepage: {
    path: '/amethyst/Homepage.html',
    title: 'Sparkle by Sasha - Live jewelry reveals',
    description:
      'Shop live jewelry reveals, trade board highlights, and upcoming shows with Sparkle by Sasha.',
  },
  trade: {
    path: '/amethyst/Trade.html',
    title: 'Sparkle by Sasha - Trade Board',
    description:
      'Browse Sparkle by Sasha trade board listings and request fair jewelry trades from live reveal customers.',
  },
  join: {
    path: '/amethyst/Join.html',
    title: 'Sparkle by Sasha - Join the Team',
    description:
      'Learn how to join Sparkle by Sasha and build a Bomb Party business with practical support from an active team.',
  },
}

function resolveAmethystPublicUrl(origin: string, path: string) {
  return new URL(path, origin).toString()
}

export function buildAmethystPublicMetadata(
  page: AmethystPublicPage,
  options: BuildAmethystPublicMetadataOptions = {},
): AmethystPublicMetadata {
  const definition = AMETHYST_PUBLIC_PAGES[page]
  const origin = normalizeSparkleOrigin(
    options.origin ?? SPARKLE_PUBLIC_ORIGIN,
  )
  const canonicalUrl = resolveAmethystPublicUrl(origin, definition.path)
  const image = resolveAmethystPublicUrl(origin, '/opengraph-image')

  return {
    page,
    path: definition.path,
    title: definition.title,
    description: definition.description,
    robots: 'index,follow',
    canonicalUrl,
    openGraph: {
      type: 'website',
      siteName: 'Sparkle Suite',
      title: definition.title,
      description: definition.description,
      url: canonicalUrl,
      image,
    },
    twitter: {
      card: 'summary_large_image',
      title: definition.title,
      description: definition.description,
      image,
    },
  }
}

export function buildAmethystPublicMetaTags(
  page: AmethystPublicPage,
  options: BuildAmethystPublicMetadataOptions = {},
): AmethystPublicMetaTag[] {
  const metadata = buildAmethystPublicMetadata(page, options)

  return [
    {
      tag: 'title',
      text: metadata.title,
    },
    {
      tag: 'meta',
      name: 'description',
      content: metadata.description,
    },
    {
      tag: 'meta',
      name: 'robots',
      content: metadata.robots,
    },
    {
      tag: 'link',
      rel: 'canonical',
      href: metadata.canonicalUrl,
    },
    {
      tag: 'meta',
      property: 'og:type',
      content: metadata.openGraph.type,
    },
    {
      tag: 'meta',
      property: 'og:site_name',
      content: metadata.openGraph.siteName,
    },
    {
      tag: 'meta',
      property: 'og:title',
      content: metadata.openGraph.title,
    },
    {
      tag: 'meta',
      property: 'og:description',
      content: metadata.openGraph.description,
    },
    {
      tag: 'meta',
      property: 'og:url',
      content: metadata.openGraph.url,
    },
    {
      tag: 'meta',
      property: 'og:image',
      content: metadata.openGraph.image,
    },
    {
      tag: 'meta',
      name: 'twitter:card',
      content: metadata.twitter.card,
    },
    {
      tag: 'meta',
      name: 'twitter:title',
      content: metadata.twitter.title,
    },
    {
      tag: 'meta',
      name: 'twitter:description',
      content: metadata.twitter.description,
    },
    {
      tag: 'meta',
      name: 'twitter:image',
      content: metadata.twitter.image,
    },
  ]
}
