import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'

type FixtureMode = 'cleanLightBox' | 'dimFlat' | 'offCenter'

function scale(value: number, base: number, target: number) {
  return Math.max(1, Math.round((value / base) * target))
}

async function makePngBytes(
  width: number,
  height: number,
  mode: FixtureMode,
): Promise<Buffer> {
  if (mode === 'dimFlat') {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
        <defs>
          <radialGradient id="bg" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stop-color="#343434" />
            <stop offset="100%" stop-color="#363636" />
          </radialGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)" />
      </svg>
    `

    return sharp(Buffer.from(svg)).png().toBuffer()
  }

  const base = mode === 'offCenter'
    ? {
        left: 140,
        top: 220,
        subjectWidth: 520,
        subjectHeight: 520,
        stripeCount: 6,
        bandCount: 5,
        stripeStep: 70,
        bandStep: 88,
        outerRadius: 70,
      }
    : {
        left: 360,
        top: 360,
        subjectWidth: 1080,
        subjectHeight: 1080,
        stripeCount: 12,
        bandCount: 10,
        stripeStep: 80,
        bandStep: 92,
        outerRadius: 120,
      }

  const subjectLeft = scale(base.left, 1800, width)
  const subjectTop = scale(base.top, 1800, height)
  const subjectWidth = scale(base.subjectWidth, 1800, width)
  const subjectHeight = scale(base.subjectHeight, 1800, height)
  const outerRadius = scale(base.outerRadius, 1800, width)
  const innerInset = scale(70, 1800, width)
  const coreInset = scale(140, 1800, width)
  const innerRadius = scale(120, 1800, width)
  const coreRadius = scale(90, 1800, width)
  const stripeWidth = scale(26, 1800, width)
  const stripeHeight = Math.max(1, subjectHeight - scale(90, 1800, height))
  const stripeTop = subjectTop + scale(45, 1800, height)
  const bandLeft = subjectLeft + scale(55, 1800, width)
  const bandWidth = Math.max(1, subjectWidth - scale(110, 1800, width))
  const bandHeight = scale(12, 1800, height)

  const stripes = Array.from({ length: base.stripeCount }, (_, index) => {
    const x =
      subjectLeft +
      scale(30, 1800, width) +
      index * scale(base.stripeStep, 1800, width)

    return `<rect x="${x}" y="${stripeTop}" width="${stripeWidth}" height="${stripeHeight}" rx="${Math.max(1, Math.round(stripeWidth / 2))}" fill="#d9d9d9" opacity="0.95" />`
  }).join('')

  const bands = Array.from({ length: base.bandCount }, (_, index) => {
    const y =
      subjectTop +
      scale(45, 1800, height) +
      index * scale(base.bandStep, 1800, height)

    return `<rect x="${bandLeft}" y="${y}" width="${bandWidth}" height="${bandHeight}" rx="${Math.max(1, Math.round(bandHeight / 2))}" fill="#101010" opacity="0.85" />`
  }).join('')

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fafafa" />
          <stop offset="100%" stop-color="#efefef" />
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#bg)" />
      <rect x="${subjectLeft}" y="${subjectTop}" width="${subjectWidth}" height="${subjectHeight}" rx="${outerRadius}" fill="#272727" />
      <rect x="${subjectLeft + innerInset}" y="${subjectTop + innerInset}" width="${Math.max(1, subjectWidth - innerInset * 2)}" height="${Math.max(1, subjectHeight - innerInset * 2)}" rx="${innerRadius}" fill="#ededed" />
      <rect x="${subjectLeft + coreInset}" y="${subjectTop + coreInset}" width="${Math.max(1, subjectWidth - coreInset * 2)}" height="${Math.max(1, subjectHeight - coreInset * 2)}" rx="${coreRadius}" fill="#2e2e2e" />
      ${stripes}
      ${bands}
    </svg>
  `

  return sharp(Buffer.from(svg)).png().toBuffer()
}

describe('analyzeServerImageQuality', () => {
  it('detects a clean light-box-style subject as crisp, centered, and safe to preflight', async () => {
    const result = await analyzeServerImageQuality(
      await makePngBytes(1800, 1800, 'cleanLightBox'),
    )

    expect(result.contentType).toBe('image/png')
    expect(result.width).toBe(1800)
    expect(result.height).toBe(1800)
    expect(result.blurRisk).toBeLessThan(0.05)
    expect(result.lightingRisk).toBeLessThan(0.05)
    expect(result.subjectCoverage).toBeGreaterThan(0.28)
    expect(result.subjectCentered).toBe(true)
    expect(result.detailConfidence).toBeGreaterThan(0.95)
    expect(result.backgroundUniformity).toBeGreaterThan(0.85)
    expect(result.backgroundCleanliness).toBeGreaterThan(0.85)
  })

  it('flags a dim flat frame as low-detail despite a uniform background', async () => {
    const result = await analyzeServerImageQuality(
      await makePngBytes(1800, 1800, 'dimFlat'),
    )

    expect(result.blurRisk).toBeGreaterThan(0.75)
    expect(result.lightingRisk).toBeGreaterThan(0.45)
    expect(result.subjectCoverage).toBe(0)
    expect(result.subjectCentered).toBe(false)
    expect(result.detailConfidence).toBeLessThan(0.01)
    expect(result.backgroundUniformity).toBeGreaterThan(0.95)
    expect(result.backgroundCleanliness).toBeGreaterThan(0.95)
  })

  it('marks a crisp off-center subject as a framing problem instead of a detail problem', async () => {
    const result = await analyzeServerImageQuality(
      await makePngBytes(1800, 1800, 'offCenter'),
    )

    expect(result.blurRisk).toBeLessThan(0.05)
    expect(result.lightingRisk).toBeLessThan(0.1)
    expect(result.subjectCoverage).toBeLessThan(0.1)
    expect(result.subjectCentered).toBe(false)
    expect(result.detailConfidence).toBeGreaterThan(0.95)
    expect(result.backgroundUniformity).toBeGreaterThan(0.85)
    expect(result.backgroundCleanliness).toBeGreaterThan(0.85)
  })
})
