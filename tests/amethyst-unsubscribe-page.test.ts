import { describe, expect, it } from 'vitest'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

import UnsubscribePage from '@/app/amethyst/unsubscribe/page'

describe('Amethyst unsubscribe page', () => {
  it('renders a public unsubscribe form with both SMS and email options', () => {
    const html = renderToStaticMarkup(createElement(UnsubscribePage))

    expect(html).toContain('Unsubscribe from updates')
    expect(html).toContain('Phone number')
    expect(html).toContain('Email address')
    expect(html).toContain('Stop SMS updates')
    expect(html).toContain('Stop email updates')
    expect(html).toContain('/api/amethyst/customer-audience/unsubscribe')
  })
})
