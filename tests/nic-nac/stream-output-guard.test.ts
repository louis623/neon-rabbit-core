import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  getNicNacMandatoryToolFollowUpText,
  getNicNacToolOnlyRecoveryText,
  getNicNacToolFailure,
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
    ).toBe('You don’t have any matching shows on your Calendar right now.')
    expect(
      getNicNacToolOnlyRecoveryText('list_my_shows', {
        count: 1,
        events: [
          {
            title: 'Coffee and Fizz',
            eventTime: '2026-09-02T13:00:00.000Z',
            timeZone: 'America/New_York',
            platform: 'Facebook Live',
            status: 'scheduled',
          },
        ],
      }),
    ).toBe(
      'You have 1 matching show on your Calendar.\n' +
        '1. Coffee and Fizz — Wednesday, September 2 at 9:00 AM EDT on Facebook Live (scheduled).',
    )
  })

  it('renders deterministic customer-visible summaries for every Trade read workflow', () => {
    expect(
      getNicNacToolOnlyRecoveryText('list_my_trade_board', {
        count: 1,
        totalMsrp: 54,
        listings: [
          {
            designName: 'The Starlight Earrings',
            itemNumber: 'ER12345',
            status: 'available',
            quantityAvailable: 2,
          },
        ],
      }),
    ).toBe(
      'Your Dance Floor has 1 matching dancer with $54 total MSRP.\n' +
        '1. The Starlight Earrings (ER12345) — available, quantity 2.',
    )

    expect(
      getNicNacToolOnlyRecoveryText('get_trade_requests', {
        count: 1,
        requests: [
          {
            customerName: 'Synthetic Reviewer',
            status: 'pending',
            listing: {
              design: {
                designName: 'The Starlight Earrings',
                itemNumber: 'ER12345',
              },
            },
          },
        ],
      }),
    ).toContain(
      'Synthetic Reviewer requested The Starlight Earrings (ER12345) — pending.',
    )

    expect(
      getNicNacToolOnlyRecoveryText('get_fulfillment_queue', {
        count: 1,
        needsAttentionCount: 1,
        queue: [
          {
            customerName: 'Synthetic Reviewer',
            designName: 'The Starlight Earrings',
            status: 'approved',
            suggestedNextAction: 'mark_shipped',
          },
        ],
      }),
    ).toContain('next: mark shipped')

    expect(
      getNicNacToolOnlyRecoveryText('get_trade_swap_cleanup', {
        count: 1,
        items: [
          {
            customerName: 'Synthetic Reviewer',
            revealedItemNumber: 'RG98765',
            revealedRingSize: '8',
            replacementStatus: 'needs_catalog_match',
          },
        ],
      }),
    ).toContain('RG98765, ring size 8 — needs catalog match')

    expect(
      getNicNacToolOnlyRecoveryText('search_jewelry_database', {
        count: 1,
        results: [
          {
            designName: 'The Starlight Earrings',
            itemNumber: 'ER12345',
            msrp: 54,
            isOnMyBoard: false,
          },
        ],
      }),
    ).toBe(
      'I found 1 matching catalog record.\n' +
        '1. The Starlight Earrings (ER12345) — MSRP $54; not currently on your Dance Floor.',
    )

    expect(
      getNicNacToolOnlyRecoveryText('get_trade_history', {
        count: 1,
        items: [
          {
            customerName: 'Synthetic Reviewer',
            status: 'approved',
            design: { designName: 'The Starlight Earrings' },
          },
        ],
      }),
    ).toContain('The Starlight Earrings with Synthetic Reviewer — approved.')
  })

  it('returns truthful empty-state summaries instead of the generic blank-response apology', () => {
    const cases = [
      ['list_my_trade_board', { count: 0, listings: [] }],
      ['get_trade_requests', { count: 0, requests: [] }],
      ['get_fulfillment_queue', { count: 0, queue: [] }],
      ['get_trade_swap_cleanup', { count: 0, items: [] }],
      ['search_jewelry_database', { count: 0, results: [] }],
      ['get_trade_history', { count: 0, items: [] }],
      ['list_my_shows', { count: 0, events: [] }],
    ] as const

    for (const [toolName, output] of cases) {
      const recovery = getNicNacToolOnlyRecoveryText(toolName, output)
      expect(recovery).toBeTruthy()
      expect(recovery).not.toBe(NIC_NAC_EMPTY_RESPONSE_FALLBACK)
      expect(recovery).not.toContain('send that again')
    }
  })

  it('requires the received-piece follow-up after completed fulfillment', () => {
    expect(
      getNicNacMandatoryToolFollowUpText('update_fulfillment_status', {
        status: 'completed',
        shouldPromptAddToBoard: true,
      }),
    ).toContain('dancer you received')
    expect(
      getNicNacMandatoryToolFollowUpText('update_fulfillment_status', {
        status: 'shipped',
        shouldPromptAddToBoard: false,
      }),
    ).toBeNull()
  })

  it('detects structured tool failures and never presents them as resolver success', () => {
    const output = {
      ok: false,
      errorTier: 'escalate',
      message: "Something unexpected happened. I've flagged this.",
    }
    expect(getNicNacToolFailure('prepare_trade_board_work', output)).toEqual({
      toolName: 'prepare_trade_board_work',
      errorTier: 'escalate',
      code: null,
      stage: null,
      message: "Something unexpected happened. I've flagged this.",
    })
    const recovery = getNicNacToolOnlyRecoveryText(
      'prepare_trade_board_work',
      output,
    )
    expect(recovery).toContain('couldn’t check the Dance Floor catalog')
    expect(recovery).toContain("haven’t changed anything")
    expect(recovery).not.toContain('Send the item number')
  })
})
