import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { ResourcePublisher } from '@/app/control-center/_components/ResourcePublisher'

describe('Resource Publisher', () => {
  it('keeps the initial blog form small and entirely optional', () => {
    const html = renderToStaticMarkup(createElement(ResourcePublisher, { initialResources: [] }))

    expect(html).toContain('Blog content')
    expect(html).toContain('(optional)')
    expect(html).not.toContain('required=""')
    expect(html).not.toContain('Thumbnail URL')
    expect(html).not.toContain('What changed?')
    expect(html).not.toContain('Feature this resource')
  })
})
