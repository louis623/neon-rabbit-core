import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DashboardPlaceholder } from '@/app/nic-nac/components/DashboardPlaceholder'

describe('Nic-Nac workspace shell reset', () => {
  it('renders workspace sections inside a top tablist instead of a sidebar rail', () => {
    const html = renderToStaticMarkup(createElement(DashboardPlaceholder))
    const source = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/WorkspaceShell.tsx'),
      'utf8',
    )
    const css = readFileSync(
      resolve(process.cwd(), 'app/nic-nac/components/WorkspaceShell.module.css'),
      'utf8',
    )
    const dashboardCss = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Workspace sections"')
    expect(html).toContain('role="tab"')
    expect(html).toContain('aria-selected="true"')
    expect(html).toContain('role="tabpanel"')
    expect(html).toContain('>Trade Board<')
    expect(html).toContain('>Jewelry Library<')
    expect(html).toContain('>Calendar<')
    expect(html).not.toContain(
      'Manage the live workspace, customer site, trade tools, messages, and account settings.',
    )
    expect(source).not.toContain('workspaceSidebar')
    expect(css).not.toContain('.workspaceSidebar')
    expect(dashboardCss).not.toContain('.workspaceShell')
    expect(dashboardCss).not.toContain('.workspaceSidebar')
    expect(dashboardCss).not.toContain('.workspaceSidebarTitle')
    expect(dashboardCss).not.toContain('.workspaceSidebarIntro')
    expect(dashboardCss).not.toContain('.workspaceNavButton')
    expect(dashboardCss).not.toContain('.workspaceNavButtonActive')
    expect(dashboardCss).not.toContain('.workspaceNavButtonComingSoon')
    expect(source).toContain('className={styles.shell}')
    expect(source).toContain('className={styles.tabsWrap}')
    expect(source).toContain('className={styles.content}')
    expect(source).toContain('role="tabpanel"')
    expect(source).toContain('aria-labelledby={activeTabId}')
  })

  it('keeps the workspace header as a compact app bar with grouped brand and meta rows', () => {
    const source = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.tsx',
      ),
      'utf8',
    )
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/DashboardPlaceholder.module.css',
      ),
      'utf8',
    )

    expect(source).toContain('className={styles.topbarBrandRow}')
    expect(source).toContain('className={styles.topbarMetaRow}')
    expect(source).toContain('className={styles.topbarMetaAction}')
    expect(css).toContain('.topbarBrandRow')
    expect(css).toContain('.topbarMetaRow')
    expect(css).toContain('.topbarMetaAction')
    expect(css).toContain('grid-template-columns: repeat(2, minmax(0, 1fr));')
    expect(css).toContain('border-radius: 24px;')
  })

  it('does not use the espresso gradient as the dominant shell surface', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/WorkspaceShell.module.css',
      ),
      'utf8',
    )

    expect(css).not.toMatch(
      /linear-gradient\(\s*145deg,\s*#402924 0%,\s*#36221d 100%\s*\)/i,
    )
    expect(css).toMatch(/background:\s*rgba\(255,\s*255,\s*255,\s*0\.\d+\);/)
    expect(css).toContain('backdrop-filter: blur(')
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
    expect(source).toContain('role="tab"')
    expect(source).toContain('id={getWorkspaceSectionTabId(tab.key)}')
    expect(source).toContain('aria-controls={getWorkspaceSectionPanelId(tab.key)}')
    expect(source).toContain('aria-selected={active}')
    expect(source).toContain('tab.shortLabel')
  })
})
