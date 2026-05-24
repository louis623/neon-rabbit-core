import { describe, expect, it } from 'vitest'
import sharp from 'sharp'

import { createGuardedJewelryPhotoCrop } from '@/lib/services/jewelry-photo-crop'
import { analyzeServerImageQuality } from '@/lib/services/server-image-quality'

async function makeCenteredSmallJewelryPhoto() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="1800" height="1800">
      <rect width="100%" height="100%" fill="#f7f7f7" />
      <g transform="translate(720 720)">
        <rect x="0" y="0" width="360" height="360" rx="40" fill="#262626" />
        <rect x="40" y="40" width="280" height="280" rx="28" fill="#eeeeee" />
        <rect x="95" y="95" width="170" height="170" rx="24" fill="#303030" />
        <path d="M130 180 C150 110 210 110 230 180 C214 250 146 250 130 180Z" fill="#d8d8d8" />
        <path d="M160 160 L200 160 M160 190 L200 190 M180 135 L180 220" stroke="#111111" stroke-width="10" />
      </g>
    </svg>
  `
  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer())
}

async function makeLabelCardPhoto() {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="768" height="1024">
      <rect width="100%" height="100%" fill="#f9ddeb" />
      <rect x="80" y="70" width="610" height="840" rx="20" fill="#fff8fb" />
      <text x="130" y="220" font-size="54" font-family="Arial" fill="#333">ER76003</text>
      <text x="130" y="300" font-size="44" font-family="Arial" fill="#333">The Elodie Luxe</text>
      <circle cx="360" cy="760" r="20" fill="#b0b0b0" />
      <circle cx="420" cy="760" r="20" fill="#b0b0b0" />
    </svg>
  `
  return new Uint8Array(await sharp(Buffer.from(svg)).jpeg().toBuffer())
}

describe('createGuardedJewelryPhotoCrop', () => {
  it('crops a clear centered small jewelry subject and improves subject coverage', async () => {
    const bytes = await makeCenteredSmallJewelryPhoto()
    const originalAnalysis = await analyzeServerImageQuality(bytes)

    const crop = await createGuardedJewelryPhotoCrop({
      bytes,
      analysis: originalAnalysis,
    })

    expect(crop).not.toBeNull()
    expect(crop?.selectedSource).toBe('cropped')
    expect(crop?.analysis.subjectCoverage).toBeGreaterThan(
      originalAnalysis.subjectCoverage,
    )
    expect(crop?.preflight.passed).toBe(true)
  })

  it('does not crop likely label/card packaging photos', async () => {
    const bytes = await makeLabelCardPhoto()
    const originalAnalysis = await analyzeServerImageQuality(bytes)

    const crop = await createGuardedJewelryPhotoCrop({
      bytes,
      analysis: originalAnalysis,
    })

    expect(crop).toBeNull()
  })
})
