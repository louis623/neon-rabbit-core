import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { CommunicationsConsole } from '@/app/control-center/_components/CommunicationsConsole'

describe('CommunicationsConsole', () => {
  it('renders a receive-only compose and preview workflow', () => {
    const html = renderToStaticMarkup(createElement(CommunicationsConsole))

    expect(html).toContain('Communications Console')
    expect(html).toContain('Reps can receive and read')
    expect(html).toContain('Save draft')
    expect(html).toContain('Preview audience')
    expect(html).toContain('Safe preview')
    expect(html).toContain('All active reps')
    expect(html).toContain('Selected reps')
    expect(html).toContain('Publication history')
    expect(html).toContain('In-app only')
    expect(html).not.toContain('Send email')
    expect(html).not.toContain('Send SMS')
    expect(html).not.toContain('Reply')
  })

  it('offers all supported message categories and priorities', () => {
    const html = renderToStaticMarkup(createElement(CommunicationsConsole))

    expect(html).toContain('Business update')
    expect(html).toContain('Monthly report')
    expect(html).toContain('Customer activity')
    expect(html).toContain('Help update')
    expect(html).toContain('Blog')
    expect(html).toContain('Video')
    expect(html).toContain('Action required')
  })
})
