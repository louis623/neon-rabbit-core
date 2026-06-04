import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { NicNacMark } from '@/app/_components/nic-nac-mark'
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

  it('uses guided copy without prompt chips during required setup', () => {
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

    expect(greetingHtml).toContain('Welcome to your new Sparkle Suite.')
    expect(greetingHtml).toContain('We&#x27;re happy to have you.')
    expect(greetingHtml).toContain('I&#x27;m Nic-Nac, your built-in live show assistant.')
    expect(greetingHtml).toContain('Sparkle Suite Workspace')
    expect(greetingHtml).toContain('customer-facing website ready!')
    expect(greetingHtml).toContain('What should I call you?')
    expect(greetingHtml).not.toContain('What&#x27;s on your mind?')
    expect(chipsHtml).toBe('')
    expect(chipsHtml).not.toContain('Start account basics')
    expect(chipsHtml).not.toContain('What do you need from me?')
    expect(chipsHtml).not.toContain('What&#x27;s on my board?')
    expect(chipsHtml).not.toContain('Remove a listing')
  })

  it('keeps prompt chips available in the normal workspace', () => {
    const chipsHtml = renderToStaticMarkup(
      createElement(Chips, {
        visible: true,
        mode: 'workspace',
        onPick: () => {},
      }),
    )

    expect(chipsHtml).toContain('What&#x27;s on my board?')
    expect(chipsHtml).toContain('Remove a listing')
    expect(chipsHtml).not.toContain('Start account basics')
    expect(chipsHtml).not.toContain('What do you need from me?')
  })

  it('uses the approved bright pink circle with a white N for every shared Nic-Nac mark', () => {
    const markHtml = renderToStaticMarkup(createElement(NicNacMark, { size: 34 }))
    const markCss = readFileSync(
      resolve(process.cwd(), 'app/_components/nic-nac-mark.module.css'),
      'utf8',
    )

    expect(markHtml).toContain('N')
    expect(markHtml).toContain('width:34px')
    expect(markHtml).toContain('height:34px')
    expect(markCss).toContain('background: #ee2c9b')
    expect(markCss).toContain('color: #ffffff')
    expect(markCss).toContain('border-radius: 999px')
    expect(markCss).toContain('font-family: "DM Sans"')
    expect(markCss).not.toContain('var(--nic-nac-accent')
    expect(markCss).not.toContain('var(--nic-nac-text-on-accent')
    expect(markCss).not.toContain('box-shadow')
  })

  it('does not let required setup header text styling override the shared Nic-Nac mark', () => {
    const requiredSetupHome = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.tsx',
      ),
      'utf8',
    )
    const requiredSetupCss = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/RequiredSetupHome.module.css',
      ),
      'utf8',
    )

    expect(requiredSetupHome).toContain('className={styles.chatStatus}')
    expect(requiredSetupCss).toContain('.chatStatus')
    expect(requiredSetupCss).not.toContain('.chatHeader span')
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
