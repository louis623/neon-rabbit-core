import { describe, expect, it } from 'vitest'
import { classifyNicNacToolFailure } from '@/lib/nic-nac/tool-failure-classification'

describe('classifyNicNacToolFailure', () => {
  it('identifies the ER59000 storage collision without calling it a photo-quality failure', () => {
    const error = Object.assign(new Error('The resource already exists'), {
      name: 'StorageApiError',
    })

    expect(classifyNicNacToolFailure(error)).toEqual({
      code: 'STORAGE_OBJECT_EXISTS',
      stage: 'catalog_photo_storage',
      retryable: true,
    })
  })

  it('classifies database uniqueness separately from photo storage', () => {
    const error = Object.assign(new Error('duplicate key value violates unique constraint'), {
      code: '23505',
    })

    expect(classifyNicNacToolFailure(error)).toEqual({
      code: 'DATABASE_UNIQUE_CONFLICT',
      stage: 'database_write',
      retryable: false,
    })
  })

  it('keeps unknown failures in the generic tool stage', () => {
    expect(classifyNicNacToolFailure(new Error('unexpected provider response'))).toEqual({
      code: 'UNHANDLED_TOOL_ERROR',
      stage: 'tool_execution',
      retryable: false,
    })
  })
})
