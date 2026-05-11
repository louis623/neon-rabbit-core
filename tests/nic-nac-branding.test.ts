import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import { EmptyGreeting } from '@/app/thumper/components/EmptyGreeting'
import { InputRow } from '@/app/thumper/components/InputRow'
import { ThinkingIndicator } from '@/app/thumper/components/ThinkingIndicator'
import { ThumperHeader } from '@/app/thumper/components/ThumperHeader'

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
      createElement(ThumperHeader, {
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
})
