import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DashboardPlaceholder } from '@/app/nic-nac/components/DashboardPlaceholder'

describe('Nic-Nac workspace shell reset', () => {
  it('renders workspace sections inside a top tablist instead of a sidebar rail', () => {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Workspace sections"')
    expect(html).toContain('role="tab"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('>Trade Board<')
    expect(html).toContain('>Jewelry Library<')
    expect(html).toContain('>Calendar<')
    expect(html).not.toContain(
      'Manage the live workspace, customer site, trade tools, messages, and account settings.',
    )
    expect(html).not.toContain('class="workspaceSidebar"')
  })

  it('does not use the espresso gradient as the dominant shell surface', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/WorkspaceShell.module.css',
      ),
      'utf8',
    )

    expect(css).not.toContain('#402924 0%, #36221d 100%')
    expect(css).not.toMatch(/linear-gradient\(\s*145deg/i)
  })

  it('supports keyboard navigation across workspace tabs', () => {
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/WorkspaceSectionTabs.tsx'),
      'utf8',
    )

    expect(source).toContain("key !== 'ArrowLeft'")
    expect(source).toContain("key !== 'ArrowRight'")
    expect(source).toContain("key !== 'Home'")
    expect(source).toContain("key !== 'End'")
    expect(source).toContain('querySelectorAll<HTMLButtonElement>')
    expect(source).toContain('nextTab.focus()')
    expect(source).toContain('onSectionChange(nextKey)')
  })
})
