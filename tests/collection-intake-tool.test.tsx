import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { CollectionIntakeTool } from '@/app/nic-nac/components/CollectionIntakeTool'

describe('CollectionIntakeTool', () => {
  it('renders the preserved folder-first intake contract inside the workspace', () => {
    const html = renderToStaticMarkup(createElement(CollectionIntakeTool))

    expect(html).toContain('Collection Intake')
    expect(html).toContain('Bulk-add jewelry to your Trade Board.')
    expect(html).toContain('Work one piece at a time.')
    expect(html).toContain('Capture order keeps each set grouped.')
    expect(html).toContain('Choose photo folder')
    expect(html).toContain('Photo batch upload')
    expect(html).toContain('Trade Board-only minimum')
    expect(html).toContain('Shared jewelry database')
    expect(html).toContain('No live records are changed')
    expect(html).not.toContain('Rep business name')
    expect(html).not.toContain('Prototype only:')
  })

  it('uses a real image folder input while keeping publishing local-only', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/CollectionIntakeTool.tsx',
      ),
      'utf8',
    )

    expect(source).toContain("type=\"file\"")
    expect(source).toContain('accept="image/*"')
    expect(source).toContain('webkitdirectory')
    expect(source).toContain('multiple')
    expect(source).toContain('Review decision saved locally. No live data changed.')
    expect(source).toContain('Without an item number and verified jewelry details')
    expect(source).not.toContain('createClient')
    expect(source).not.toContain('/api/')
  })
})
