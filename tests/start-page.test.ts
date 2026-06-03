import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import StartPage from '@/app/start/page'

describe('Sparkle Suite start page', () => {
  it('renders a compact Nic-Nac launcher below the account form', () => {
    const html = renderToStaticMarkup(createElement(StartPage))
    const formIndex = html.indexOf('Continue with Google')
    const nicNacIndex = html.indexOf('Ask Nic-Nac')

    expect(formIndex).toBeGreaterThan(-1)
    expect(nicNacIndex).toBeGreaterThan(formIndex)
    expect(html).toContain('aria-label="Public Nic-Nac assistant"')
    expect(html).not.toContain('Still have questions? Ask Nic-Nac.')
  })

  it('keeps the compact Nic-Nac launcher from inheriting full landing-page shell height', () => {
    const css = readFileSync(
      join(process.cwd(), 'app', 'start', 'start.module.css'),
      'utf8',
    )

    expect(css).toContain('.nicNacLauncher:global(.sparkle-landing-v2)')
    expect(css).toContain('min-height: auto;')
    expect(css).toContain('background: transparent;')
  })
})
