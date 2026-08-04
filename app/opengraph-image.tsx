import { ImageResponse } from 'next/og'
import { headers } from 'next/headers'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { getCustomerSiteBrandAssetContext } from '@/lib/amethyst/customer-site-brand-assets'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const alt =
  'Sparkle Suite coming soon: a better customer experience starts with a better rep setup.'

export const size = {
  width: 1200,
  height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
  const brand = await getCustomerSiteBrandAssetContext(await headers())
  if (brand) {
    const markSrc = brand.markAssetPath
      ? `data:image/png;base64,${await readFile(
          join(process.cwd(), 'public', brand.markAssetPath),
          'base64',
        )}`
      : null

    return new ImageResponse(
      (
        <div
          style={{
            background: brand.palette.background,
            color: brand.palette.foreground,
            display: 'flex',
            height: '100%',
            padding: 54,
            position: 'relative',
            width: '100%',
          }}
        >
          <div
            style={{
              background: `radial-gradient(circle at 84% 18%, ${brand.palette.accent}66, transparent 31%), linear-gradient(135deg, ${brand.palette.background}, #0f0d0e)`,
              bottom: 0,
              display: 'flex',
              left: 0,
              position: 'absolute',
              right: 0,
              top: 0,
            }}
          />
          <div
            style={{
              border: `1px solid ${brand.palette.accent}99`,
              display: 'flex',
              height: '100%',
              justifyContent: 'space-between',
              padding: 52,
              position: 'relative',
              width: '100%',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', maxWidth: 700 }}>
              <div style={{ color: brand.palette.secondary, display: 'flex', fontFamily: 'Arial, sans-serif', fontSize: 20, letterSpacing: 4, textTransform: 'uppercase' }}>
                Live jewelry reveals
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', fontFamily: 'Georgia, serif', fontSize: 78, fontWeight: 600, letterSpacing: -2, lineHeight: 0.98 }}>
                  {brand.businessName}
                </div>
                <div style={{ color: brand.palette.secondary, display: 'flex', fontFamily: 'Arial, sans-serif', fontSize: 28, lineHeight: 1.35 }}>
                  {brand.tagline || 'Follow along for live reveals, new favorites, and customer updates.'}
                </div>
              </div>
              <div style={{ color: brand.palette.secondary, display: 'flex', fontFamily: 'Arial, sans-serif', fontSize: 21 }}>
                {brand.customDomain}
              </div>
            </div>
            <div style={{ alignItems: 'center', display: 'flex', justifyContent: 'center', width: 300 }}>
              {markSrc ? (
                <img alt={`${brand.businessName} monogram`} height={252} src={markSrc} width={252} />
              ) : (
                <div style={{ alignItems: 'center', background: '#1d1719', color: '#fff', display: 'flex', fontFamily: 'Georgia, serif', fontSize: 190, fontStyle: 'italic', height: 252, justifyContent: 'center', width: 252 }}>
                  {brand.mark}
                </div>
              )}
            </div>
          </div>
        </div>
      ),
      { ...size },
    )
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: '#fff9fc',
          color: '#241a2f',
          display: 'flex',
          height: '100%',
          padding: 64,
          position: 'relative',
          width: '100%',
        }}
      >
        <div
          style={{
            background:
              'radial-gradient(circle at 20% 20%, rgba(247, 215, 231, 0.95), transparent 310px), radial-gradient(circle at 82% 28%, rgba(232, 221, 255, 0.92), transparent 340px), linear-gradient(135deg, #fff9fc 0%, #fff4f8 55%, #ffffff 100%)',
            bottom: 0,
            display: 'flex',
            left: 0,
            position: 'absolute',
            right: 0,
            top: 0,
          }}
        />
        <div
          style={{
            border: '1px solid rgba(90, 52, 92, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            justifyContent: 'space-between',
            padding: 54,
            position: 'relative',
            width: '100%',
          }}
        >
          <div
            style={{
              alignItems: 'center',
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
            }}
          >
            <div
              style={{
                alignItems: 'center',
                display: 'flex',
                gap: 18,
              }}
            >
              <div
                style={{
                  alignItems: 'center',
                  background: '#5a345c',
                  border: '4px solid #f3cfa8',
                  borderRadius: 999,
                  color: '#fff9fc',
                  display: 'flex',
                  fontFamily: 'Georgia, serif',
                  fontSize: 58,
                  height: 88,
                  justifyContent: 'center',
                  lineHeight: 1,
                  width: 88,
                }}
              >
                S
              </div>
              <div
                style={{
                  color: '#5a345c',
                  display: 'flex',
                  flexDirection: 'column',
                  fontFamily: 'Arial, sans-serif',
                  gap: 6,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: 1,
                  }}
                >
                  Sparkle Suite
                </div>
                <div
                  style={{
                    color: '#765f78',
                    fontSize: 18,
                    textTransform: 'uppercase',
                  }}
                >
                  Coming Soon
                </div>
              </div>
            </div>
            <div
              style={{
                border: '1px solid rgba(90, 52, 92, 0.2)',
                color: '#5a345c',
                display: 'flex',
                fontFamily: 'Arial, sans-serif',
                fontSize: 18,
                padding: '12px 18px',
              }}
            >
              yoursparklesuite.com
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 28,
              maxWidth: 900,
            }}
          >
            <div
              style={{
                color: '#5a345c',
                display: 'flex',
                fontFamily: 'Georgia, serif',
                fontSize: 72,
                letterSpacing: -1,
                lineHeight: 0.98,
              }}
            >
              A better customer experience starts with a better rep setup.
            </div>
            <div
              style={{
                color: '#765f78',
                display: 'flex',
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                lineHeight: 1.35,
                maxWidth: 820,
              }}
            >
              A more polished website, standout live show tools, and built-in
              support that helps customers feel the difference.
            </div>
          </div>

          <div
            style={{
              color: '#5a345c',
              display: 'flex',
              fontFamily: 'Arial, sans-serif',
              fontSize: 22,
              gap: 18,
            }}
          >
            <span>Polished website</span>
            <span>Live show tools</span>
            <span>Nic-Nac support</span>
            <span>Waitlist open</span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  )
}
