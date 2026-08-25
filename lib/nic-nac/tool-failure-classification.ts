export type NicNacToolFailureStage =
  | 'catalog_photo_storage'
  | 'database_write'
  | 'listing_write'
  | 'tool_execution'

export interface NicNacToolFailureClassification {
  code: string
  stage: NicNacToolFailureStage
  retryable: boolean
}

export class NicNacMutationFailure extends Error {
  readonly code: string
  readonly stage: NicNacToolFailureStage
  readonly retryable: boolean

  constructor(args: {
    code: string
    stage: NicNacToolFailureStage
    retryable: boolean
    cause: unknown
  }) {
    super(args.cause instanceof Error ? args.cause.message : String(args.cause))
    this.name = 'NicNacMutationFailure'
    this.code = args.code
    this.stage = args.stage
    this.retryable = args.retryable
    ;(this as { cause?: unknown }).cause = args.cause
  }
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export function classifyNicNacToolFailure(
  error: unknown,
): NicNacToolFailureClassification {
  if (error instanceof NicNacMutationFailure) {
    return {
      code: error.code,
      stage: error.stage,
      retryable: error.retryable,
    }
  }
  const message = errorMessage(error)
  const name =
    error && typeof error === 'object' && 'name' in error
      ? String((error as { name?: unknown }).name ?? '')
      : ''
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code?: unknown }).code ?? '')
      : ''

  if (
    /StorageApiError/i.test(name) ||
    /resource already exists/i.test(message) ||
    /storage/i.test(code)
  ) {
    return {
      code: /resource already exists/i.test(message)
        ? 'STORAGE_OBJECT_EXISTS'
        : 'STORAGE_WRITE_FAILED',
      stage: 'catalog_photo_storage',
      retryable: true,
    }
  }

  if (
    code === '23505' ||
    /duplicate key|unique constraint|database/i.test(message)
  ) {
    return {
      code: code === '23505' ? 'DATABASE_UNIQUE_CONFLICT' : 'DATABASE_WRITE_FAILED',
      stage: 'database_write',
      retryable: false,
    }
  }

  return {
    code: code || 'UNHANDLED_TOOL_ERROR',
    stage: 'tool_execution',
    retryable: false,
  }
}
