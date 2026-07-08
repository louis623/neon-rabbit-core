# Nic-Nac First Responsive Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the Sparkle Suite rep workspace around the approved Concept 1 direction so Nic-Nac becomes the primary home surface, mobile quick actions launch directly into guided Nic-Nac chat flows, and the shell expands gracefully from phone to tablet and desktop without losing any existing Trade Board, Calendar, Library, Site, Help, or Account functionality.

**Architecture:** Keep one responsive product surface instead of separate mobile and desktop apps. Introduce a new Nic-Nac-first `home` workspace section with compact real-data glance modules, then collapse the existing wide section list into major navigation (`Home`, `Trade`, `Calendar`, `Library`, `More`) while preserving secondary tools behind `More`. Reuse the existing workflow/tool architecture and reviewer-smoke routes; only the shell, navigation, launch behavior, and presentation layer change.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, CSS modules, existing Nic-Nac chat/runtime, Vitest, reviewer-smoke harness.

---

## File Structure

### Existing files to modify

- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\_client.tsx`
  - Owns desktop/mobile shell state, chat mounting, and mobile open/close behavior.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Owns workspace section definitions, section rendering, and trade/calendar/library/site/help/account data loading.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\TradeBoardWorkspaceCard.tsx`
  - Will be simplified to fit the new quieter section presentation.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
  - Needs a way to accept launch prompts and immediately start guided flows.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHeader.tsx`
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHeader.module.css`
  - Keep only the compact Nic-Nac header treatment; no oversized wasted mark.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceShell.tsx`
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceSectionTabs.tsx`
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceSectionTabs.module.css`
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacMobileShell.tsx`
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\_shell.module.css`
  - Own the responsive shell and navigation behavior.
- `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`
- `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

### New files to create

- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHomeWorkspaceCard.tsx`
  - New assistant-first home surface for Concept 1.
- `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHomeWorkspaceCard.module.css`
  - Styling for the home surface.
- `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\workspace-launch-actions.ts`
  - Pure helper for launchable Nic-Nac actions from quick buttons and floating entry points.
- `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-workspace-launch-actions.test.ts`
  - Unit tests for launch action normalization and prompt mapping.

### Design constraints to preserve during implementation

- Keep all existing real workflows and tool-backed capabilities intact.
- Do not make `Messages` a primary nav item.
- Keep `Team Management` and `Recipes` secondary, not removed.
- Keep mobile floating `N` behavior available when chat is not the active surface.
- Quick actions like `Add a piece` and `Add a show` should open Nic-Nac and start the workflow automatically.

---

### Task 1: Lock the new workspace information architecture

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\workspace-launch-actions.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-workspace-launch-actions.test.ts`

- [ ] **Step 1: Write the failing launch-action tests**

```ts
import { describe, expect, it } from 'vitest'
import {
  WORKSPACE_PRIMARY_SECTIONS,
  getLaunchPromptForWorkspaceAction,
  getPrimaryWorkspaceSections,
} from '@/lib/nic-nac/workspace-launch-actions'

describe('workspace launch actions', () => {
  it('returns the concept-1 primary nav set', () => {
    expect(getPrimaryWorkspaceSections()).toEqual([
      'home',
      'trade-board',
      'show-calendar',
      'jewelry-library',
      'more',
    ])
  })

  it('maps quick actions to Nic-Nac starter prompts', () => {
    expect(getLaunchPromptForWorkspaceAction('add_trade_piece')).toBe(
      'Add a piece to Trade Board',
    )
    expect(getLaunchPromptForWorkspaceAction('add_calendar_show')).toBe(
      'Add a Show to the Calendar',
    )
    expect(getLaunchPromptForWorkspaceAction('check_board')).toBe(
      "What's on my Trade Board right now?",
    )
  })
})
```

- [ ] **Step 2: Run the new test to verify it fails**

Run: `npm exec vitest run tests/nic-nac-workspace-launch-actions.test.ts`

Expected: FAIL because `workspace-launch-actions.ts` does not exist yet.

- [ ] **Step 3: Add the minimal helper module**

```ts
export const WORKSPACE_PRIMARY_SECTIONS = [
  'home',
  'trade-board',
  'show-calendar',
  'jewelry-library',
  'more',
] as const

export type WorkspacePrimarySection = (typeof WORKSPACE_PRIMARY_SECTIONS)[number]

export type WorkspaceLaunchAction =
  | 'add_trade_piece'
  | 'add_calendar_show'
  | 'check_board'
  | 'open_site_preview'

const LAUNCH_PROMPTS: Record<WorkspaceLaunchAction, string | null> = {
  add_trade_piece: 'Add a piece to Trade Board',
  add_calendar_show: 'Add a Show to the Calendar',
  check_board: "What's on my Trade Board right now?",
  open_site_preview: null,
}

export function getPrimaryWorkspaceSections(): WorkspacePrimarySection[] {
  return [...WORKSPACE_PRIMARY_SECTIONS]
}

export function getLaunchPromptForWorkspaceAction(
  action: WorkspaceLaunchAction,
): string | null {
  return LAUNCH_PROMPTS[action]
}
```

- [ ] **Step 4: Update the workspace section model in `DashboardPlaceholder.tsx`**

```ts
const WORKSPACE_SECTIONS = [
  { key: 'home', label: 'Nic-Nac', shortLabel: 'Home', icon: Sparkles },
  { key: 'trade-board', label: 'Trade Board', shortLabel: 'Trade', icon: Gem },
  { key: 'show-calendar', label: 'Calendar', shortLabel: 'Calendar', icon: CalendarDays },
  { key: 'jewelry-library', label: 'Jewelry Library', shortLabel: 'Library', icon: Search },
  { key: 'more', label: 'More', shortLabel: 'More', icon: Settings2 },
] as const
```

```ts
const SECONDARY_WORKSPACE_SECTIONS: WorkspaceSectionKey[] = [
  'business-tools',
  'team-management',
  'site-settings',
  'recipes',
  'help-resources',
  'account',
]
```

- [ ] **Step 5: Run the targeted tests**

Run: `npm exec vitest run tests/nic-nac-workspace-launch-actions.test.ts tests/nic-nac-dashboard-placeholder.test.ts`

Expected: PASS for the new helper test, with `DashboardPlaceholder` failures exposing the next rendering changes needed.

- [ ] **Step 6: Commit the IA helper groundwork**

```bash
git add app/nic-nac/components/DashboardPlaceholder.tsx lib/nic-nac/workspace-launch-actions.ts tests/nic-nac-workspace-launch-actions.test.ts
git commit -m "feat: define Nic-Nac-first workspace IA"
```

---

### Task 2: Build the new assistant-first home surface

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHomeWorkspaceCard.tsx`
- Create: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHomeWorkspaceCard.module.css`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Write the failing home-surface assertions**

```ts
it('renders a Nic-Nac-first home section with quick actions and today counts', () => {
  const html = renderToStaticMarkup(
    createElement(DashboardPlaceholder, {
      reviewWorkspaceMode: true,
      initialSectionOverride: 'home',
    }),
  )

  expect(html).toContain('Nic-Nac')
  expect(html).toContain('Add a piece')
  expect(html).toContain('Check my board')
  expect(html).toContain('Add a show')
  expect(html).toContain("Today's trade work")
})
```

- [ ] **Step 2: Run the focused dashboard test**

Run: `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts`

Expected: FAIL because the `home` section and home card do not exist yet.

- [ ] **Step 3: Create the new home card component**

```tsx
export function NicNacHomeWorkspaceCard({
  tradeRequestsCount,
  cleanupCount,
  fulfillmentCount,
  nextShowLabel,
  onLaunchAction,
  onOpenTradeBoard,
  onOpenCalendar,
  onOpenCustomerBoardPreview,
}: {
  tradeRequestsCount: number
  cleanupCount: number
  fulfillmentCount: number
  nextShowLabel: string
  onLaunchAction: (action: WorkspaceLaunchAction) => void
  onOpenTradeBoard: () => void
  onOpenCalendar: () => void
  onOpenCustomerBoardPreview: () => void
}) {
  return (
    <section className={styles.homeShell}>
      <div className={styles.chatIntro}>
        <div className={styles.chatTitleRow}>
          <span className={styles.chatTitle}>Nic-Nac</span>
        </div>
        <p className={styles.chatSubtitle}>
          Start here. I can add pieces, set up shows, check your board, and walk you through the next step.
        </p>
      </div>

      <div className={styles.quickActions}>
        <button onClick={() => onLaunchAction('add_trade_piece')}>Add a piece</button>
        <button onClick={() => onLaunchAction('check_board')}>Check my board</button>
        <button onClick={() => onLaunchAction('add_calendar_show')}>Add a show</button>
      </div>

      <div className={styles.todayStrip}>
        <span>{tradeRequestsCount} requests</span>
        <span>{cleanupCount} cleanup</span>
        <span>{fulfillmentCount} fulfillment</span>
      </div>

      <div className={styles.glanceGrid}>
        <button onClick={onOpenTradeBoard}>Trade Board</button>
        <button onClick={onOpenCalendar}>{nextShowLabel}</button>
        <button onClick={onOpenCustomerBoardPreview}>Customer board</button>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Mount the home section before the current section switch**

```tsx
if (canRenderWorkspaceSections && activeSection === 'home') {
  return (
    <NicNacHomeWorkspaceCard
      tradeRequestsCount={tradeRequestsState.requests?.length ?? 0}
      cleanupCount={tradeSwapCleanupState.items?.length ?? 0}
      fulfillmentCount={fulfillmentQueueState.items?.length ?? 0}
      nextShowLabel={buildHomeNextShowLabel(calendarState.summary?.upcomingEvents ?? [])}
      onLaunchAction={handleLaunchNicNacAction}
      onOpenTradeBoard={() => setActiveSection('trade-board')}
      onOpenCalendar={() => setActiveSection('show-calendar')}
      onOpenCustomerBoardPreview={handleOpenTradeBoardPreview}
    />
  )
}
```

- [ ] **Step 5: Add compact home-surface styles without a giant mark**

```css
.chatTitleRow {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.chatTitle {
  font-size: 1rem;
  font-weight: 700;
}

.quickActions {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

@media (min-width: 960px) {
  .quickActions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
```

- [ ] **Step 6: Re-run the dashboard suite**

Run: `npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts`

Expected: PASS after updating expected section labels and home rendering.

- [ ] **Step 7: Commit the home surface**

```bash
git add app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/NicNacHomeWorkspaceCard.tsx app/nic-nac/components/NicNacHomeWorkspaceCard.module.css tests/nic-nac-dashboard-placeholder.test.ts
git commit -m "feat: add Nic-Nac-first workspace home"
```

---

### Task 3: Make quick actions launch straight into Nic-Nac chat

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\_client.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacMobileShell.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Add failing reviewer-smoke expectations for launchable actions**

```ts
it('keeps mobile Nic-Nac launch affordances wired for quick actions', () => {
  expect(nicNacClient).toContain('pendingLaunchPrompt')
  expect(nicNacClient).toContain('setMobileOpen(true)')
  expect(dashboardPlaceholder).toContain('onLaunchNicNacAction')
})
```

- [ ] **Step 2: Run the smoke-oriented UI test**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts`

Expected: FAIL because no launch-action bridge exists yet.

- [ ] **Step 3: Add pending launch prompt state in `_client.tsx`**

```tsx
const [pendingLaunchPrompt, setPendingLaunchPrompt] = useState<string | null>(null)

const handleLaunchNicNacAction = useCallback((action: WorkspaceLaunchAction) => {
  const prompt = getLaunchPromptForWorkspaceAction(action)
  if (!prompt) return
  setPendingLaunchPrompt(prompt)
  if (!isDesktop) {
    setMobileOpen(true)
  } else {
    setDesktopOpen(true)
  }
}, [isDesktop])
```

```tsx
<DashboardPlaceholder
  ...
  onLaunchNicNacAction={handleLaunchNicNacAction}
/>
```

- [ ] **Step 4: Let `NicNacChatBody` consume a launch prompt and send it once**

```tsx
export function NicNacChatBody({
  ...
  launchPrompt,
  onLaunchPromptConsumed,
}: {
  ...
  launchPrompt?: string | null
  onLaunchPromptConsumed?: () => void
}) {
  useEffect(() => {
    if (!launchPrompt) return
    void sendMessage({
      text: launchPrompt,
    })
    onLaunchPromptConsumed?.()
  }, [launchPrompt, onLaunchPromptConsumed, sendMessage])
}
```

- [ ] **Step 5: Pass the launch prompt through the shell**

```tsx
<NicNacChatBody
  ...
  launchPrompt={pendingLaunchPrompt}
  onLaunchPromptConsumed={() => setPendingLaunchPrompt(null)}
/>
```

- [ ] **Step 6: Re-run the focused smoke/UI tests**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts tests/nic-nac-dashboard-placeholder.test.ts`

Expected: PASS with updated string assertions for launch action wiring.

- [ ] **Step 7: Commit the launcher bridge**

```bash
git add app/nic-nac/_client.tsx app/nic-nac/components/NicNacChatBody.tsx app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/NicNacMobileShell.tsx tests/reviewer-smoke-ui.test.ts
git commit -m "feat: launch Nic-Nac flows from workspace actions"
```

---

### Task 4: Rebuild the shell and navigation for Concept 1 responsiveness

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceShell.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceSectionTabs.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\WorkspaceSectionTabs.module.css`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\_shell.module.css`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Add failing assertions for mobile-first nav language**

```ts
it('uses the streamlined primary workspace navigation', () => {
  expect(dashboardPlaceholder).toContain("label: 'Nic-Nac'")
  expect(dashboardPlaceholder).toContain("label: 'Trade Board'")
  expect(dashboardPlaceholder).toContain("label: 'Calendar'")
  expect(dashboardPlaceholder).toContain("label: 'Jewelry Library'")
  expect(dashboardPlaceholder).toContain("label: 'More'")
})
```

- [ ] **Step 2: Run the reviewer smoke UI suite**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts`

Expected: FAIL until the shell and tab structure are updated.

- [ ] **Step 3: Update `WorkspaceShell` so nav can render as bottom-nav on phone and top utility nav on larger screens**

```tsx
export function WorkspaceShell<TKey extends string>({
  ...
  navPlacement = 'responsive',
}: {
  ...
  navPlacement?: 'responsive'
}) {
  return (
    <div className={styles.shell}>
      {header ? <div className={styles.header}>{header}</div> : null}
      <section className={styles.content} ...>
        {notice}
        {children}
      </section>
      <div className={styles.tabsWrap}>
        <WorkspaceSectionTabs ... />
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Restyle the tabs for rounded mobile nav and restrained desktop expansion**

```css
.tabsWrap {
  position: sticky;
  bottom: 0;
  z-index: 30;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  background: linear-gradient(to top, rgba(232, 223, 245, 0.96), rgba(232, 223, 245, 0.72));
}

@media (min-width: 960px) {
  .tabsWrap {
    position: static;
    padding: 0;
    background: transparent;
  }
}
```

```css
.tab,
.tabActive {
  min-height: 56px;
  border-radius: 18px;
}

@media (min-width: 960px) {
  .tabs {
    justify-content: flex-start;
    gap: 12px;
  }
}
```

- [ ] **Step 5: Make the desktop shell breathe without restoring a bulky sidebar**

```css
@media (min-width: 1024px) {
  .root {
    grid-template-columns: minmax(0, 1fr) minmax(380px, 420px);
  }
}

.rootMinimized {
  display: block;
}
```

- [ ] **Step 6: Re-run the shell/smoke tests**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts`

Expected: PASS after the shell strings and nav model are aligned.

- [ ] **Step 7: Commit the shell reset**

```bash
git add app/nic-nac/components/WorkspaceShell.tsx app/nic-nac/components/WorkspaceSectionTabs.tsx app/nic-nac/components/WorkspaceSectionTabs.module.css app/nic-nac/_shell.module.css app/nic-nac/components/DashboardPlaceholder.tsx tests/reviewer-smoke-ui.test.ts
git commit -m "feat: reset workspace shell for Nic-Nac-first layout"
```

---

### Task 5: Keep the Nic-Nac header compact and remove wasted mark space

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHeader.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacHeader.module.css`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Add a failing header assertion**

```ts
it('keeps the Nic-Nac header compact instead of oversized branding', () => {
  expect(nicNacHeader).toContain("<span className={styles.title}>Nic-Nac</span>")
  expect(nicNacHeaderCss).not.toContain('font-size: 28px')
})
```

- [ ] **Step 2: Run the targeted test**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts`

Expected: FAIL if the new assertion references `nicNacHeader` fixtures not yet loaded.

- [ ] **Step 3: Keep the small glyph + title only**

```tsx
<div className={styles.titleGroup}>
  <NicNacGlyph size={20} />
  <span className={styles.title}>Nic-Nac</span>
</div>
```

```css
.header {
  min-height: 56px;
  padding: 0 16px;
}

.titleGroup {
  gap: 10px;
}

.title {
  font-size: 14px;
  font-weight: 800;
}
```

- [ ] **Step 4: Re-run the smoke/UI test**

Run: `npm exec vitest run tests/reviewer-smoke-ui.test.ts`

Expected: PASS with the updated compact-header assertions.

- [ ] **Step 5: Commit the compact header**

```bash
git add app/nic-nac/components/NicNacHeader.tsx app/nic-nac/components/NicNacHeader.module.css tests/reviewer-smoke-ui.test.ts
git commit -m "fix: compact Nic-Nac header treatment"
```

---

### Task 6: Verification, reviewer smoke, and release proof

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\docs\sparkle-suite\testing\reviewer-smoke-standard.md`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Extend the reviewer smoke checklist for the new home-first shell**

```md
## Nic-Nac-first workspace smoke

1. Open `/start` on the stable demo and enter reviewer smoke mode.
2. Open the workspace preview.
3. Confirm the primary nav shows `Nic-Nac`, `Trade Board`, `Calendar`, `Jewelry Library`, and `More`.
4. On mobile width, tap `Add a piece` and verify the Nic-Nac chat opens and starts the add-listing flow automatically.
5. On mobile width, close chat and confirm the floating `N` remains available to reopen it.
6. On desktop width, confirm the chat remains persistent and the home surface still shows compact Today/Trade/Calendar glance modules.
```

- [ ] **Step 2: Run the local test pass**

Run: `npm exec vitest run tests/nic-nac-workspace-launch-actions.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/reviewer-smoke-ui.test.ts`

Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`

Expected: `✓ Compiled successfully`

- [ ] **Step 4: Run the stable demo reviewer smoke after deployment**

Run: `npx playwright screenshot --viewport-size=390,1000 https://sparkle-suite-demo.vercel.app/nic-nac mobile-nic-nac-home.png`

Expected: mobile screenshot shows the new home shell and no clipped bottom nav.

Run: `npx playwright screenshot --viewport-size=1440,1024 https://sparkle-suite-demo.vercel.app/nic-nac desktop-nic-nac-home.png`

Expected: desktop screenshot shows the expanded Concept 1 shell with persistent chat.

- [ ] **Step 5: Commit the smoke-doc update**

```bash
git add docs/sparkle-suite/testing/reviewer-smoke-standard.md
git commit -m "docs: add Nic-Nac-first workspace smoke"
```

---

## Acceptance Criteria

- Mobile home opens to a Nic-Nac-first surface instead of a dense workspace panel.
- The large wasted `N` treatment is not used in the home surface.
- The chat header remains compact and simply labeled `Nic-Nac`.
- Tapping `Add a piece` or `Add a show` on mobile opens Nic-Nac and immediately starts the correct workflow prompt.
- If chat is closed on mobile, the floating `N` reopen affordance remains available.
- Desktop and tablet keep the same information architecture, but expand spacing and context instead of introducing a separate design language.
- Primary nav is reduced to `Nic-Nac`, `Trade Board`, `Calendar`, `Jewelry Library`, and `More`.
- Secondary tools still exist under `More`; no existing functionality is deleted.
- Existing Trade Board, Calendar, Library, Site, Help, and Account data still load and refresh correctly.
- Reviewer-smoke documentation and tests reflect the new shell.

## Rollout Order

1. Ship the pure launch-action helper and primary-nav IA.
2. Add the new home section without removing old section renderers.
3. Wire quick actions into chat launch behavior.
4. Apply the shell/nav CSS reset.
5. Finalize compact header treatment.
6. Run local tests, build, deploy, stable-demo smoke, then hand off.

## Risks to watch

- Sending a launch prompt twice if chat remounts after section changes.
- Breaking reviewer-smoke assumptions that currently default to `trade-board`.
- Hiding secondary functions too aggressively in a way that blocks current beta workflows.
- Mobile bottom-nav overlap with the chat composer or safe-area padding.
- Desktop shell drift that makes the persistent chat column feel cramped.

