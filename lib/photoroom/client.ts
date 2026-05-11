import { ServiceError } from '@/lib/services/errors'

import type {
  ExecutedPhotoEnhancement,
  PhotoEnhancementFetch,
  PreparedProviderRequest,
} from '@/lib/services/photo-enhancement-types'

function buildRequestUrl(request: PreparedProviderRequest): string {
  const url = new URL(request.url)

  for (const [key, value] of Object.entries(request.query ?? {})) {
    url.searchParams.append(key, String(value))
  }

  return url.toString()
}

function parseContentLength(value: string | null): number | null {
  if (!value) return null

  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null
}

function extractErrorDetailFromJson(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (!value || typeof value !== 'object') {
    return null
  }

  const record = value as Record<string, unknown>
  const directKeys = ['message', 'detail', 'error_description', 'error']
  for (const key of directKeys) {
    const candidate = record[key]
    const detail = extractErrorDetailFromJson(candidate)
    if (detail) {
      return detail
    }
  }

  if (Array.isArray(record.errors)) {
    for (const item of record.errors) {
      const detail = extractErrorDetailFromJson(item)
      if (detail) {
        return detail
      }
    }
  }

  return null
}

async function readErrorDetail(response: Response): Promise<string> {
  const contentType = response.headers.get('content-type') ?? ''

  if (contentType.includes('application/json')) {
    const json = await response.json().catch(() => null)
    const detail = extractErrorDetailFromJson(json)
    if (detail) {
      return detail
    }
  }

  const text = await response.text().catch(() => '')
  if (text.trim()) {
    return text.trim()
  }

  return `provider returned status ${response.status}`
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    (error as { name?: unknown }).name === 'AbortError'
  )
}

export async function executePhotoroomRequest(
  request: PreparedProviderRequest,
  options: {
    fetch?: PhotoEnhancementFetch
  } = {},
): Promise<ExecutedPhotoEnhancement> {
  const fetchImpl = options.fetch ?? fetch
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), request.timeoutMs)

  try {
    const response = await fetchImpl(buildRequestUrl(request), {
      method: request.method,
      headers: request.headers,
      signal: controller.signal,
    })

    if (!response.ok) {
      const detail = await readErrorDetail(response)
      const requestId = response.headers.get('x-request-id')
      const requestLabel = requestId ? ` (request ${requestId})` : ''

      throw new ServiceError({
        code: 'PHOTO_ENHANCEMENT_PROVIDER_FAILED',
        message: `photoroom request failed with status ${response.status}${requestLabel}: ${detail}`,
        userMessage:
          "Photo enhancement couldn't be completed by the image provider right now.",
        statusCode: 502,
      })
    }

    const bytes = new Uint8Array(await response.arrayBuffer())

    return {
      provider: 'photoroom',
      output: {
        bytes,
      },
      response: {
        statusCode: response.status,
        contentType: response.headers.get('content-type'),
        contentLength: parseContentLength(response.headers.get('content-length')),
        requestId: response.headers.get('x-request-id'),
      },
    }
  } catch (error) {
    if (error instanceof ServiceError) {
      throw error
    }

    if (isAbortError(error)) {
      throw new ServiceError({
        code: 'PHOTO_ENHANCEMENT_PROVIDER_TIMEOUT',
        message: `photoroom request timed out after ${request.timeoutMs}ms`,
        userMessage: 'Photo enhancement timed out while contacting the image provider.',
        statusCode: 504,
        cause: error,
      })
    }

    throw new ServiceError({
      code: 'PHOTO_ENHANCEMENT_PROVIDER_UNAVAILABLE',
      message:
        error instanceof Error
          ? `photoroom request failed before a response was received: ${error.message}`
          : 'photoroom request failed before a response was received',
      userMessage: "Photo enhancement couldn't reach the image provider right now.",
      statusCode: 502,
      cause: error,
    })
  } finally {
    clearTimeout(timeout)
  }
}
