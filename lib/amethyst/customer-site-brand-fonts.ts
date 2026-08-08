import type { CustomerSiteBrandAssetContext } from './customer-site-brand-assets'

const PLAYFAIR_DISPLAY_800_URL =
  'https://fonts.gstatic.com/s/playfairdisplay/v40/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKfFukDQ.ttf'

let playfairDisplay800: Promise<ArrayBuffer> | null = null

async function loadPlayfairDisplay800() {
  playfairDisplay800 ??= fetch(PLAYFAIR_DISPLAY_800_URL).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Unable to load Playfair Display (${response.status})`)
    }

    return response.arrayBuffer()
  })

  return playfairDisplay800
}

/**
 * `next/og` does not inherit web fonts from the customer-site HTML. Supply
 * BlingKitchen's header font directly so its compact B uses the real mark
 * rather than a renderer fallback.
 */
export async function getCustomerSiteBrandImageFonts(
  brand: CustomerSiteBrandAssetContext | null,
) {
  if (brand?.markFontFamily.includes('Playfair Display')) {
    return [
      {
        data: await loadPlayfairDisplay800(),
        name: 'Playfair Display',
        style: 'normal' as const,
        weight: 800 as const,
      },
    ]
  }

  return []
}
