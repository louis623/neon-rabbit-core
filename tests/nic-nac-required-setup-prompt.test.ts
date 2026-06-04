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

  it('uses clear account-basics language for customer-facing setup fields', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain(
      'What name do you want shown on your Sparkle Suite customer-facing website?',
    )
    expect(prompt).toContain('Ask one field at a time')
    expect(prompt).toContain('Do not dump the account-basics fields as a checklist')
    expect(prompt).toContain('Do not re-welcome the rep after they answer')
    expect(prompt).toContain(
      'If the latest user message answers "What should I call you?"',
    )
    expect(prompt).toContain(
      'Do not ask "What should I call you?" a second time',
    )
    expect(prompt).toContain(
      'Thanks, Jane. What name do you want shown on your Sparkle Suite customer-facing website?',
    )
    expect(prompt).toContain('What is your live show name?')
    expect(prompt).toContain('Bomb Party rep store link')
    expect(prompt).toContain('link customers use to shop or order from you')
    expect(prompt).toContain('Main live-show or social-media link')
    expect(prompt).toContain('conversationName')
    expect(prompt).toContain('customerFacingDisplayName')
    expect(prompt).toContain('liveShowName')
    expect(prompt).toContain('bombPartyRepStoreLink')
    expect(prompt).not.toContain('display name, business name, best contact detail, shop link')
    expect(prompt).not.toContain('Your business name')
    expect(prompt).not.toContain('Link to your shop or website')
  })

  it('uses customer-friendly Look language for the customer-site appearance step', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Customer-site Look')
    expect(prompt).toContain('The app shows the Look cards automatically')
    expect(prompt).toContain('You can change your Look later')
    expect(prompt).toContain('new Looks over time')
    expect(prompt).toContain('Do not make the rep ask to see the available Looks')
    expect(prompt).toContain('Do not call them skins when talking to the rep')
    expect(prompt).not.toContain('Customer-site look: pick or confirm the customer-site skin')
  })

  it('keeps welcome-copy setup from asking redundant tagline and intro questions', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain(
      'Welcome copy: capture a headline and one supporting welcome line',
    )
    expect(prompt).toContain(
      'Do not ask for both a tagline and a separate intro or welcome message if the rep already gave a usable supporting line',
    )
    expect(prompt).toContain(
      'If the rep says they already gave the welcome copy, reuse the prior answer instead of asking again',
    )
    expect(prompt).toContain(
      'Example: after "All are welcome. Enjoy the fizz, the bling, the sparkle, and the glam.", save it as the supporting welcome line',
    )
    expect(prompt).not.toContain('Welcome copy: tagline, banner, and customer-facing intro.')
  })

  it('requires About page options to preserve the rep-specific details', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain(
      'About page: preserve the rep-specific facts, names, humor, voice, and memorable details',
    )
    expect(prompt).toContain(
      'Do not replace concrete details with generic jewelry-show filler',
    )
    expect(prompt).toContain(
      'If the rep mentions being Gracie Bott, older, rescued from the shelter, running the household, banana and papaya habits, or wanting support for her cause, those details must appear in the About choices',
    )
    expect(prompt).toContain(
      'If an About draft drops the specifics the rep gave, rewrite it before showing it',
    )
    expect(prompt).not.toContain(
      'About page: invite the rep to free-talk, then turn that into 2 or 3 polished About page choices.',
    )
  })

  it('requires support escalation when Live Queue setup is blocked', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Live Queue setup')
    expect(prompt).toContain('Live Queue is not optional')
    expect(prompt).toContain('If Live Queue setup is blocked')
    expect(prompt).toContain('Live Queue sync code')
    expect(prompt).toContain(
      'Only provide a Live Queue sync code that came from get_required_setup_state.liveQueueSyncCode',
    )
    expect(prompt).toContain(
      'Never invent, infer, shorten, lengthen, or make a Fizz-style Live Queue sync code',
    )
    expect(prompt).toContain(
      'Expected assigned-code examples look like MHF-7342 or BWB-5819',
    )
    expect(prompt).toContain(
      'Do not present codes like GBBFIZZ2024 unless that exact value came from get_required_setup_state.liveQueueSyncCode',
    )
    expect(prompt).toContain(
      'Give the rep their saved Live Queue sync code in the same reply as the Chrome Extension Store link',
    )
    expect(prompt).toContain(
      'If the extension asks for a code, provide the saved Live Queue sync code directly',
    )
    expect(prompt).toContain(
      'Do not say the extension generates or displays the sync code',
    )
    expect(prompt).toContain('Do not ask for the rep email to look up the code')
    expect(prompt).toContain(
      'https://chromewebstore.google.com/detail/sparkle-suite-live-queue/kmodgfffflplfdlkkhadgimmobplhoih',
    )
    expect(prompt).toContain('Do not ask the rep to search')
    expect(prompt).toContain('request_required_setup_support')
    expect(prompt).toContain('notify Louis or support')
    expect(prompt).not.toContain('extension code')
    expect(prompt).not.toContain('generate a sync code')
    expect(prompt).not.toContain('come back later')
    expect(prompt).not.toContain('before your first live show')
    expect(prompt).not.toContain('Live Queue orientation')
  })

  it('requires email and SMS update readiness without live customer sends', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Email and SMS update readiness')
    expect(prompt).toContain('Do not send live customer messages during required setup')
    expect(prompt).toContain(
      'confirm the rep understands opt-in and update readiness',
    )
  })

  it('requires the final preview approval panel without guessing link location', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Do not guess where the preview link is')
    expect(prompt).toContain('The app shows the preview approval panel automatically')
    expect(prompt).toContain('Approve preview and unlock workspace')
    expect(prompt).not.toContain('look for a preview link')
    expect(prompt).not.toContain('somewhere on this page')
  })

  it('keeps setup voice concise and avoids repetitive filler', () => {
    const prompt = buildRequiredSetupPrompt()

    expect(prompt).toContain('Do not overuse Perfect')
    expect(prompt).toContain('Do not begin setup transitions with "Perfect. Now"')
    expect(prompt).toContain(
      'Use short confirmations like Got it, Thanks, That is saved, or We will use that',
    )
    expect(prompt).toContain('Do not amplify hype claims')
    expect(prompt).toContain(
      'Use customer-facing website, Sparkle Suite Workspace, Live Queue, Trade Board, and Look',
    )
    expect(prompt).not.toContain('LiveQ')
    expect(prompt).not.toContain('TradeBoard')
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
