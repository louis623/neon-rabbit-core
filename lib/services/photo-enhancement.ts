import { ServiceError } from '@/lib/services/errors'
import { executePhotoroomRequest } from '@/lib/photoroom/client'
import { getPhotoroomConfig } from '@/lib/photoroom/config'
import { createPhotoroomProvider } from '@/lib/photoroom/provider'

import type {
  ExecutedPhotoEnhancement,
  PhotoEnhancementFetch,
  PhotoEnhancementInput,
  PhotoEnhancementProvider,
  PhotoEnhancementProviderConfig,
  PreparedPhotoEnhancement,
} from '@/lib/services/photo-enhancement-types'

function isProviderInstance(
  value: PhotoEnhancementProvider | PhotoEnhancementProviderConfig,
): value is PhotoEnhancementProvider {
  return typeof value === 'object' && value !== null && 'prepare' in value
}

function getProviderFromConfig(
  config: PhotoEnhancementProviderConfig,
): PhotoEnhancementProvider {
  if (config.provider === 'photoroom') {
    return createPhotoroomProvider(config)
  }

  throw new ServiceError({
    code: 'PHOTO_ENHANCEMENT_PROVIDER_UNSUPPORTED',
    message: `unsupported enhancement provider: ${config.provider}`,
    userMessage: 'That enhancement provider is not supported yet.',
    statusCode: 400,
  })
}

function resolveProvider(
  provider?: PhotoEnhancementProvider | PhotoEnhancementProviderConfig,
): PhotoEnhancementProvider {
  if (provider) {
    return isProviderInstance(provider) ? provider : getProviderFromConfig(provider)
  }

  const photoroom = getPhotoroomConfig()
  if (photoroom) {
    return getProviderFromConfig(photoroom)
  }

  throw new ServiceError({
    code: 'PHOTO_ENHANCEMENT_NOT_CONFIGURED',
    message: 'photo enhancement provider is not configured',
    userMessage: "Photo enhancement isn't configured in this environment yet.",
    statusCode: 503,
  })
}

export function preparePhotoEnhancement(
  input: PhotoEnhancementInput,
  options: {
    provider?: PhotoEnhancementProvider | PhotoEnhancementProviderConfig
  } = {},
): PreparedPhotoEnhancement {
  return resolveProvider(options.provider).prepare(input)
}

export async function executePreparedPhotoEnhancement(
  prepared: PreparedPhotoEnhancement,
  options: {
    fetch?: PhotoEnhancementFetch
  } = {},
): Promise<ExecutedPhotoEnhancement> {
  if (prepared.provider === 'photoroom') {
    return executePhotoroomRequest(prepared.request, options)
  }

  throw new ServiceError({
    code: 'PHOTO_ENHANCEMENT_PROVIDER_UNSUPPORTED',
    message: `unsupported enhancement provider: ${prepared.provider}`,
    userMessage: 'That enhancement provider is not supported yet.',
    statusCode: 400,
  })
}

export async function executePhotoEnhancement(
  input: PhotoEnhancementInput,
  options: {
    provider?: PhotoEnhancementProvider | PhotoEnhancementProviderConfig
    fetch?: PhotoEnhancementFetch
  } = {},
): Promise<ExecutedPhotoEnhancement> {
  const prepared = preparePhotoEnhancement(input, {
    provider: options.provider,
  })

  return executePreparedPhotoEnhancement(prepared, {
    fetch: options.fetch,
  })
}
