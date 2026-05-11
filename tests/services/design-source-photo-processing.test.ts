import { beforeEach, describe, expect, it, vi } from 'vitest'
import sharp from 'sharp'

const uploadJewelryPhotoMock = vi.fn()
const uploadStagedOriginalPhotoMock = vi.fn()

vi.mock('@/lib/services/storage', () => ({
  uploadJewelryPhoto: (...args: unknown[]) => uploadJewelryPhotoMock(...args),
  uploadStagedOriginalPhoto: (...args: unknown[]) =>
    uploadStagedOriginalPhotoMock(...args),
}))

import { ServiceError } from '@/lib/services/errors'
import { prepareDesignSourcePhoto } from '@/lib/services/design-source-photo-processing'

type FixtureMode = 'cleanLightBox' | 'dimFlat'

function scale(value: number, base: number, target: number) {
  return Math.max(1, Math.round((value / base) * target))
}

async function makePngBytes(
  width: number,
  height: number,
  mode: FixtureMode = 'cleanLightBox',
): Promise<Uint8Array> {
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

    return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer())
  }

  const subjectLeft = scale(360, 1800, width)
  const subjectTop = scale(360, 1800, height)
  const subjectWidth = scale(1080, 1800, width)
  const subjectHeight = scale(1080, 1800, height)
  const outerRadius = scale(120, 1800, width)
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

  const stripes = Array.from({ length: 12 }, (_, index) => {
    const x =
      subjectLeft + scale(30, 1800, width) + index * scale(80, 1800, width)

    return `<rect x="${x}" y="${stripeTop}" width="${stripeWidth}" height="${stripeHeight}" rx="${Math.max(1, Math.round(stripeWidth / 2))}" fill="#d9d9d9" opacity="0.95" />`
  }).join('')

  const bands = Array.from({ length: 10 }, (_, index) => {
    const y =
      subjectTop + scale(45, 1800, height) + index * scale(92, 1800, height)

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

  return new Uint8Array(await sharp(Buffer.from(svg)).png().toBuffer())
}

function toDataUrl(contentType: string, bytes: Uint8Array) {
  return `data:${contentType};base64,${Buffer.from(bytes).toString('base64')}`
}

function makeImageResponse(bytes: Uint8Array, contentType = 'image/png', status = 200) {
  return new Response(Buffer.from(bytes), {
    status,
    headers: {
      'content-type': contentType,
    },
  })
}

describe('prepareDesignSourcePhoto', () => {
  beforeEach(() => {
    uploadJewelryPhotoMock.mockReset()
    uploadStagedOriginalPhotoMock.mockReset()
  })

  it('normalizes, stages, and scores a clean chat-upload data URL', async () => {
    const bytes = await makePngBytes(1800, 1800, 'cleanLightBox')
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/ring-original.png',
      signedUrl: 'https://signed.example.com/ring-original',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://cdn.example.com/jewelry-photos/rep-1/ring-source.png',
    )

    const result = await prepareDesignSourcePhoto({
      repId: 'rep-1',
      filenameStem: 'ring',
      sourceImageDataUrl: toDataUrl('image/png', bytes),
    })

    expect(result.publicPhotoUrl).toBe(
      'https://cdn.example.com/jewelry-photos/rep-1/ring-source.png',
    )
    expect(result.stagedOriginal).toEqual({
      objectPath: 'rep-1/originals/ring-original.png',
      signedUrl: 'https://signed.example.com/ring-original',
    })
    expect(result.preflight).toMatchObject({
      passed: true,
      score: 100,
      issues: [],
    })
    expect(result.analysis.detailRisk).toBeLessThan(0.1)
    expect(result.analysis.backgroundDistractionRisk).toBeLessThan(0.15)
  })

  it('rejects a dim low-detail source photo before any upload happens', async () => {
    const bytes = await makePngBytes(1800, 1800, 'dimFlat')

    await expect(
      prepareDesignSourcePhoto({
        repId: 'rep-1',
        filenameStem: 'ring',
        sourceImageDataUrl: toDataUrl('image/png', bytes),
      }),
    ).rejects.toMatchObject({
      code: 'PHOTO_PREFLIGHT_FAILED',
      userMessage: expect.stringContaining('That photo needs one more try'),
    })

    expect(uploadStagedOriginalPhotoMock).not.toHaveBeenCalled()
    expect(uploadJewelryPhotoMock).not.toHaveBeenCalled()
  })

  it('fetches and normalizes a volunteered remote URL through the same prep path', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeImageResponse(await makePngBytes(1800, 1800)))
    uploadStagedOriginalPhotoMock.mockResolvedValueOnce({
      objectPath: 'rep-1/originals/ring-remote.png',
      signedUrl: 'https://signed.example.com/ring-remote',
    })
    uploadJewelryPhotoMock.mockResolvedValueOnce(
      'https://cdn.example.com/jewelry-photos/rep-1/ring-remote.png',
    )

    const result = await prepareDesignSourcePhoto(
      {
        repId: 'rep-1',
        filenameStem: 'ring',
        sourceImageUrl: 'https://dropbox.example.com/ring.png',
      },
      { fetch: fetchMock },
    )

    expect(fetchMock).toHaveBeenCalledWith('https://dropbox.example.com/ring.png')
    expect(result.preflight.passed).toBe(true)
    expect(result.publicPhotoUrl).toBe(
      'https://cdn.example.com/jewelry-photos/rep-1/ring-remote.png',
    )
  })

  it('returns a rewrite-friendly error when a remote source URL cannot be fetched', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(makeImageResponse(new Uint8Array([1]), 'text/plain', 404))

    const failingCall = prepareDesignSourcePhoto(
      {
        repId: 'rep-1',
        filenameStem: 'ring',
        sourceImageUrl: 'https://dropbox.example.com/missing.png',
      },
      { fetch: fetchMock },
    )

    await expect(failingCall).rejects.toBeInstanceOf(ServiceError)

    await expect(failingCall).rejects.toMatchObject({
      code: 'PIECE_PHOTO_FETCH_FAILED',
      userMessage: expect.stringContaining("couldn't fetch"),
    })
  })
})
