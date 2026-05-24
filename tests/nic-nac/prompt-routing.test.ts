import { describe, expect, it } from 'vitest'
import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'

describe('Nic-Nac routed system prompt', () => {
  it('builds a compact live-show prompt without unrelated tool inventory', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: ['show_memory'],
      activeToolNames: [
        'get_show_session_context',
        'start_show_session',
        'record_show_session_event',
      ],
    })

    expect(prompt).toContain('You are Nic-Nac')
    expect(prompt).toContain('get_show_session_context')
    expect(prompt).toContain('record_show_session_event')
    expect(prompt).toContain('zero-provider state tools')
    expect(prompt).toContain('Do not pre-announce tool calls')
    expect(prompt).not.toContain('You have twenty-eight tools')
    expect(prompt).not.toContain('send_sms_notification')
    expect(prompt.length).toBeLessThan(8_000)
  })

  it('includes trade-board safety without loading calendar or notification copy', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: ['trade_board'],
      activeToolNames: [
        'list_my_trade_board',
        'remove_listing',
        'restore_listing',
        'add_listing',
        'update_listing',
        'search_jewelry_database',
      ],
    })

    expect(prompt).toContain('remove_listing requires the approval dialog')
    expect(prompt).not.toContain('clickwrapAccepted')
    expect(prompt).not.toContain('they own the piece')
    expect(prompt).toContain('recovery window')
    expect(prompt).toContain('If add_listing is active and the rep provides a missing field')
    expect(prompt).toContain('do not say add_listing is unavailable')
    expect(prompt).not.toContain('add_show')
    expect(prompt).not.toContain('send_sms_notification')
    expect(prompt.length).toBeLessThan(9_000)
  })

  it('keeps provider guardrails in notification prompts', () => {
    const prompt = buildNicNacSystemPrompt({
      intents: ['notification'],
      activeToolNames: [
        'send_sms_notification',
        'send_email_notification',
        'get_notification_preferences',
        'get_customer_audience',
      ],
    })

    expect(prompt).toContain('SMS sending is blocked until Telnyx 10DLC campaign approval')
    expect(prompt).toContain('can draft the text but cannot send it yet')
    expect(prompt).toContain('Do not claim live SMS delivery')
    expect(prompt).toContain('bulk SMS/email campaigns are not live')
    expect(prompt).toContain('No payment collection')
  })
})
