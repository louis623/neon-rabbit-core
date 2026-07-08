# Proper Shell Reset Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reset the Nic-Nac rep workspace shell into a genuinely mobile-first, app-like workspace with clear top navigation, quieter surfaces, and a much simpler Trade Board first screen without losing existing functionality.

**Architecture:** Keep `DashboardPlaceholder.tsx` as the state and data owner for now, but stop letting it define the visual shell. Finish the extraction that already started, remove sidebar-era layout assumptions from `WorkspaceShell`, untangle Trade Board presentation from `DashboardPlaceholder.module.css`, and rebuild the Trade Board as a task-ordered workspace surface that reads well on mobile first and still feels clean on desktop.

**Tech Stack:** Next.js 16 app router, React 19, CSS modules, Lucide icons, Vitest render/static tests, Vercel stable demo reviewer-smoke flow at `https://sparkle-suite-demo.vercel.app`.

---

## Current-State Snapshot

This plan assumes the current code state on July 7, 2026:

- `DashboardPlaceholder.tsx` already imports `WorkspaceShell`, `WorkspaceSectionTabs`, and `TradeBoardWorkspaceCard`.
- `WorkspaceShell.tsx` still renders a `workspaceSidebar` wrapper even though the intended direction is top navigation.
- `TradeBoardWorkspaceCard.tsx` is extracted, but it still imports `DashboardPlaceholder.module.css` as `shellStyles`, which keeps it visually and structurally coupled to the old dashboard shell.
- The Trade Board surface is functionally better than the old inline block, but it still feels like a trimmed admin surface rather than a polished app workspace.
- The user wants a **proper shell reset**, not another round of styling on top of the old dashboard frame.

That means the next implementation should be treated as a shell architecture cleanup plus a surface redesign, not as a one-off CSS tweak.

## Scope Check

This plan is intentionally one subsystem: **rep workspace shell reset**.

It includes:
- shell/navigation reset
- shared workspace surface primitives
- Trade Board first-surface simplification
- mobile-first ergonomics
- reviewer-smoke verification

It does **not** include:
- Nic-Nac Trade Board backend/tool-contract work
- Calendar logic changes
- public customer Trade Board redesign
- Chrome extension or live queue extension work
- schema changes

## File Structure

### Existing files to modify

- `app/nic-nac/components/DashboardPlaceholder.tsx`
  - Keep as workspace state/controller owner.
  - Continue to own section routing, access gating, fetch state, preview handlers, and action callbacks.
  - Stop owning shell-style assumptions for extracted surfaces.
- `app/nic-nac/components/DashboardPlaceholder.module.css`
  - Remove styles that only exist because the old workspace shell and Trade Board lived inline here.
  - Keep only styles still legitimately owned by `DashboardPlaceholder`.
- `app/nic-nac/components/WorkspaceShell.tsx`
  - Rewrite from sidebar wrapper semantics into a single-column shell with header, tabs, optional notice, and content.
- `app/nic-nac/components/WorkspaceShell.module.css`
  - Replace leftover sidebar framing with a quiet, light shell.
- `app/nic-nac/components/WorkspaceSectionTabs.tsx`
  - Keep the ARIA/keyboard contract.
  - Tighten it around app-style top navigation rather than dashboard nav copy.
- `app/nic-nac/components/WorkspaceSectionTabs.module.css`
  - Restyle the control as a horizontally scrollable rounded mobile tab bar that still wraps cleanly on desktop.
- `app/nic-nac/components/TradeBoardWorkspaceCard.tsx`
  - Keep all current behaviors and handlers.
  - Stop importing `DashboardPlaceholder.module.css`.
  - Rebuild the content hierarchy so the first viewport is task-first.
- `app/nic-nac/components/TradeBoardWorkspaceCard.module.css`
  - Rework the card into lighter surfaces with better spacing and mobile-first queue treatment.
- `tests/nic-nac-dashboard-placeholder.test.ts`
  - Keep broad behavior regressions.
  - Remove stale shell expectations that belong in focused shell tests.
- `tests/nic-nac-workspace-shell.test.tsx`
  - Focused shell/navigation render and CSS contract test.
- `tests/nic-nac-trade-board-surface.test.tsx`
  - Focused Trade Board hierarchy and simplified-surface regression test.
- `tests/reviewer-smoke-ui.test.ts`
  - Update only if the reviewer-smoke entry copy or shell assertions need it.

### New files to create

- `app/nic-nac/components/WorkspaceSurface.module.css`
  - Shared shell/surface primitives used by extracted workspace components.
  - Own buttons, helper text, tags, inputs, empty states, loading lines, modal frame primitives, and neutral card surfaces now borrowed from `DashboardPlaceholder.module.css`.
- `docs/sparkle-suite/testing/proper-shell-reset-reviewer-smoke.md`
  - Stable-demo reviewer-smoke instructions for this shell reset.

### Optional split only if the file remains too large after Task 4

- `app/nic-nac/components/TradeBoardQueueSections.tsx`
  - Create only if request inbox, cleanup, and fulfillment markup still makes `TradeBoardWorkspaceCard.tsx` too large after the reset.
  - Do not split early if the existing file stays readable.

## Product Direction

- The workspace should feel like a **professional mobile app**, not a dashboard squeezed onto a phone.
- The top navigation should be the first orientation anchor.
- Espresso can remain a brand accent, but not the dominant working surface.
- The Trade Board first screen should answer, in order:
  1. What needs attention now?
  2. What is the fastest action I can take?
  3. Where do I browse or filter when I need to?
- We are simplifying the presentation layer, not removing capability.

---

### Task 1: Freeze the New Shell Contract in Tests

**Files:**
- Modify: `tests/nic-nac-dashboard-placeholder.test.ts`
- Modify: `tests/nic-nac-workspace-shell.test.tsx`
- Modify: `tests/nic-nac-trade-board-surface.test.tsx`

- [ ] **Step 1: Add a failing shell contract for top-nav behavior**

```tsx
it('renders workspace sections as top app tabs instead of a sidebar rail', () => {
  const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

  expect(html).toContain('role="tablist"')
  expect(html).toContain('aria-label="Workspace sections"')
  expect(html).toContain('>Trade Board<')
  expect(html).toContain('>Jewelry Library<')
  expect(html).toContain('>Calendar<')
  expect(html).not.toContain(
    'Manage the live workspace, customer site, trade tools, messages, and account settings.',
  )
  expect(html).not.toContain('workspaceSidebar')
})
```

- [ ] **Step 2: Add a failing Trade Board first-screen hierarchy test**

```tsx
it('puts today, quick add, and browse ahead of queue detail sections', () => {
  const html = renderToStaticMarkup(createElement(DashboardPlaceholder))

  expect(html.indexOf('Today&#x27;s trade work')).toBeGreaterThan(-1)
  expect(html.indexOf('Quick add')).toBeGreaterThan(-1)
  expect(html.indexOf('Browse board')).toBeGreaterThan(-1)
  expect(html.indexOf('Today&#x27;s trade work')).toBeLessThan(
    html.indexOf('Quick add'),
  )
  expect(html.indexOf('Quick add')).toBeLessThan(html.indexOf('Browse board'))
})
```

- [ ] **Step 3: Keep broad behavior assertions in the legacy placeholder test**

```tsx
expect(html).toContain('View customer board')
expect(html).toContain('Pending requests')
expect(html).toContain('Cleanup follow-ups')
expect(html).toContain('Fulfillment swaps')
expect(html).not.toContain('Trade history')
```

- [ ] **Step 4: Add a CSS contract against the old espresso-heavy shell treatment**

```tsx
it('does not use the espresso gradient as the dominant shell surface', () => {
  const css = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/WorkspaceShell.module.css'),
    'utf8',
  )

  expect(css).not.toContain('linear-gradient(145deg, #402924 0%, #36221d 100%)')
})
```

- [ ] **Step 5: Run the focused tests and confirm they fail for the right reasons**

Run: `npm exec vitest run tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-trade-board-surface.test.tsx`

Expected: FAIL only on the new shell reset expectations, with no unrelated suite explosion.

- [ ] **Step 6: Commit**

```bash
git add tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-trade-board-surface.test.tsx
git commit -m "test: lock proper shell reset expectations"
```

### Task 2: Replace Sidebar-Era Shell Structure With a Real Top Shell

**Files:**
- Modify: `app/nic-nac/components/WorkspaceShell.tsx`
- Modify: `app/nic-nac/components/WorkspaceShell.module.css`
- Modify: `app/nic-nac/components/WorkspaceSectionTabs.tsx`
- Modify: `app/nic-nac/components/WorkspaceSectionTabs.module.css`
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Test: `tests/nic-nac-workspace-shell.test.tsx`

- [ ] **Step 1: Rewrite `WorkspaceShell.tsx` so it no longer uses `workspaceSidebar` semantics**

```tsx
export function WorkspaceShell<TKey extends string>({
  tabs,
  activeSection,
  onSectionChange,
  header,
  notice,
  children,
}: {
  tabs: readonly WorkspaceSectionTab<TKey>[]
  activeSection: TKey
  onSectionChange: (section: TKey) => void
  header?: ReactNode
  notice?: ReactNode
  children: ReactNode
}) {
  return (
    <div className={styles.shell}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <div className={styles.tabsWrap}>
        <WorkspaceSectionTabs
          tabs={tabs}
          activeSection={activeSection}
          onSectionChange={onSectionChange}
        />
      </div>
      <section className={styles.content}>
        {notice}
        {children}
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Make `DashboardPlaceholder.tsx` pass clean shell props only**

```tsx
return (
  <WorkspaceShell
    tabs={visibleWorkspaceSections}
    activeSection={activeSection}
    onSectionChange={(section) =>
      setActiveSection(
        resolveWorkspaceSectionForAccess(
          section,
          hasPaidWorkspace,
          hasRecipeWorkspaceAccess,
        ),
      )
    }
    header={workspaceHeader}
    notice={showWorkspaceAccessNotice ? accessNotice : null}
  >
    {renderedSection}
  </WorkspaceShell>
)
```

- [ ] **Step 3: Keep the tab component semantic and keyboard-friendly**

```tsx
<nav className={styles.tabs} role="tablist" aria-label="Workspace sections">
  {tabs.map((tab) => {
    const active = activeSection === tab.key
    return (
      <button
        key={tab.key}
        type="button"
        role="tab"
        aria-selected={active}
        tabIndex={active ? 0 : -1}
        data-section-key={tab.key}
        className={active ? styles.tabActive : styles.tab}
        onClick={() => !tab.comingSoon && onSectionChange(tab.key)}
        onKeyDown={handleKeyDown}
      >
        <Icon className={styles.icon} aria-hidden="true" />
        <span className={styles.labelFull}>{tab.label}</span>
        <span className={styles.labelShort}>{tab.shortLabel}</span>
      </button>
    )
  })}
</nav>
```

- [ ] **Step 4: Update shell CSS to a single-column mobile-first frame**

```css
.shell {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tabsWrap {
  position: sticky;
  top: 8px;
  z-index: 12;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
```

- [ ] **Step 5: Run shell-focused tests**

Run: `npm exec vitest run tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-dashboard-placeholder.test.ts`

Expected:

```text
PASS  tests/nic-nac-workspace-shell.test.tsx
PASS  tests/nic-nac-dashboard-placeholder.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/nic-nac/components/WorkspaceShell.tsx app/nic-nac/components/WorkspaceShell.module.css app/nic-nac/components/WorkspaceSectionTabs.tsx app/nic-nac/components/WorkspaceSectionTabs.module.css app/nic-nac/components/DashboardPlaceholder.tsx
git commit -m "feat: finish proper workspace shell structure"
```

### Task 3: Untangle Shared Workspace Surface Primitives From `DashboardPlaceholder`

**Files:**
- Create: `app/nic-nac/components/WorkspaceSurface.module.css`
- Modify: `app/nic-nac/components/TradeBoardWorkspaceCard.tsx`
- Modify: `app/nic-nac/components/DashboardPlaceholder.module.css`
- Test: `tests/nic-nac-trade-board-surface.test.tsx`

- [ ] **Step 1: Create a shared surface-primitives module for extracted workspace sections**

```css
.sectionTitle {
  font-size: 0.98rem;
  font-weight: 700;
  color: #2f211d;
}

.sectionHint {
  font-size: 0.88rem;
  color: rgba(47, 33, 29, 0.68);
}

.actionButton,
.helperButton,
.searchInput,
.tag,
.emptyState,
.loadingLine,
.loadingLineShort {
  /* shared primitives */
}
```

- [ ] **Step 2: Replace `shellStyles` imports in `TradeBoardWorkspaceCard.tsx`**

```tsx
import surfaceStyles from './WorkspaceSurface.module.css'
import styles from './TradeBoardWorkspaceCard.module.css'
```

```tsx
<div className={surfaceStyles.sectionTitle}>Trade Board</div>
<div className={surfaceStyles.sectionHint}>
  Track active pieces, requests, and fulfillment from one place.
</div>
```

- [ ] **Step 3: Remove now-orphaned Trade Board presentation rules from `DashboardPlaceholder.module.css`**

```css
/* delete or move rules that only existed for extracted Trade Board UI */
.boardInventoryCarousel { /* moved */ }
.tradePieceImage { /* moved */ }
.helperButton { /* moved if now shared */ }
```

- [ ] **Step 4: Add a regression test proving the extracted card no longer depends on `DashboardPlaceholder.module.css`**

```tsx
it('uses shared workspace primitives instead of DashboardPlaceholder shell styles', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/TradeBoardWorkspaceCard.tsx'),
    'utf8',
  )

  expect(source).toContain("import surfaceStyles from './WorkspaceSurface.module.css'")
  expect(source).not.toContain("from './DashboardPlaceholder.module.css'")
})
```

- [ ] **Step 5: Run focused tests**

Run: `npm exec vitest run tests/nic-nac-trade-board-surface.test.tsx tests/nic-nac-dashboard-placeholder.test.ts`

Expected:

```text
PASS  tests/nic-nac-trade-board-surface.test.tsx
PASS  tests/nic-nac-dashboard-placeholder.test.ts
```

- [ ] **Step 6: Commit**

```bash
git add app/nic-nac/components/WorkspaceSurface.module.css app/nic-nac/components/TradeBoardWorkspaceCard.tsx app/nic-nac/components/DashboardPlaceholder.module.css tests/nic-nac-trade-board-surface.test.tsx
git commit -m "refactor: add shared workspace surface primitives"
```

### Task 4: Rebuild the Top Navigation Visual Language

**Files:**
- Modify: `app/nic-nac/components/WorkspaceSectionTabs.module.css`
- Modify: `app/nic-nac/components/WorkspaceShell.module.css`
- Modify: `tests/nic-nac-workspace-shell.test.tsx`

- [ ] **Step 1: Style the tabs like an app control instead of dashboard chips**

```css
.tabs {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 6px 2px 4px;
  scrollbar-width: none;
}

.tab,
.tabActive {
  flex: 0 0 auto;
  min-height: 44px;
  border-radius: 999px;
  padding: 10px 14px;
  border: 1px solid rgba(64, 41, 36, 0.10);
}

.tabActive {
  background: #ffffff;
  border-color: rgba(238, 44, 155, 0.26);
  box-shadow: 0 8px 18px rgba(43, 31, 27, 0.08);
}
```

- [ ] **Step 2: Keep desktop clean without reverting to a left rail**

```css
@media (min-width: 960px) {
  .tabs {
    flex-wrap: wrap;
    overflow: visible;
  }
}
```

- [ ] **Step 3: Keep the shell light and restrained**

```css
.tabsWrap {
  padding: 10px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(64, 41, 36, 0.10);
  box-shadow: 0 10px 28px rgba(43, 31, 27, 0.08);
}
```

- [ ] **Step 4: Add focused CSS assertions for the new nav treatment**

```tsx
expect(css).toContain('border-radius: 999px;')
expect(css).toContain('min-height: 44px;')
expect(css).toContain('overflow-x: auto;')
```

- [ ] **Step 5: Run shell-focused tests**

Run: `npm exec vitest run tests/nic-nac-workspace-shell.test.tsx`

Expected: `PASS  tests/nic-nac-workspace-shell.test.tsx`

- [ ] **Step 6: Commit**

```bash
git add app/nic-nac/components/WorkspaceSectionTabs.module.css app/nic-nac/components/WorkspaceShell.module.css tests/nic-nac-workspace-shell.test.tsx
git commit -m "style: rebuild workspace top navigation"
```

### Task 5: Rebuild the Trade Board First Screen Around the Actual Job

**Files:**
- Modify: `app/nic-nac/components/TradeBoardWorkspaceCard.tsx`
- Modify: `app/nic-nac/components/TradeBoardWorkspaceCard.module.css`
- Modify: `tests/nic-nac-trade-board-surface.test.tsx`
- Modify: `tests/nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Keep the existing data and handlers but reorganize the render order**

```tsx
return (
  <div className={styles.stack}>
    <section className={styles.hero}>{/* section title + customer board link */}</section>
    <section className={styles.summary}>{/* today's trade work */}</section>
    <section className={styles.quickAdd}>{/* quick add by item number */}</section>
    <section className={styles.browser}>{/* search, filters, browse results */}</section>
    <section className={styles.queue}>{/* request inbox */}</section>
    <section className={styles.queue}>{/* swap cleanup */}</section>
    <section className={styles.queue}>{/* fulfillment */}</section>
  </div>
)
```

- [ ] **Step 2: Put filters behind lighter progressive disclosure**

```tsx
<details
  className={styles.filterDisclosure}
  open={isFilterDisclosureOpen}
  onToggle={(event) => setIsFilterDisclosureOpen(event.currentTarget.open)}
>
  <summary className={styles.filterSummary}>Filters</summary>
  <div className={styles.filterGrid}>
    {/* existing jewelry type + collection selects */}
  </div>
</details>
```

- [ ] **Step 3: Convert spreadsheet-like blocks into cleaner utility sections**

```css
.summary,
.quickAdd,
.browser,
.queue {
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(64, 41, 36, 0.10);
  box-shadow: 0 8px 24px rgba(43, 31, 27, 0.06);
  padding: 16px;
}
```

- [ ] **Step 4: Make the empty states read like actions, not placeholders**

```tsx
<div className={surfaceStyles.emptyState}>
  Search the board or open Filters to find a live piece.
</div>
```

```tsx
<div className={surfaceStyles.emptyState}>
  You are caught up. New requests or swaps will appear here.
</div>
```

- [ ] **Step 5: Preserve every existing mutation handler exactly**

```tsx
onQuickAddListing()
onRemoveListing(listing.id)
onApproveRequest(request.id, swap)
onRejectRequest(request.id)
onAdvanceFulfillment(item.requestId, nextStatus)
```

- [ ] **Step 6: Run focused Trade Board tests**

Run: `npm exec vitest run tests/nic-nac-trade-board-surface.test.tsx tests/nic-nac-dashboard-placeholder.test.ts`

Expected:

```text
PASS  tests/nic-nac-trade-board-surface.test.tsx
PASS  tests/nic-nac-dashboard-placeholder.test.ts
```

- [ ] **Step 7: Commit**

```bash
git add app/nic-nac/components/TradeBoardWorkspaceCard.tsx app/nic-nac/components/TradeBoardWorkspaceCard.module.css tests/nic-nac-trade-board-surface.test.tsx tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "feat: rebuild trade board first surface"
```

### Task 6: Make Mobile the Default, Not the Desktop Shrink

**Files:**
- Modify: `app/nic-nac/components/TradeBoardWorkspaceCard.module.css`
- Modify: `app/nic-nac/components/WorkspaceSectionTabs.module.css`
- Modify: `app/nic-nac/components/WorkspaceShell.module.css`
- Test: `tests/nic-nac-workspace-shell.test.tsx`
- Test: `tests/nic-nac-trade-board-surface.test.tsx`

- [ ] **Step 1: Lock tap targets and spacing at small widths**

```css
@media (max-width: 720px) {
  .stack {
    gap: 12px;
  }

  .summaryStats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .tab,
  .tabActive,
  .primaryButton,
  .queueActionButton {
    min-height: 44px;
  }
}
```

- [ ] **Step 2: Keep the nav compact with short labels on mobile**

```css
.labelFull {
  display: none;
}

.labelShort {
  display: inline;
  white-space: nowrap;
}

@media (min-width: 840px) {
  .labelFull {
    display: inline;
  }

  .labelShort {
    display: none;
  }
}
```

- [ ] **Step 3: Avoid accidental desktop regression**

```css
@media (min-width: 960px) {
  .stack {
    gap: 14px;
  }

  .summaryStats {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

- [ ] **Step 4: Run focused mobile-facing tests**

Run: `npm exec vitest run tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-trade-board-surface.test.tsx`

Expected:

```text
PASS  tests/nic-nac-workspace-shell.test.tsx
PASS  tests/nic-nac-trade-board-surface.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add app/nic-nac/components/TradeBoardWorkspaceCard.module.css app/nic-nac/components/WorkspaceSectionTabs.module.css app/nic-nac/components/WorkspaceShell.module.css tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-trade-board-surface.test.tsx
git commit -m "style: optimize proper shell reset for mobile"
```

### Task 7: Verify, Deploy, and Leave a Reviewer-Smoke Trail

**Files:**
- Create: `docs/sparkle-suite/testing/proper-shell-reset-reviewer-smoke.md`
- Modify: `tests/reviewer-smoke-ui.test.ts` (only if reviewer entry copy or path assertions need adjustment)

- [ ] **Step 1: Document the exact stable-demo review path**

```md
1. Open https://sparkle-suite-demo.vercel.app/start
2. Use Reviewer smoke mode
3. Open the workspace preview
4. Verify top section tabs appear above the content
5. Verify Trade Board opens as a light task-first stack
6. Verify the first screen shows today's work, quick add, and browse in that order
7. Verify quick add, search, filters, request actions, cleanup, and fulfillment still work
```

- [ ] **Step 2: Run local verification**

Run: `npm exec vitest run tests/nic-nac-workspace-shell.test.tsx tests/nic-nac-trade-board-surface.test.tsx tests/nic-nac-dashboard-placeholder.test.ts tests/reviewer-smoke-ui.test.ts`

Expected: all targeted tests pass.

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: Next.js production build completes successfully.

- [ ] **Step 4: Deploy preview and move the stable demo alias**

Run:

```bash
npx vercel --yes
npx vercel alias set <preview-url> sparkle-suite-demo.vercel.app
curl.exe -L https://sparkle-suite-demo.vercel.app/api/nic-nac/health --max-time 30
```

Expected:

```text
Stable demo alias points to the intended deployment
Nic-Nac health reports api_reachable=true and db_reachable=true
```

- [ ] **Step 5: Perform reviewer-smoke verification using repo guidance**

Required target: `https://sparkle-suite-demo.vercel.app`

Required session type: reviewer-smoke synthetic workspace session only

Checklist:

```text
- top nav feels like app navigation, not a moved sidebar
- the shell reads clearly at roughly 390px width
- the Trade Board no longer feels like a spreadsheet
- espresso is an accent, not the dominant work surface
- quick add is still the main visible action
- filters stay available without taking over the screen
```

- [ ] **Step 6: Commit docs**

```bash
git add docs/sparkle-suite/testing/proper-shell-reset-reviewer-smoke.md tests/reviewer-smoke-ui.test.ts
git commit -m "docs: add proper shell reset reviewer smoke"
```

---

## Acceptance Criteria

- The main rep workspace no longer uses a dedicated left-hand rail as its primary navigation pattern.
- Workspace section navigation appears as top app-style tabs.
- On mobile, the tabs are rounded, horizontally scrollable, short-labeled, and easy to tap.
- `WorkspaceShell.tsx` no longer contains sidebar-era layout semantics.
- `TradeBoardWorkspaceCard.tsx` no longer imports `DashboardPlaceholder.module.css`.
- The main shell uses light readable work surfaces; espresso is limited to accent use.
- The Trade Board first viewport clearly communicates status, next action, and browse entry point.
- Quick add remains intact and visually prioritized.
- Search and filters remain intact.
- Request inbox, swap cleanup, and fulfillment remain available and functional.
- No existing Trade Board mutation handlers or API calls are removed.
- Focused tests pass.
- Production build passes.
- Stable demo alias is updated and healthy.
- Reviewer-smoke verification is completed on `https://sparkle-suite-demo.vercel.app`.

## Risks

- `DashboardPlaceholder.tsx` is still large, so extraction discipline matters.
- Leaving shared button/input/tag primitives inside `DashboardPlaceholder.module.css` will keep future workspace sections coupled to the old dashboard shell.
- If the navigation is only restyled and not structurally simplified, the result will still feel like a moved sidebar.
- If the Trade Board keeps too many always-visible controls in the first viewport, it will still read like a spreadsheet on mobile.

## Rollout Order

1. Freeze the intended shell contract in tests.
2. Replace sidebar-era shell structure.
3. Extract shared workspace surface primitives.
4. Rebuild top navigation styling.
5. Rebuild the Trade Board first screen.
6. Tighten mobile ergonomics.
7. Run targeted tests and build.
8. Deploy and run stable-demo reviewer smoke.

## Self-Review

### Spec coverage

- Proper shell reset instead of another styling pass: Tasks 2 and 3.
- Real mobile-first top navigation: Tasks 2, 4, and 6.
- Trade Board simplification without functional loss: Task 5.
- Stable demo and reviewer-smoke verification: Task 7.

### Placeholder scan

- No `TODO`, `TBD`, or “implement later” placeholders remain.
- Each task lists exact files, concrete snippets, and exact commands.

### Type consistency

- `DashboardPlaceholder.tsx` remains the state owner.
- `WorkspaceShell.tsx` remains the shell frame.
- `TradeBoardWorkspaceCard.tsx` remains presentation-focused and keeps existing handlers.
- `WorkspaceSurface.module.css` is the shared primitive layer for extracted workspace sections.

---

**Plan complete and saved to `docs/superpowers/plans/2026-07-07-proper-shell-reset.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
