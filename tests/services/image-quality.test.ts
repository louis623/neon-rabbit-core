import { describe, expect, it } from 'vitest'

import { measureImageQualitySignals } from '@/lib/nic-nac/image-quality'

function clampChannel(value: number) {
  return Math.max(0, Math.min(255, Math.round(value)))
}

function createLightBoxFrame(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4)
  const left = Math.floor(width * 0.18)
  const top = Math.floor(height * 0.18)
  const subjectWidth = Math.floor(width * 0.64)
  const subjectHeight = Math.floor(height * 0.64)
  const right = left + subjectWidth
  const bottom = top + subjectHeight

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      let value =
        246 + ((x - width / 2) / width) * 8 + ((y - height / 2) / height) * 8

      if (x >= left && x < right && y >= top && y < bottom) {
        const nx = (x - left) / Math.max(1, subjectWidth - 1)
        const ny = (y - top) / Math.max(1, subjectHeight - 1)
        const stripe =
          ((Math.floor(nx * 6) + Math.floor(ny * 6)) % 2) * 18
        const ridge =
          Math.sin(nx * Math.PI) * 26 + Math.sin(ny * Math.PI * 3) * 10
        value = 52 + ridge + stripe

        const inset = Math.min(
          x - left,
          right - x - 1,
          y - top,
          bottom - y - 1,
        )
        if (inset < 3) value -= 28
      }

      const pixel = clampChannel(value)
      data[i] = pixel
      data[i + 1] = pixel
      data[i + 2] = pixel
      data[i + 3] = 255
    }
  }

  return data
}

function createDimFlatFrame(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4)

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      const value =
        54 +
        (((x - width / 2) ** 2 + (y - height / 2) ** 2) / (width * height)) *
          1.5
      const pixel = clampChannel(value)
      data[i] = pixel
      data[i + 1] = pixel
      data[i + 2] = pixel
      data[i + 3] = 255
    }
  }

  return data
}

function createOffCenterFrame(width: number, height: number) {
  const data = new Uint8ClampedArray(width * height * 4)
  const left = 2
  const top = 4
  const subjectWidth = 12
  const subjectHeight = 12
  const right = left + subjectWidth
  const bottom = top + subjectHeight

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const i = (y * width + x) * 4
      let value =
        246 + ((x - width / 2) / width) * 8 + ((y - height / 2) / height) * 8

      if (x >= left && x < right && y >= top && y < bottom) {
        const nx = (x - left) / Math.max(1, subjectWidth - 1)
        const ny = (y - top) / Math.max(1, subjectHeight - 1)
        const stripe =
          ((Math.floor(nx * 4) + Math.floor(ny * 4)) % 2) * 18
        const ridge =
          Math.sin(nx * Math.PI) * 20 + Math.sin(ny * Math.PI * 2) * 8
        value = 58 + ridge + stripe

        const inset = Math.min(
          x - left,
          right - x - 1,
          y - top,
          bottom - y - 1,
        )
        if (inset < 2) value -= 24
      }

      const pixel = clampChannel(value)
      data[i] = pixel
      data[i + 1] = pixel
      data[i + 2] = pixel
      data[i + 3] = 255
    }
  }

  return data
}

describe('measureImageQualitySignals', () => {
  it('scores a clean light-box-style frame as detailed, centered, and background-safe', () => {
    const width = 40
    const height = 40

    const result = measureImageQualitySignals({
      data: createLightBoxFrame(width, height),
      width,
      height,
    })

    expect(result.blurRisk).toBeLessThan(0.05)
    expect(result.lightingRisk).toBeLessThan(0.08)
    expect(result.subjectCoverage).toBeGreaterThan(0.35)
    expect(result.subjectCentered).toBe(true)
    expect(result.detailConfidence).toBeGreaterThan(0.95)
    expect(result.backgroundUniformity).toBeGreaterThan(0.8)
    expect(result.backgroundCleanliness).toBeGreaterThan(0.8)
  })

  it('scores a dim flat frame as low-detail even when the background stays visually even', () => {
    const width = 40
    const height = 40

    const result = measureImageQualitySignals({
      data: createDimFlatFrame(width, height),
      width,
      height,
    })

    expect(result.blurRisk).toBeGreaterThan(0.75)
    expect(result.lightingRisk).toBeGreaterThan(0.45)
    expect(result.subjectCoverage).toBe(0)
    expect(result.subjectCentered).toBe(false)
    expect(result.detailConfidence).toBeLessThan(0.05)
    expect(result.backgroundUniformity).toBeGreaterThan(0.95)
    expect(result.backgroundCleanliness).toBeGreaterThan(0.95)
  })

  it('marks a crisp but cramped off-center subject as poorly framed instead of low-detail', () => {
    const width = 40
    const height = 40

    const result = measureImageQualitySignals({
      data: createOffCenterFrame(width, height),
      width,
      height,
    })

    expect(result.blurRisk).toBeLessThan(0.3)
    expect(result.lightingRisk).toBeLessThan(0.3)
    expect(result.subjectCoverage).toBeLessThan(0.12)
    expect(result.subjectCentered).toBe(false)
    expect(result.detailConfidence).toBeGreaterThan(0.8)
    expect(result.backgroundUniformity).toBeLessThan(0.4)
    expect(result.backgroundCleanliness).toBeLessThan(0.25)
  })
})
