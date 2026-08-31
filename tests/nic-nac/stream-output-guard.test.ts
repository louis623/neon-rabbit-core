import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  getNicNacToolOnlyRecoveryText,
  isRenderableNicNacStreamChunk,
  NIC_NAC_EMPTY_RESPONSE_FALLBACK,
} from '@/lib/nic-nac/core/stream-output-guard'

describe('Nic-Nac stream output guard', () => {
  it('does not mistake protocol-only chunks for a visible answer', () => {
    expect(isRenderableNicNacStreamChunk({ type: 'start-step' })).toBe(false)
    expect(isRenderableNicNacStreamChunk({ type: 'finish-step' })).toBe(false)
    expect(
      isRenderableNicNacStreamChunk({
        type: 'tool-input-start',
        toolCallId: 'tool-1',
        toolName: 'example_tool',
      }),
    ).toBe(false)
    expect(
      isRenderableNicNacStreamChunk({
        type: 'text-delta',
        id: 'text-1',
        delta: '   ',
      }),
    ).toBe(false)
  })

  it('recognizes only response parts the chat UI actually renders', () => {
    expect(
      isRenderableNicNacStreamChunk({
        type: 'text-delta',
        id: 'text-1',
        delta: 'Hello!',
      }),
    ).toBe(true)
    expect(
      isRenderableNicNacStreamChunk({
        type: 'tool-approval-request',
        approvalId: 'approval-1',
        toolCallId: 'tool-1',
      }),
    ).toBe(true)
    expect(
      isRenderableNicNacStreamChunk({
        type: 'tool-output-available',
        toolCallId: 'tool-1',
        output: { nextAction: 'internal-only' },
      }),
    ).toBe(false)
    expect(
      isRenderableNicNacStreamChunk({
        type: 'data-trade-request-card',
        data: { requestId: 'request-1' },
      } as never),
    ).toBe(true)
  })

  it('uses a customer-safe retry message when the model returns nothing', () => {
    expect(NIC_NAC_EMPTY_RESPONSE_FALLBACK).toContain('Please send that again')
    expect(NIC_NAC_EMPTY_RESPONSE_FALLBACK).not.toContain('error')

    const routeSource = readFileSync(
      resolve(process.cwd(), 'app/api/nic-nac/route.ts'),
      'utf8',
    )
    expect(routeSource).toContain("if (chunk.type === 'finish')")
    expect(routeSource).toContain('!sawRenderableOutput')
    expect(routeSource).toContain('NIC_NAC_EMPTY_RESPONSE_FALLBACK')
    expect(routeSource).toContain("'empty_model_output_recovered'")
  })

  it('turns resolver-only Dance Floor and Calendar completions into useful next questions', () => {
    expect(
      getNicNacToolOnlyRecoveryText('prepare_trade_board_work', {
        requiredBeforeAction: [
          'itemNumber',
          'designName',
          'collectionName',
          'jewelryFrontPhoto',
        ],
      }),
    ).toContain('Send the item number')
    expect(
      getNicNacToolOnlyRecoveryText('prepare_calendar_work', {
        intent: 'add_show',
      }),
    ).toContain('title, date and start time')
    expect(
      getNicNacToolOnlyRecoveryText('list_my_shows', { events: [] }),
    ).toBeNull()
  })
})
