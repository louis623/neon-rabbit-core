import { describe, expect, it } from 'vitest'
import { buildNicNacSystemPrompt } from '@/lib/nic-nac/prompt-builder'
import { buildRequiredSetupPrompt } from '@/lib/nic-nac/required-setup-prompt'

describe('required Nic-Nac setup prompt', () => {
  it('requires chat-based setup and brand-safe unlock', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('one question at a time')
    expect(prompt).toContain('Do not send the rep to an old checklist')
    expect(prompt).toContain(
      'Do not unlock the full dashboard until every required setup step is complete',
    )
    expect(prompt).toContain('rep has approved the final preview')
    expect(prompt).toContain('About page')
    expect(prompt).toContain('Trade Board orientation')
    expect(prompt).toContain('The light box is ordered by Sparkle Suite after payment')
    expect(prompt).toContain('repApprovedPreview')
    expect(prompt).not.toContain('populate the Trade Board before unlock')
  })

  it('adds required setup instructions without workspace tool sections in setup mode', () => {
    const prompt = buildNicNacSystemPrompt({
      mode: 'required_setup',
      intents: ['required_setup'],
      activeToolNames: [
        'get_required_setup_state',
        'save_required_setup_answer',
        'request_required_setup_support',
        'unlock_required_setup',
      ],
    })

    expect(prompt).toContain('Required Nic-Nac setup mode')
    expect(prompt).toContain('save_required_setup_answer')
    expect(prompt).toContain('unlock_required_setup')
    expect(prompt).toContain('Only call tools in the active list')
    expect(prompt).not.toContain('Trade-board tools:')
    expect(prompt).not.toContain('Calendar tools:')
    expect(prompt).not.toContain('send_sms_notification')
  })
})
