import { describe, expect, it } from 'vitest'

import { preparePhotoEnhancement } from '@/lib/services/photo-enhancement'

describe('photo enhancement service scaffold', () => {
  it('prepares a photoroom-first GET request from the provider-agnostic input shape', () => {
    const prepared = preparePhotoEnhancement(
      {
        assetId: 'asset-42',
        sourceImageUrl: 'https://cdn.example.com/ring.jpg',
        output: {
          format: 'png',
          background: 'transparent',
        },
        operations: {
          removeBackground: true,
          relight: 'auto',
        },
        context: {
          repId: 'rep-9',
          listingId: 'listing-22',
          traceId: 'trace-abc',
        },
      },
      {
        provider: {
          provider: 'photoroom',
          apiKey: 'phot_test_123',
          baseUrl: 'https://image-api.photoroom.test',
          timeoutMs: 8000,
        },
      },
    )

    expect(prepared.provider).toBe('photoroom')
    expect(prepared.request).toMatchObject({
      method: 'GET',
      url: 'https://image-api.photoroom.test/v2/edit',
      timeoutMs: 8000,
      headers: {
        'x-api-key': 'phot_test_123',
      },
      query: {
        imageUrl: 'https://cdn.example.com/ring.jpg',
        'export.format': 'png',
        removeBackground: true,
        'lighting.mode': 'ai.auto',
        repId: 'rep-9',
        listingId: 'listing-22',
        traceId: 'trace-abc',
      },
    })
  })

  it('omits optional provider fields that are not requested', () => {
    const prepared = preparePhotoEnhancement(
      {
        assetId: 'asset-43',
        sourceImageUrl: 'https://cdn.example.com/bracelet.jpg',
      },
      {
        provider: {
          provider: 'photoroom',
          apiKey: 'phot_test_123',
          baseUrl: 'https://image-api.photoroom.test/',
          timeoutMs: 5000,
        },
      },
    )

    expect(prepared.request.query).toEqual({
      imageUrl: 'https://cdn.example.com/bracelet.jpg',
      'export.format': 'png',
      removeBackground: true,
    })
  })
})
