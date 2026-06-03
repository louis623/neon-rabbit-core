import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { EmptyGreeting } from '@/app/nic-nac/components/EmptyGreeting'
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

    expect(greetingHtml).toContain("Hey, I&#x27;m Nic-Nac.")
    expect(inputHtml).toContain('placeholder="Ask Nic-Nac…')
    expect(thinkingHtml).toContain('Nic-Nac is thinking…')
    expect(headerHtml).toContain('Nic-Nac')
    expect(headerHtml).toContain('aria-label="Close Nic-Nac"')
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
    expect(css).toContain('#36221d')
    expect(css).toContain('#ee2c9b')
    expect(css).toContain('Playfair Display')
    expect(css).toContain('DM Sans')
  })
})
