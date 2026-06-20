# Sparkle Suite In-Shell Live Site Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let reps switch from the Sparkle Suite Workspace into an interactive customer Live Site Preview without leaving `/nic-nac`, while keeping Nic-Nac mounted and available on the side.

**Architecture:** Keep the existing `/nic-nac` rep shell as the single cockpit. Add preview state inside `DashboardPlaceholder` so the workspace stays mounted and returns to the same place after preview. Render the customer site/trade board in an iframe with a slim preview toolbar, refresh controls, and auto-refresh on Nic-Nac mutation events.

**Tech Stack:** Next.js App Router, React/TypeScript, CSS Modules, existing Nic-Nac workspace refresh events, Vitest, in-app browser smoke testing.

---

## Scope

- [ ] Build a desktop/tablet in-shell preview only.
- [ ] Keep Nic-Nac mounted while the preview is open.
- [ ] Keep reps inside the shell by default; no `Open in new tab` button in this first pass.
- [ ] `View live site` opens the customer homepage inside preview.
- [ ] `View customer board` opens the customer trade board inside preview.
- [ ] The preview is real and interactive, using the actual customer pages and current rep data.
- [ ] The preview has a manual `Refresh preview` button.
- [ ] The preview auto-refreshes when Nic-Nac emits a workspace mutation event that affects trade/site content.
- [ ] Do not build a phone-specific embedded preview. On narrow screens, keep behavior simple and avoid cramming the preview into the mobile Nic-Nac layout.
- [ ] Do not touch Chrome Web Store settings, extension files, live queue systems, checkout, onboarding, deploys, commits, or pushes.

## Files

- [ ] Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Own preview mode state.
  - Convert `View live site` and `View customer board` from external anchors to in-shell preview triggers on wide screens.
  - Show a simple wider-screen notice instead of opening an embedded preview on narrow mobile screens.
  - Render the preview shell in place of the dashboard/sidebar while preserving internal workspace state.
  - Refresh the iframe on manual click and relevant Nic-Nac mutation events.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`
  - Add preview toolbar, preview frame, desktop/tablet layout, and mobile fallback styles.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\workspace-refresh-events.ts`
  - Extend refresh topics from trade-only to include site changes.
  - Detect successful site-setting/banner/streaming-link mutation tool output.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
  - No UI redesign. Ensure it dispatches all topics returned by `getWorkspaceRefreshTopicsFromMessages`.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`
  - Component/static tests for preview shell behavior.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-workspace-refresh-events.test.ts`
  - Coverage for new site refresh topics.
- [ ] Modify `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`
  - Static UI contract for keeping preview in-shell.

## Requirements Checklist

- [ ] Workspace mode shows the normal dashboard sidebar and workspace sections.
- [ ] Live Site Preview mode hides the dashboard sidebar and workspace cards.
- [ ] Nic-Nac remains mounted in the right column on desktop.
- [ ] Returning to workspace preserves DashboardPlaceholder state because the component never unmounts.
- [ ] `Back to workspace` returns to the previous workspace view.
- [ ] `Refresh preview` reloads the iframe without navigating away from `/nic-nac`.
- [ ] `View live site` starts from the customer homepage every time.
- [ ] `View customer board` opens directly to the trade board inside the same preview shell.
- [ ] Interactions inside the iframe behave as the customer page normally behaves.
- [ ] Existing customer pages do not receive rep-only UI injected into them.
- [ ] Mobile does not gain a complex embedded preview experience.
- [ ] Narrow mobile taps show a clear message that Live Site Preview works best on a wider screen.

## Task 1: Add Preview State Contracts In Dashboard Tests

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-dashboard-placeholder.test.ts`

- [ ] **Step 1: Add a failing test for in-shell live-site preview triggers**

Add this test near the existing `TradeBoardWorkspaceCard` and workspace link tests:

```ts
it('renders live-site links as in-shell preview controls instead of external navigation', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
    'utf8',
  )

  expect(source).toContain('handleOpenLiveSitePreview')
  expect(source).toContain('handleOpenTradeBoardPreview')
  expect(source).toContain('setWorkspacePreview')
  expect(source).toContain('Live Site Preview')
  expect(source).toContain('Refresh preview')
  expect(source).not.toContain('target="_blank"')
})
```

- [ ] **Step 2: Add a failing render test for the preview shell**

Add a render test that proves the preview shell replaces workspace content while preserving the component API:

```ts
it('defines a preview shell that can render customer pages inside the workspace frame', () => {
  const source = readFileSync(
    resolve(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
    'utf8',
  )

  expect(source).toContain('WorkspacePreviewState')
  expect(source).toContain('previewFrameKey')
  expect(source).toContain('<iframe')
  expect(source).toContain('title="Sparkle Suite live site preview"')
  expect(source).toContain('Back to workspace')
})
```

- [ ] **Step 3: Run the dashboard placeholder test and verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: the two new tests fail because preview state, handlers, and shell markup do not exist yet.

## Task 2: Add In-Shell Preview State And Handlers

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`

- [ ] **Step 1: Add preview types near the other local types**

Add:

```ts
type WorkspacePreviewState = {
  mode: 'workspace' | 'live_site_preview'
  href: string
  label: string
}
```

- [ ] **Step 2: Add preview state inside `DashboardPlaceholder`**

Inside `DashboardPlaceholder`, after the existing `quickAddItemNumber` state, add:

```tsx
const [workspacePreview, setWorkspacePreview] =
  useState<WorkspacePreviewState>({
    mode: 'workspace',
    href: '',
    label: '',
  })
const [previewFrameKey, setPreviewFrameKey] = useState(0)
const [previewUnavailableMessage, setPreviewUnavailableMessage] = useState<string | null>(null)
```

Add these helpers near the existing Board Inventory viewport helpers:

```ts
const LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY = '(min-width: 841px)'

function subscribeLiveSitePreviewViewport(callback: () => void) {
  if (typeof window === 'undefined') return () => {}

  const mediaQuery = window.matchMedia(LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getLiveSitePreviewViewportSnapshot() {
  if (typeof window === 'undefined') return true
  return window.matchMedia(LIVE_SITE_PREVIEW_MIN_WIDTH_QUERY).matches
}
```

Inside `DashboardPlaceholder`, add:

```tsx
const canUseEmbeddedLiveSitePreview = useSyncExternalStore(
  subscribeLiveSitePreviewViewport,
  getLiveSitePreviewViewportSnapshot,
  () => true,
)
```

- [ ] **Step 3: Add preview handlers after customer hrefs are computed**

After `customerSparkleSiteHref` is computed, add:

```tsx
const customerTradeBoardHref = buildCustomerTradeBoardHref(
  repIdOverride ?? repProfileState.repId,
)

function handleOpenLiveSitePreview() {
  if (!canUseEmbeddedLiveSitePreview) {
    setPreviewUnavailableMessage(
      'Live Site Preview works best on a wider screen. Use a desktop, laptop, or wider tablet to preview inside Sparkle Suite.',
    )
    return
  }
  setPreviewUnavailableMessage(null)
  setWorkspacePreview({
    mode: 'live_site_preview',
    href: customerSparkleSiteHref,
    label: 'Live Site Preview',
  })
  setPreviewFrameKey((current) => current + 1)
}

function handleOpenTradeBoardPreview() {
  if (!canUseEmbeddedLiveSitePreview) {
    setPreviewUnavailableMessage(
      'Live Site Preview works best on a wider screen. Use a desktop, laptop, or wider tablet to preview inside Sparkle Suite.',
    )
    return
  }
  setPreviewUnavailableMessage(null)
  setWorkspacePreview({
    mode: 'live_site_preview',
    href: customerTradeBoardHref,
    label: 'Customer Trade Board Preview',
  })
  setPreviewFrameKey((current) => current + 1)
}

function handleClosePreview() {
  setWorkspacePreview({
    mode: 'workspace',
    href: '',
    label: '',
  })
}

function handleRefreshPreview() {
  setPreviewFrameKey((current) => current + 1)
}
```

- [ ] **Step 4: Convert `View live site` to a preview button**

Replace the current topbar live-site anchor:

```tsx
<a
  className={styles.liveSiteButton}
  href={customerSparkleSiteHref}
  target="_blank"
  rel="noreferrer"
>
  View live site
</a>
```

with:

```tsx
<button
  type="button"
  className={styles.liveSiteButton}
  onClick={handleOpenLiveSitePreview}
>
  View live site
</button>
{previewUnavailableMessage ? (
  <div className={styles.actionError}>{previewUnavailableMessage}</div>
) : null}
```

- [ ] **Step 5: Pass the trade-board preview handler to `TradeBoardWorkspaceCard`**

Update the card call:

```tsx
<TradeBoardWorkspaceCard
  ...
  customerBoardHref={customerTradeBoardHref}
  onOpenCustomerBoardPreview={handleOpenTradeBoardPreview}
/>
```

Update the props type:

```ts
onOpenCustomerBoardPreview?: () => void
```

Replace the `View customer board` anchor in `TradeBoardWorkspaceCard` with:

```tsx
<button
  type="button"
  className={styles.helperLink}
  onClick={onOpenCustomerBoardPreview}
>
  View customer board
</button>
```

Keep `customerBoardHref` available as a fallback only if the handler is not provided:

```tsx
{onOpenCustomerBoardPreview ? (
  <button type="button" className={styles.helperLink} onClick={onOpenCustomerBoardPreview}>
    View customer board
  </button>
) : (
  <a className={styles.helperLink} href={customerBoardHref} target="_blank" rel="noreferrer">
    View customer board
  </a>
)}
```

- [ ] **Step 6: Run the failing tests again**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: tests still fail until the preview shell markup is added.

## Task 3: Render The Preview Shell

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.module.css`

- [ ] **Step 1: Add the preview branch before the normal workspace shell**

In `DashboardPlaceholder`, after the topbar and before the normal `<div className={styles.workspaceShell}>`, add a conditional branch that replaces the workspace shell:

```tsx
{workspacePreview.mode === 'live_site_preview' ? (
  <section className={styles.previewShell} aria-label={workspacePreview.label}>
    <div className={styles.previewToolbar}>
      <div className={styles.previewToolbarCopy}>
        <span className={styles.previewKicker}>Live Site Preview</span>
        <span className={styles.previewTitle}>{workspacePreview.label}</span>
      </div>
      <div className={styles.previewToolbarActions}>
        <button
          type="button"
          className={styles.secondaryActionButton}
          onClick={handleRefreshPreview}
        >
          Refresh preview
        </button>
        <button
          type="button"
          className={styles.actionButton}
          onClick={handleClosePreview}
        >
          Back to workspace
        </button>
      </div>
    </div>
    <iframe
      key={`${previewFrameKey}:${workspacePreview.href}`}
      className={styles.previewFrame}
      src={workspacePreview.href}
      title="Sparkle Suite live site preview"
    />
  </section>
) : (
  <div className={styles.workspaceShell}>
    ...
  </div>
)}
```

Move the existing normal `<div className={styles.workspaceShell}>...</div>` inside the `else` branch.

- [ ] **Step 2: Keep the topbar visible but contextual**

Do not remove the existing Sparkle Suite topbar. In preview mode, it still identifies the rep/show and keeps the `View live site` button available. The preview branch hides only the dashboard sidebar/workspace cards.

- [ ] **Step 3: Add preview CSS**

Add these classes to `DashboardPlaceholder.module.css` near the workspace layout classes:

```css
.previewShell {
  max-width: 1180px;
  width: 100%;
  min-height: calc(100vh - 112px);
  display: grid;
  grid-template-rows: auto minmax(520px, 1fr);
  gap: 12px;
}

.previewToolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  border: 1px solid var(--nic-nac-border);
  border-radius: 18px;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 253, 251, 0.88));
  box-shadow:
    inset 0 1px rgba(255, 255, 255, 0.88),
    0 16px 36px rgba(54, 34, 29, 0.08);
  padding: 12px 14px;
}

.previewToolbarCopy {
  display: flex;
  min-width: min(100%, 260px);
  flex-direction: column;
  gap: 3px;
}

.previewKicker {
  font-family: var(--font-prelaunch-sans), 'DM Sans', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 800;
  line-height: 1.2;
  color: var(--nic-nac-text-secondary);
  text-transform: uppercase;
}

.previewTitle {
  font-family: var(--font-prelaunch-display), Georgia, serif;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.1;
  color: var(--nic-nac-text-primary);
}

.previewToolbarActions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.previewFrame {
  width: 100%;
  min-height: 620px;
  border: 1px solid var(--nic-nac-border);
  border-radius: 18px;
  background: var(--nic-nac-surface-primary-solid);
  box-shadow: 0 18px 42px rgba(54, 34, 29, 0.08);
}
```

- [ ] **Step 4: Add a narrow-screen fallback style**

In the existing `@media (max-width: 840px)` block, add:

```css
.previewShell {
  min-height: auto;
  grid-template-rows: auto;
}

.previewFrame {
  min-height: 70vh;
}

.previewToolbarActions {
  width: 100%;
  justify-content: stretch;
}

.previewToolbarActions .secondaryActionButton,
.previewToolbarActions .actionButton {
  flex: 1 1 160px;
}
```

This keeps the UI readable if a tablet is narrow, but it does not build a separate phone-specific workflow.

- [ ] **Step 5: Run dashboard tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: new preview tests pass or fail only on exact string mismatches that should be corrected.

## Task 4: Auto-Refresh The Preview After Nic-Nac Mutations

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\workspace-refresh-events.ts`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-workspace-refresh-events.test.ts`

- [ ] **Step 1: Add failing tests for site refresh topics**

In `tests/nic-nac-workspace-refresh-events.test.ts`, add:

```ts
it('returns site refresh topics for successful site-setting mutations', () => {
  const topics = getWorkspaceRefreshTopicsFromMessages([
    {
      id: 'message-1',
      role: 'assistant',
      parts: [
        {
          type: 'tool-update_site_setting',
          state: 'output-available',
          output: { ok: true },
        },
      ],
    } as UIMessage,
  ])

  expect(topics).toEqual(['site'])
})

it('does not refresh site preview for failed site-setting mutations', () => {
  const topics = getWorkspaceRefreshTopicsFromMessages([
    {
      id: 'message-1',
      role: 'assistant',
      parts: [
        {
          type: 'tool-update_site_setting',
          state: 'output-available',
          output: { code: 'SITE_SETTING_FAILED' },
        },
      ],
    } as UIMessage,
  ])

  expect(topics).toEqual([])
})
```

- [ ] **Step 2: Run refresh-event tests and verify failure**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-refresh-events.test.ts
```

Expected: site-topic tests fail because `NicNacWorkspaceRefreshTopic` only allows `trade`.

- [ ] **Step 3: Extend refresh topics**

In `workspace-refresh-events.ts`, change:

```ts
export type NicNacWorkspaceRefreshTopic = 'trade'
```

to:

```ts
export type NicNacWorkspaceRefreshTopic = 'trade' | 'site'
```

Add:

```ts
const SITE_WRITE_TOOL_TYPES = new Set([
  'tool-update_site_setting',
  'tool-update_banner_text',
  'tool-update_streaming_links',
])
```

Update the topic collection loop:

```ts
if (isTradeWorkspaceMutationPart(part as ToolPartLike)) {
  topics.add('trade')
}
if (isSiteWorkspaceMutationPart(part as ToolPartLike)) {
  topics.add('site')
}
```

Add:

```ts
export function isSiteWorkspaceMutationPart(part: ToolPartLike) {
  if (!part.type || !SITE_WRITE_TOOL_TYPES.has(part.type)) return false
  if (part.state !== 'output-available') return false
  if (isToolErrorOutput(part.output)) return false
  return true
}
```

- [ ] **Step 4: Refresh iframe when relevant events fire**

In `DashboardPlaceholder.tsx`, update the existing `refreshAfterNicNacMutation` effect:

```tsx
const refreshAfterNicNacMutation = (event: Event) => {
  const detail = (event as CustomEvent<{ topic?: string }>).detail
  if (detail?.topic === 'trade') {
    void refreshTradeWorkspace()
  }
  if (
    workspacePreview.mode === 'live_site_preview' &&
    (detail?.topic === 'trade' || detail?.topic === 'site')
  ) {
    setPreviewFrameKey((current) => current + 1)
  }
}
```

Include `workspacePreview.mode` in the effect dependency array.

- [ ] **Step 5: Inspect Nic-Nac dispatch loop**

In `NicNacChatBody.tsx`, confirm both places that dispatch `NIC_NAC_WORKSPACE_REFRESH_EVENT` iterate over every topic returned by `getWorkspaceRefreshTopicsFromMessages`. If either path dispatches only `trade`, replace it with this pattern:

```tsx
for (const topic of topics) {
  window.dispatchEvent(
    new CustomEvent(NIC_NAC_WORKSPACE_REFRESH_EVENT, {
      detail: { topic },
    }),
  )
}
```

- [ ] **Step 6: Run refresh-event and dashboard tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-workspace-refresh-events.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: both pass.

## Task 5: Add Reviewer Smoke UI Contracts

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Add static contract test**

Add:

```ts
it('keeps live site preview inside the Nic-Nac workspace shell', () => {
  const componentStart = dashboardPlaceholder.indexOf(
    'export function DashboardPlaceholder',
  )
  const componentSource = dashboardPlaceholder.slice(componentStart)

  expect(componentSource).toContain('WorkspacePreviewState')
  expect(componentSource).toContain('handleOpenLiveSitePreview')
  expect(componentSource).toContain('handleOpenTradeBoardPreview')
  expect(componentSource).toContain('Refresh preview')
  expect(componentSource).toContain('Back to workspace')
  expect(componentSource).toContain('<iframe')
  expect(componentSource).not.toContain('View live site</a>')
})
```

- [ ] **Step 2: Run reviewer smoke UI tests**

Run:

```powershell
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: pass after DashboardPlaceholder implementation.

## Task 6: Desktop And Tablet Browser Smoke

**Files:**
- No code files.

- [ ] **Step 1: Open the local workspace**

Use the in-app browser at:

```text
http://localhost:3001/nic-nac?conversationId=45764110-0330-4a5d-964b-5b5ff49fb662
```

- [ ] **Step 2: Verify default workspace**

Expected:

- `Request inbox` appears before `Board Inventory`.
- Nic-Nac is visible on the side.
- `View live site` is visible in the top bar.
- `View customer board` is visible in the Trade Board card.

- [ ] **Step 3: Click `View live site`**

Expected:

- Browser URL remains `/nic-nac?...`.
- Nic-Nac remains visible.
- Dashboard sidebar disappears.
- Preview toolbar appears with `Live Site Preview`, `Refresh preview`, and `Back to workspace`.
- Iframe displays the customer homepage.

- [ ] **Step 4: Click `Back to workspace`**

Expected:

- Normal workspace returns.
- Nic-Nac chat state remains mounted and unchanged.
- Workspace does not navigate away from `/nic-nac`.

- [ ] **Step 5: Click `View customer board`**

Expected:

- Browser URL remains `/nic-nac?...`.
- Nic-Nac remains visible.
- Preview toolbar appears.
- Iframe displays the customer trade board path, not the homepage.

- [ ] **Step 6: Click `Refresh preview`**

Expected:

- Iframe reloads.
- The shell stays on `/nic-nac`.
- Nic-Nac remains mounted.

- [ ] **Step 7: Tablet-width smoke**

Set viewport to about `900x900`.

Expected:

- Preview toolbar wraps cleanly.
- Iframe remains usable.
- Nic-Nac desktop/tablet behavior remains accessible.

## Task 7: Final Verification And Review

**Files:**
- No code files.

- [ ] **Step 1: Run focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-workspace-refresh-events.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run targeted lint**

Run:

```powershell
npx eslint app/nic-nac/components/DashboardPlaceholder.tsx app/nic-nac/components/DashboardPlaceholder.module.css app/nic-nac/components/NicNacChatBody.tsx lib/nic-nac/workspace-refresh-events.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-workspace-refresh-events.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected: zero new errors. Existing warnings may remain; report them.

- [ ] **Step 3: Run typecheck if time permits**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: this may still fail from known unrelated repo-wide issues. Report any new errors in files touched by this plan.

- [ ] **Step 4: Subagent review**

Dispatch a read-only subagent reviewer with this scope:

```text
Review the in-shell Live Site Preview implementation in:
- app/nic-nac/components/DashboardPlaceholder.tsx
- app/nic-nac/components/DashboardPlaceholder.module.css
- app/nic-nac/components/NicNacChatBody.tsx
- lib/nic-nac/workspace-refresh-events.ts
- tests/nic-nac-dashboard-placeholder.test.ts
- tests/nic-nac-workspace-refresh-events.test.ts
- tests/reviewer-smoke-ui.test.ts

Check requirements:
- Nic-Nac remains mounted.
- /nic-nac shell remains the browser URL.
- View live site opens homepage in iframe.
- View customer board opens trade board in iframe.
- Back to workspace works.
- Refresh preview works.
- Auto-refresh keys off trade/site mutation events.
- No customer-facing rep UI is injected into Amethyst pages.
- No Chrome extension/live queue/checkout/onboarding files are touched.

Return findings first with file/line references. Do not edit files.
```

- [ ] **Step 5: Fix reviewer findings**

If the reviewer finds issues, add or adjust tests first, then patch implementation, then rerun focused tests and lint.

- [ ] **Step 6: Final status**

Report:

- Files changed.
- Tests run with pass/fail counts.
- Browser smoke result.
- Lint/typecheck status.
- Any residual risks.

Do not commit, push, or deploy unless Louis explicitly asks after reviewing the result.

## Subagent Usage Plan

- [ ] Use the main agent for TDD setup and core DashboardPlaceholder implementation because the state/rendering changes are tightly coupled.
- [ ] Use one read-only explorer before implementation if more context is needed on iframe safety, Amethyst routing, or refresh events.
- [ ] Use one read-only reviewer after implementation for the scoped requirement review in Task 7.
- [ ] Do not dispatch parallel coding agents against `DashboardPlaceholder.tsx`; that file is already large and conflict-prone.

## Approval Gate

Stop after this plan is reviewed. Implementation starts only after Louis explicitly approves the plan.
