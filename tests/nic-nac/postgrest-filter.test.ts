import { describe, expect, it } from 'vitest'

import {
  buildPostgrestIlikeAnyFilter,
  escapePostgrestIlikePattern,
} from '@/lib/services/postgrest-filter'

describe('PostgREST user-text filters', () => {
  it('quotes commas and punctuation so they cannot break the logic tree', () => {
    expect(
      buildPostgrestIlikeAnyFilter(
        ['design_name', 'material'],
        'Nic-Nac. I need to add a dancer to my dance floor, please.',
      ),
    ).toBe(
      'design_name.ilike."%Nic-Nac. I need to add a dancer to my dance floor, please.%",material.ilike."%Nic-Nac. I need to add a dancer to my dance floor, please.%"',
    )
  })

  it('escapes ILIKE wildcard characters', () => {
    expect(escapePostgrestIlikePattern('100%_match')).toBe('100\\%\\_match')
  })

  it('rejects untrusted column grammar', () => {
    expect(() =>
      buildPostgrestIlikeAnyFilter(['design_name,delete()'], 'test'),
    ).toThrow('trusted identifiers')
  })
})
