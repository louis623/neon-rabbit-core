import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { EmptyGreeting } from '@/app/nic-nac/components/EmptyGreeting'
import { Chips } from '@/app/nic-nac/components/Chips'
import { InputRow } from '@/app/nic-nac/components/InputRow'
import { ThinkingIndicator } from '@/app/nic-nac/components/ThinkingIndicator'
import { NicNacHeader } from '@/app/nic-nac/components/NicNacHeader'

describe('Nic-Nac branding copy', () => {
  it('renders the rep-facing assistant name across the shell copy', () => {
    const greetingHtml = renderToStaticMarkup(createElement(EmptyGreeting))
    const inputHtml = renderToStaticMarkup(
      createElement(InputRow, {
        value: '',
        onChange: () => {},
        onSubmit: () => {},
        attachments: [],
        onPickFiles: () => {},
        onRemoveAttachment: () => {},
      }),
    )
    const thinkingHtml = renderToStaticMarkup(
      createElement(ThinkingIndicator, {
        showGlyph: true,
      }),
    )
    const headerHtml = renderToStaticMarkup(
      createElement(NicNacHeader, {
        closeLabel: 'Close Nic-Nac',
        onClose: () => {},
      }),
    )

    expect(greetingHtml).toContain("Hey, I&#x27;m Nic-Nac. How can I help?")
    expect(inputHtml).toContain('placeholder="Ask Nic-Nac…')
    expect(thinkingHtml).toContain('Nic-Nac is thinking…')
    expect(headerHtml).toContain('Nic-Nac')
    expect(headerHtml).toContain('aria-label="Close Nic-Nac"')
  })

  it('uses guided copy and setup prompts during required setup', () => {
    const greetingHtml = renderToStaticMarkup(
      createElement(EmptyGreeting, { mode: 'required_setup' }),
    )
    const chipsHtml = renderToStaticMarkup(
      createElement(Chips, {
        visible: true,
        mode: 'required_setup',
        onPick: () => {},
      }),
    )

    expect(greetingHtml).toContain('I&#x27;ll guide setup one step at a time.')
    expect(greetingHtml).toContain('We&#x27;ll start with account basics')
    expect(greetingHtml).not.toContain('What&#x27;s on your mind?')
    expect(chipsHtml).toContain('Start account basics')
    expect(chipsHtml).toContain('What do you need from me?')
    expect(chipsHtml).not.toContain('What&#x27;s on my board?')
    expect(chipsHtml).not.toContain('Remove a listing')
  })

  it('keeps required setup styling on the production Sparkle Suite palette', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.module.css',
      ),
      'utf8',
    )

    expect(css).toContain('#402924')
    expect(css).toContain('#ee2c9b')
    expect(css).toContain('Playfair Display')
    expect(css).toContain('DM Sans')
    expect(css).not.toContain(
      'linear-gradient(135deg, #fff8fb 0%, #f8efe9 42%, #402924 82%, #36221d 100%)',
    )
    expect(css).not.toMatch(/background:[^;}]*#402924[^;}]*#36221d[^;}]*;/)
  })
})
