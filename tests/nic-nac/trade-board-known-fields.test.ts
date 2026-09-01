import { describe, expect, it } from 'vitest'

import type { UIMessage } from 'ai'

import {
  extractKnownFieldsFromCatalogToolOutputs,
  extractKnownFieldsFromText,
} from '@/lib/nic-nac/workflows/trade-board-known-fields'

describe('dance floor known-field extraction', () => {
  it('captures standalone Birthday collection names with years', () => {
    expect(extractKnownFieldsFromText('July Birthday 2026')).toMatchObject({
      collectionName: 'July Birthday',
      collectionYear: 2026,
    })
    expect(extractKnownFieldsFromText('April birthday 2026')).toMatchObject({
      collectionName: 'April Birthday',
      collectionYear: 2026,
    })
  })

  it('persists app-owned facts returned by the Dance Floor resolver', () => {
    const messages = [
      {
        id: 'assistant-resolver',
        role: 'assistant',
        parts: [
          {
            type: 'tool-prepare_trade_board_work',
            state: 'output-available',
            output: {
              catalogStatus: 'found',
              design: {
                itemNumber: 'ER13229',
                designName: 'The Florence Earrings',
                collectionName: 'July Birthday 2026',
                collectionYear: 2026,
                material: 'Rhodium Plating',
                mainStone: 'Lab-Created Ruby',
              },
            },
          },
        ],
      },
    ] as UIMessage[]

    expect(extractKnownFieldsFromCatalogToolOutputs(messages)).toMatchObject({
      itemNumber: 'ER13229',
      designName: 'The Florence Earrings',
      collectionName: 'July Birthday 2026',
      collectionYear: 2026,
      material: 'Rhodium Plating',
      mainStone: 'Lab-Created Ruby',
    })
  })
})
