import { describe, expect, it, vi } from 'vitest'

import { executePhotoEnhancement } from '@/lib/services/photo-enhancement'

describe('photo enhancement execution', () => {
  it('executes the prepared photoroom GET request and returns binary output with metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: {
          'content-type': 'image/png',
          'content-length': '4',
          'x-request-id': 'req_123',
        },
      }),
    )

    const result = await executePhotoEnhancement(
      {
        assetId: 'asset-42',
        sourceImageUrl: 'https://cdn.example.com/ring.jpg',
        output: {
          format: 'png',
          background: 'white',
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
          baseUrl: 'https://image-api.photoroom.test/',
          timeoutMs: 8000,
        },
        fetch: fetchMock,
      },
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      'https://image-api.photoroom.test/v2/edit?imageUrl=https%3A%2F%2Fcdn.example.com%2Fring.jpg&export.format=png&removeBackground=true&background.color=FFFFFF&lighting.mode=ai.auto&traceId=trace-abc&repId=rep-9&listingId=listing-22',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'x-api-key': 'phot_test_123',
        },
        signal: expect.any(AbortSignal),
      }),
    )

    expect(result).toEqual({
      provider: 'photoroom',
      output: {
        bytes: new Uint8Array([137, 80, 78, 71]),
      },
      response: {
        statusCode: 200,
        contentType: 'image/png',
        contentLength: 4,
        requestId: 'req_123',
      },
    })
  })

  it('wraps provider API failures in a service error with response metadata', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: 'invalid image URL' }), {
        status: 422,
        headers: {
          'content-type': 'application/json',
          'x-request-id': 'req_422',
        },
      }),
    )

    await expect(
      executePhotoEnhancement(
        {
          assetId: 'asset-42',
          sourceImageUrl: 'https://cdn.example.com/ring.jpg',
        },
        {
          provider: {
            provider: 'photoroom',
            apiKey: 'phot_test_123',
            baseUrl: 'https://image-api.photoroom.test',
            timeoutMs: 8000,
          },
          fetch: fetchMock,
        },
      ),
    ).rejects.toMatchObject({
      name: 'ServiceError',
      code: 'PHOTO_ENHANCEMENT_PROVIDER_FAILED',
      statusCode: 502,
      message:
        'photoroom request failed with status 422 (request req_422): invalid image URL',
      userMessage:
        "Photo enhancement couldn't be completed by the image provider right now.",
    })
  })
})
