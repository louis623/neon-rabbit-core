export type EnhancementProviderId = 'photoroom'

export type EnhancementOutputFormat = 'png' | 'jpeg' | 'webp'
export type EnhancementBackground = 'transparent' | 'white' | 'original'
export type EnhancementRelightMode =
  | 'off'
  | 'auto'
  | 'preserve-hue-and-saturation'

export interface PhotoEnhancementContext {
  repId?: string
  listingId?: string
  traceId?: string
}

export interface PhotoEnhancementInput {
  assetId: string
  sourceImageUrl: string
  output?: {
    format?: EnhancementOutputFormat
    background?: EnhancementBackground
  }
  operations?: {
    removeBackground?: boolean
    relight?: EnhancementRelightMode
  }
  context?: PhotoEnhancementContext
}

export interface PreparedProviderRequest {
  method: 'GET' | 'POST'
  url: string
  timeoutMs: number
  headers: Record<string, string>
  query?: Record<string, string | boolean | number>
  body?: Record<string, string | boolean | number>
}

export interface PreparedPhotoEnhancement {
  provider: EnhancementProviderId
  request: PreparedProviderRequest
}

export interface ExecutedPhotoEnhancement {
  provider: EnhancementProviderId
  output: {
    bytes: Uint8Array
  }
  response: {
    statusCode: number
    contentType: string | null
    contentLength: number | null
    requestId: string | null
  }
}

export interface PhotoroomProviderConfig {
  provider: 'photoroom'
  apiKey: string
  baseUrl: string
  timeoutMs: number
}

export type PhotoEnhancementProviderConfig = PhotoroomProviderConfig

export interface PhotoEnhancementProvider {
  provider: EnhancementProviderId
  prepare(input: PhotoEnhancementInput): PreparedPhotoEnhancement
}

export type PhotoEnhancementFetch = typeof fetch
