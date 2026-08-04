import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { getCustomerSiteBrandAssetContext } from '@/lib/amethyst/customer-site-brand-assets'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const size = {
  width: 192,
  height: 192,
}

export const contentType = 'image/png'

export default async function Icon() {
  const brand = await getCustomerSiteBrandAssetContext(await headers())
  if (brand?.markAssetPath) {
    const markData = await readFile(
      join(process.cwd(), 'public', brand.markAssetPath),
      'base64',
    )
    const markSrc = `data:image/png;base64,${markData}`

    return new ImageResponse(
      <div
        style={{
          alignItems: 'center',
          background: '#1d1719',
          display: 'flex',
          height: '100%',
          justifyContent: 'center',
          width: '100%',
        }}
      >
        <img alt={`${brand.businessName} monogram`} height={192} src={markSrc} width={192} />
      </div>,
      { ...size },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          alignItems: 'center',
          background: 'transparent',
          color: '#ee2c9b',
          display: 'flex',
          fontFamily: '"Playfair Display", Georgia, serif',
          fontSize: 104,
          height: '100%',
          justifyContent: 'center',
          lineHeight: 1,
          width: '100%',
        }}
      >
        <div
          style={{
            alignItems: 'center',
            background: '#ffffff',
            border: '3px solid #ee2c9b',
            borderRadius: '999px',
            display: 'flex',
            height: 168,
            justifyContent: 'center',
            width: 168,
          }}
        >
          <span
            style={{
              fontStyle: 'italic',
              fontWeight: 500,
              transform: 'skewX(-10deg) translateY(7px)',
            }}
          >
            S
          </span>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
