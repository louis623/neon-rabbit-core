import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('reviewer smoke UI wiring', () => {
  const startForm = readFileSync(
    resolve(process.cwd(), 'app/start/StartSparkleSuiteForm.tsx'),
    'utf8',
  )
  const nicNacClient = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/_client.tsx'),
    'utf8',
  )
  const nicNacPage = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/page.tsx'),
    'utf8',
  )
  const loginPage = readFileSync(
    resolve(process.cwd(), 'app/login/page.tsx'),
    'utf8',
  )
  const requiredSetupHome = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.tsx'),
    'utf8',
  )
  const dashboardPlaceholder = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
    'utf8',
  )
  const chips = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/Chips.tsx'),
    'utf8',
  )
  const standard = readFileSync(
    resolve(process.cwd(), 'docs/sparkle-suite/testing/reviewer-smoke-standard.md'),
    'utf8',
  )
  const nicNacShellCss = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/_shell.module.css'),
    'utf8',
  )
  const nicNacPageCss = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/page.module.css'),
    'utf8',
  )
  const nicNacColumnCss = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/NicNacColumn.module.css'),
    'utf8',
  )
  const requiredSetupCss = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/RequiredSetupHome.module.css'),
    'utf8',
  )
  const dashboardCss = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.module.css'),
    'utf8',
  )

  it('adds reviewer controls to the start page without replacing normal signup', () => {
    expect(startForm).toContain('/api/reviewer-smoke/session')
    expect(startForm).toContain('reviewerSmokeVisible')
    expect(startForm).toContain('Start smoke checkout')
    expect(startForm).toContain('Open setup preview')
    expect(startForm).toContain('Open workspace preview')
    expect(startForm).toContain("startReviewerSmoke('required_setup')")
    expect(startForm).toContain("startReviewerSmoke('dashboard_unlocked')")
    expect(startForm).not.toContain('Review checkout recovery')
    expect(startForm).not.toContain('{reviewToken ? (')
    expect(startForm).toContain('/api/self-serve/signup')
  })

  it('opens checkout automatically instead of rendering a duplicate checkout page', () => {
    expect(nicNacClient).toContain('/api/stripe/create-checkout')
    expect(nicNacClient).toContain('void handleStartCheckout()')
    expect(nicNacClient).not.toContain('/api/reviewer-smoke/checkout')
    expect(nicNacClient).not.toContain('void handleSimulateReviewerCheckout()')
    expect(nicNacClient).not.toContain('CheckoutRequiredHome')
    expect(requiredSetupHome).not.toContain('Simulate paid checkout')
    expect(requiredSetupHome).not.toContain('Secure checkout')
  })

  it('captures reviewer smoke path as a standard process', () => {
    expect(standard).toContain('not ready for Louis review')
    expect(standard).toContain(
      'tests proving production review mode requires the explicit long review token',
    )
    expect(standard).toContain('no live charges')
  })

  it('exposes a reviewer-only reset on the required setup preview', () => {
    expect(nicNacClient).toContain('reviewerSmokeVisible')
    expect(nicNacClient).toContain('showReviewerSetupActions')
    expect(nicNacClient).toContain('state?.supportState?.reviewer_smoke')
    expect(nicNacClient).toContain('/api/reviewer-smoke/session')
    expect(nicNacClient).toContain('Reset setup preview')
    expect(requiredSetupHome).toContain('reviewerActions')
  })

  it('keeps the post-setup workspace visible in non-production review mode', () => {
    expect(nicNacPage).toContain('workspaceReviewAccessEnabled()')
    expect(nicNacClient).toContain('buildWorkspaceReviewFallbackState')
    expect(nicNacClient).toContain('review_workspace')
    expect(nicNacClient).toContain('Gracie Smoke')
    expect(nicNacClient).toContain('Gracie Test Studio 20260605001558')
    expect(nicNacClient).toContain('GS2-2335')
  })

  it('keeps public Sparkle Suite header and footer around setup and workspace', () => {
    expect(nicNacPage).toContain('SparkleSuitePublicHeader')
    expect(nicNacPage).toContain('SparkleSuitePublicFooter')
    expect(nicNacPage).toContain('sparkle-landing-v2')
    expect(nicNacPage).toContain('sl2-shell')
    expect(nicNacPage.indexOf('<SparkleSuitePublicHeader')).toBeLessThan(
      nicNacPage.indexOf('<NicNacClient'),
    )
    expect(nicNacPage.indexOf('<NicNacClient')).toBeLessThan(
      nicNacPage.indexOf('<SparkleSuitePublicFooter'),
    )
  })

  it('keeps public Sparkle Suite header and footer around login', () => {
    expect(loginPage).toContain('SparkleSuitePublicHeader')
    expect(loginPage).toContain('SparkleSuitePublicFooter')
    expect(loginPage).toContain('sparkle-landing-v2')
    expect(loginPage).toContain('sl2-shell')
    expect(loginPage.indexOf('<SparkleSuitePublicHeader')).toBeLessThan(
      loginPage.indexOf('<LoginClient'),
    )
    expect(loginPage.indexOf('<LoginClient')).toBeLessThan(
      loginPage.indexOf('<SparkleSuitePublicFooter'),
    )
  })

  it('keeps Nic-Nac page chrome from fighting the workspace layout', () => {
    expect(nicNacPage).toContain('styles.chrome')
    expect(nicNacPageCss).toContain('min-height: 0')
    expect(nicNacPageCss).toContain('overflow-x: clip')
    expect(nicNacPageCss).toContain('margin-top: 0')
    expect(nicNacShellCss).toContain('grid-template-columns: minmax(0, 1fr) var(--nic-nac-column-width)')
    expect(nicNacColumnCss).not.toMatch(/\.desktop\s*{[^}]*position:\s*fixed/s)
    expect(nicNacColumnCss).toMatch(/\.desktop\s*{[^}]*position:\s*sticky/s)
    expect(requiredSetupCss).not.toMatch(/\.root\s*{[^}]*height:\s*100dvh/s)
    expect(requiredSetupCss).toContain('var(--nic-nac-app-height')
    expect(dashboardCss).toContain('var(--nic-nac-app-height')
  })

  it('opens Nic-Nac with an empty starter chat in workspace review mode', () => {
    expect(nicNacClient).toContain('showWorkspaceReviewState')
    expect(nicNacClient).toContain('Workspace review mode starts fresh')
    expect(nicNacClient).toContain('messages: []')
  })

  it('offers a guided trade-board intake starter chip', () => {
    expect(chips).toContain('Add a piece to Trade Board')
    expect(chips.indexOf('Add a piece to Trade Board')).toBeLessThan(
      chips.indexOf("What's on my board?"),
    )
  })

  it('puts the trade request inbox before board inventory in the workspace card', () => {
    const componentStart = dashboardPlaceholder.indexOf(
      'export function TradeBoardWorkspaceCard',
    )
    const componentEnd = dashboardPlaceholder.indexOf(
      'function FulfillmentQueueCard',
      componentStart,
    )
    const componentSource = dashboardPlaceholder.slice(componentStart, componentEnd)

    expect(componentSource.indexOf('Request inbox')).toBeGreaterThan(-1)
    expect(componentSource.indexOf('Board Inventory')).toBeGreaterThan(-1)
    expect(componentSource.indexOf('Request inbox')).toBeLessThan(
      componentSource.indexOf('Board Inventory'),
    )
  })

  it('prompts for received-piece intake after dashboard fulfillment completion', () => {
    expect(dashboardPlaceholder).toContain(
      'addToBoard: nextStatus === \'completed\'',
    )
    expect(dashboardPlaceholder).toContain('Promise.allSettled')
    expect(dashboardPlaceholder).toContain(
      'Fulfillment updated, but part of the workspace did not refresh.',
    )
    expect(dashboardPlaceholder).toContain(
      'Add the received piece to your board when you are ready.',
    )
  })

  it('keeps summary metrics out of board inventory', () => {
    const componentStart = dashboardPlaceholder.indexOf(
      'export function TradeBoardWorkspaceCard',
    )
    const boardInventoryStart = dashboardPlaceholder.indexOf(
      'Board Inventory',
      componentStart,
    )
    const quickAddStart = dashboardPlaceholder.indexOf(
      'Quick add by item number',
      boardInventoryStart,
    )
    const boardInventorySource = dashboardPlaceholder.slice(
      boardInventoryStart,
      quickAddStart,
    )

    expect(boardInventorySource).not.toContain('Active pieces')
    expect(boardInventorySource).not.toContain('Board MSRP')
    expect(boardInventorySource).not.toContain('Top type')
    expect(boardInventorySource).not.toContain('Pending requests')
    expect(boardInventorySource).not.toContain('pendingRequestCount')
  })

  it('uses search and filters to browse board inventory without a default full grid', () => {
    const componentStart = dashboardPlaceholder.indexOf(
      'export function TradeBoardWorkspaceCard',
    )
    const componentEnd = dashboardPlaceholder.indexOf(
      'function FulfillmentQueueCard',
      componentStart,
    )
    const componentSource = dashboardPlaceholder.slice(componentStart, componentEnd)

    expect(componentSource).toContain(
      'Use search or filters to browse pieces currently on your board.',
    )
    expect(componentSource).toContain('No board pieces match this search.')
    expect(componentSource).toContain('Jewelry Type')
    expect(componentSource).toContain('Collection')
    expect(componentSource).toContain('Reset')
    expect(componentSource).toContain('getBoardInventoryResults')
    expect(componentSource).toContain('getCarouselWindow')
    expect(componentSource).toContain('useSyncExternalStore')
    expect(componentSource).toContain('inventoryCarouselPageSize')
    expect(componentSource).toContain('if (!hasMoreListings) return')
    expect(componentSource).not.toContain('carousel.startIndex - 3')
    expect(componentSource).not.toContain('carousel.startIndex + 3')
    expect(componentSource).not.toContain('No pieces on your board yet. Add your first item above.')
    expect(componentSource).not.toContain('No board listings match this search yet.')
  })

  it('keeps customer site previewing inside the workspace with Nic-Nac available', () => {
    expect(dashboardPlaceholder).toContain('type WorkspacePreviewState')
    expect(dashboardPlaceholder).toContain('handleOpenLiveSitePreview')
    expect(dashboardPlaceholder).toContain('handleOpenTradeBoardPreview')
    expect(dashboardPlaceholder).toContain('Back to workspace')
    expect(dashboardPlaceholder).toContain('Refresh preview')
    expect(dashboardPlaceholder).toContain('title="Sparkle Suite live site preview"')
    expect(dashboardPlaceholder).toContain('customerTradeBoardHref')
    expect(nicNacClient).toContain('<DashboardPlaceholder')
  })
})
