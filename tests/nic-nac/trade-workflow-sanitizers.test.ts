import { describe, expect, it } from 'vitest'
import {
  normalizeTradeItemNumber,
  normalizeTradeRingSize,
  sanitizeCatalogCorrectionFields,
  sanitizeTradeWorkflowKnownFields,
} from '@/lib/nic-nac/workflows/trade-workflow-sanitizers'

describe('trade workflow sanitizers', () => {
  it('normalizes item numbers and rejects unsafe non-item text', () => {
    expect(normalizeTradeItemNumber(' er13229 ')).toBe('ER13229')
    expect(normalizeTradeItemNumber('please just use the Florence earrings')).toBeUndefined()
  })

  it('normalizes ring sizes for workflow-backed swap cleanup', () => {
    expect(normalizeTradeRingSize(' 7.5 ')).toBe('7.5')
    expect(normalizeTradeRingSize('huge')).toBeUndefined()
  })

  it('drops catalog correction fields outside the approved mutation contract', () => {
    expect(
      sanitizeCatalogCorrectionFields({
        designName: 'The Florence Earrings',
        canonicalPhotoUrl: ' https://example.com/approved/photo.jpg ',
        deleteEverything: true,
        sql: 'drop table jewelry_designs',
      }),
    ).toEqual({
      designName: 'The Florence Earrings',
      canonicalPhotoUrl: 'https://example.com/approved/photo.jpg',
    })
  })

  it('sanitizes known fields before they can back a mutation', () => {
    expect(
      sanitizeTradeWorkflowKnownFields({
        itemNumber: ' er13229 ',
        revealedItemNumber: 'rg 12345',
        revealedRingSize: '7',
        catalogCorrectionFields: {
          collectionName: ' July Birthday 2026 ',
          arbitraryModelGuess: 'nope',
        },
      }),
    ).toEqual({
      itemNumber: 'ER13229',
      revealedItemNumber: 'RG12345',
      revealedRingSize: '7',
      catalogCorrectionFields: {
        collectionName: 'July Birthday 2026',
      },
    })
  })
})
