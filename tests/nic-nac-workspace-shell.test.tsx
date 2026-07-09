import { createElement } from 'react'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { DashboardPlaceholder } from '@/app/nic-nac/components/DashboardPlaceholder'

function escapeForRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function hasDeclaration(css: string, selector: string, declaration: string) {
  return new RegExp(
    `${escapeForRegex(selector)}\\s*\\{[\\s\\S]*?${escapeForRegex(
      declaration,
    )}\\s*;[\\s\\S]*?\\}`,
  ).test(css)
}

function hasNestedDeclaration(
  css: string,
  atRule: string,
  selector: string,
  declaration: string,
) {
  return new RegExp(
    `${escapeForRegex(atRule)}\\s*\\{[\\s\\S]*?${escapeForRegex(
      selector,
    )}[^{]*\\{[\\s\\S]*?${escapeForRegex(declaration)}\\s*;[\\s\\S]*?\\}[\\s\\S]*?\\}`,
  ).test(css)
}

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
    expect(
      hasDeclaration(
        css,
        '.shell',
        'height: calc(var(--nic-nac-app-height, 100vh) - 32px)',
      ),
    ).toBe(true)
    expect(hasDeclaration(css, '.shell', 'min-height: 0')).toBe(true)
    expect(hasDeclaration(css, '.content', 'min-height: 0')).toBe(true)
    expect(hasDeclaration(css, '.content', 'overflow-y: auto')).toBe(true)
    expect(hasDeclaration(dashboardCss, '.main', 'overflow: hidden')).toBe(true)
    expect(hasDeclaration(dashboardCss, '.conceptHome', 'overflow: hidden')).toBe(true)
    expect(hasDeclaration(dashboardCss, '.embeddedChat', 'overflow: hidden')).toBe(true)
  })

  it('keeps the workspace header as a Concept 1 app bar', () => {
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

    expect(source).toContain('function WorkspaceAppHeader')
    expect(source).toContain('aria-label="Go to Nic-Nac home"')
    expect(source).toContain('onClick={onGoHome}')
    expect(source).toContain('<form className={styles.appSearch} onSubmit={handleSubmit}>')
    expect(source).toContain('aria-label="Ask Nic-Nac anything"')
    expect(source).toContain('onFocus={onOpenNicNac}')
    expect(source).toContain('className={styles.appBrand}')
    expect(source).toContain('className={styles.appSearch}')
    expect(source).toContain('className={styles.appProfile}')
    expect(source).not.toContain('Secret Rep ID Number')
    expect(css).toContain('.appHeader')
    expect(css).toContain('.appBrand')
    expect(css).toContain('.appSearch')
    expect(css).toContain('.appSearchInput')
    expect(css).toContain('.appProfile')
    expect(
      hasDeclaration(
        css,
        '.appHeader',
        'grid-template-columns: minmax(180px, 0.8fr) minmax(280px, 1.35fr) minmax(220px, 0.9fr)',
      ),
    ).toBe(true)
    expect(css).toContain('border-radius: 24px;')
    expect(hasDeclaration(css, '.appSearch', 'border-radius: 18px')).toBe(true)
    expect(
      hasNestedDeclaration(css, '@media (max-width: 840px)', '.appSearch', 'display: none'),
    ).toBe(true)
    expect(
      hasNestedDeclaration(css, '@media (max-width: 840px)', '.appBrandSeal', 'width: 34px'),
    ).toBe(true)
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

  it('styles mobile workspace tabs like thumb-friendly app navigation buttons', () => {
    const css = readFileSync(
      resolve(
        process.cwd(),
        'app/nic-nac/components/WorkspaceSectionTabs.module.css',
      ),
      'utf8',
    )

    expect(css).toContain('@media (max-width: 840px)')
    expect(css).toContain('flex-direction: column;')
    expect(css).toContain('align-items: center;')
    expect(css).toContain('justify-content: center;')
    expect(css).toContain('min-width: 58px;')
    expect(css).toContain('min-height: 58px;')
    expect(css).toContain('border-radius: 18px;')
  })
})
