import type {
  PhotoEnhancementInput,
  PhotoEnhancementProvider,
  PhotoroomProviderConfig,
} from '@/lib/services/photo-enhancement-types'

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function buildRequestBody(
  input: PhotoEnhancementInput,
): Record<string, string | boolean | number> {
  const query: Record<string, string | boolean | number> = {
    imageUrl: input.sourceImageUrl,
    'export.format': input.output?.format ?? 'png',
    removeBackground: input.operations?.removeBackground ?? true,
  }

  if (input.output?.background === 'white') {
    query['background.color'] = 'FFFFFF'
  }

  if (input.output?.background === 'original') {
    query.removeBackground = false
  }

  const relightMode = input.operations?.relight
  if (relightMode === 'auto') {
    query['lighting.mode'] = 'ai.auto'
  } else if (relightMode === 'preserve-hue-and-saturation') {
    query['lighting.mode'] = 'ai.preserve-hue-and-saturation'
  }

  if (input.context?.traceId) {
    query.traceId = input.context.traceId
  }

  if (input.context?.repId) {
    query.repId = input.context.repId
  }

  if (input.context?.listingId) {
    query.listingId = input.context.listingId
  }

  return query
}

export function createPhotoroomProvider(
  config: PhotoroomProviderConfig,
): PhotoEnhancementProvider {
  const baseUrl = trimTrailingSlash(config.baseUrl)

  return {
    provider: 'photoroom',
    prepare(input) {
      return {
        provider: 'photoroom',
        request: {
          method: 'GET',
          url: `${baseUrl}/v2/edit`,
          timeoutMs: config.timeoutMs,
          headers: {
            'x-api-key': config.apiKey,
          },
          query: buildRequestBody(input),
        },
      }
    },
  }
}
