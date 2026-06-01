# Nic-Nac Chat Ecosystem Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every active Nic-Nac chat surface feel like one polished ecosystem by using the same pink `N` identity mark, close/minimize patterns, message treatment, and accessible chat-window behavior.

**Architecture:** Keep the Sparkle Suite workspace as the current interaction baseline because it already has `NicNacGlyph`, icon close controls, desktop minimize/reopen, mobile modal behavior, focus handling, and assistant glyph bubbles. Extract the pink `N` mark into a shared component that both workspace and public landing can consume, then upgrade the public landing pop-up to match the workspace’s shell language without adding workspace-only powers.

**Tech Stack:** Next.js App Router, React client components, CSS Modules for workspace Nic-Nac, global landing-page CSS for Sparkle Suite public landing, Vitest static/render tests, TypeScript.

---

## Surface Map

- Active public landing Nic-Nac: `app/_components/sparkle-suite-public-nic-nac.tsx`, styled in `app/globals.css`, route `app/api/public/nic-nac/route.ts`.
- Active workspace Nic-Nac: `app/nic-nac/_client.tsx`, `app/nic-nac/components/NicNacGlyph.tsx`, `app/nic-nac/components/NicNacHeader.tsx`, `app/nic-nac/components/NicNacMobileShell.tsx`, message components under `app/nic-nac/components/`.
- Current workspace mark: pink circle with white `N`; keep this as the canonical temporary Nic-Nac avatar.
- Customer-site Nic-Nac: no active route/prompt/UI currently found in this workspace.
- Sparkle Finder Nic-Nac: no active route/prompt/UI currently found in this workspace.

## Files

- Create: `app/_components/nic-nac-mark.tsx` — shared pink `N` identity mark component.
- Create: `app/_components/nic-nac-mark.module.css` — shared mark styling with CSS variables and safe defaults.
- Modify: `app/nic-nac/components/NicNacGlyph.tsx` — wrap/re-export the shared mark so workspace keeps existing imports.
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx` — add shared mark, icon close/minimize controls, explicit minimized/reopen state, Escape/outside-click handling, focus return, and assistant message mark.
- Modify: `app/globals.css` — polish public landing chat shell, mobile bottom sheet, internal thread scroll, pinned composer, thinking dots, starter chips, handoff mini-card.
- Modify: `tests/sparkle-suite-public-landing.test.ts` — lock public pop-up polish and behavior.
- Modify: `tests/nic-nac-dashboard-placeholder.test.ts` or add focused workspace component source checks if needed — ensure workspace still consumes the canonical mark and keeps minimize/reopen behavior.
- Modify: `docs/superpowers/specs/2026-05-31-nic-nac-surface-inventory.md` — document the shared visual identity rule and adapter requirement for future customer-site / Sparkle Finder Nic-Nac.

---

### Task 1: Shared Pink `N` Mark

**Files:**
- Create: `app/_components/nic-nac-mark.tsx`
- Create: `app/_components/nic-nac-mark.module.css`
- Modify: `app/nic-nac/components/NicNacGlyph.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for the shared mark**

Add assertions to `tests/sparkle-suite-public-landing.test.ts`:

```ts
it('uses the shared Nic-Nac pink N mark in the public chat shell', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )
  const markSource = readFileSync(
    join(process.cwd(), 'app', '_components', 'nic-nac-mark.tsx'),
    'utf8',
  )

  expect(source).toContain('NicNacMark')
  expect(markSource).toContain('N')
  expect(markSource).toContain('aria-hidden')
})
```

Add a source check to an existing workspace test or a new focused test:

```ts
it('keeps the workspace Nic-Nac glyph backed by the shared mark', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', 'nic-nac', 'components', 'NicNacGlyph.tsx'),
    'utf8',
  )

  expect(source).toContain("from '@/app/_components/nic-nac-mark'")
  expect(source).toContain('NicNacMark')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: failure because `app/_components/nic-nac-mark.tsx` does not exist and public landing does not import `NicNacMark`.

- [ ] **Step 3: Create the shared mark**

Create `app/_components/nic-nac-mark.tsx`:

```tsx
import styles from './nic-nac-mark.module.css'

export function NicNacMark({
  size = 22,
  className,
}: {
  size?: number
  className?: string
}) {
  return (
    <span
      aria-hidden="true"
      className={className ? `${styles.mark} ${className}` : styles.mark}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.6) }}
    >
      N
    </span>
  )
}
```

Create `app/_components/nic-nac-mark.module.css`:

```css
.mark {
  align-items: center;
  background: var(--nic-nac-accent, #ee2c9b);
  border-radius: 999px;
  color: var(--nic-nac-text-on-accent, #ffffff);
  display: inline-flex;
  flex: 0 0 auto;
  font-family: var(--font-prelaunch-body), 'Geist', system-ui, sans-serif;
  font-weight: 900;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 8px 18px rgba(238, 44, 155, 0.22);
}
```

Modify `app/nic-nac/components/NicNacGlyph.tsx`:

```tsx
import { NicNacMark } from '@/app/_components/nic-nac-mark'

export function NicNacGlyph({ size = 22 }: { size?: number }) {
  return <NicNacMark size={size} />
}
```

- [ ] **Step 4: Run tests to verify the shared mark passes**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: shared mark tests pass.

---

### Task 2: Public Landing Shell Controls

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for close/minimize/reopen affordances**

Add to `tests/sparkle-suite-public-landing.test.ts`:

```ts
it('gives public Nic-Nac visible ecosystem controls for close and minimize', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )

  expect(source).toContain('aria-label="Minimize Nic-Nac"')
  expect(source).toContain('aria-label="Close Nic-Nac"')
  expect(source).toContain('aria-label="Open Nic-Nac"')
  expect(source).toContain('onKeyDown')
  expect(source).toContain('Escape')
})
```

Add CSS checks:

```ts
it('styles public Nic-Nac controls as icon-sized chat window controls', () => {
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

  expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-panel__icon-button')
  expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-reopen')
  expect(css).toContain('width: 36px')
  expect(css).toContain('height: 36px')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: fail because the public widget only has a subtle text `Close` button and no minimize/reopen state.

- [ ] **Step 3: Implement controls in the public component**

In `app/_components/sparkle-suite-public-nic-nac.tsx`:

- Import `KeyboardEvent`, `MouseEvent`, and `NicNacMark`.
- Add state: `const [isMinimized, setIsMinimized] = useState(false)`.
- Add refs: opener button, panel.
- When opening, set `isMinimized(false)`.
- Add `handlePanelKeyDown` to close/minimize on `Escape`.
- Add backdrop/outside click close on desktop/mobile popover wrapper.
- Replace text `Close` with icon buttons.

Representative JSX shape:

```tsx
<div className="sl2-nic-nac-panel__brand">
  <NicNacMark size={28} />
  <div>
    <h3>{publicNicNacAssistant.panelTitle}</h3>
    <p>{publicNicNacAssistant.panelIntro}</p>
  </div>
</div>
<div className="sl2-nic-nac-panel__actions">
  <button
    aria-label="Minimize Nic-Nac"
    className="sl2-nic-nac-panel__icon-button"
    onClick={() => setIsMinimized(true)}
    type="button"
  >
    <span aria-hidden="true">−</span>
  </button>
  <button
    aria-label="Close Nic-Nac"
    className="sl2-nic-nac-panel__icon-button"
    onClick={() => setIsOpen(false)}
    type="button"
  >
    <span aria-hidden="true">×</span>
  </button>
</div>
```

When minimized, render a floating reopen button:

```tsx
{isOpen && isMinimized ? (
  <button
    aria-label="Open Nic-Nac"
    className="sl2-nic-nac-reopen"
    onClick={() => setIsMinimized(false)}
    type="button"
  >
    <NicNacMark size={28} />
  </button>
) : null}
```

- [ ] **Step 4: Style the controls**

In `app/globals.css`, add:

```css
.sparkle-landing-v2 .sl2-nic-nac-panel__brand {
  align-items: center;
  display: flex;
  gap: 10px;
  min-width: 0;
}

.sparkle-landing-v2 .sl2-nic-nac-panel__actions {
  align-items: center;
  display: inline-flex;
  gap: 6px;
}

.sparkle-landing-v2 .sl2-nic-nac-panel__icon-button {
  align-items: center;
  background: rgba(64, 41, 36, 0.04);
  border: 1px solid rgba(64, 41, 36, 0.1);
  border-radius: 999px;
  color: #402924;
  cursor: pointer;
  display: inline-flex;
  height: 36px;
  justify-content: center;
  width: 36px;
}

.sparkle-landing-v2 .sl2-nic-nac-panel__icon-button:hover {
  background: #fff6fa;
  border-color: rgba(238, 44, 155, 0.24);
}

.sparkle-landing-v2 .sl2-nic-nac-reopen {
  align-items: center;
  background: #ee2c9b;
  border: 0;
  border-radius: 999px;
  bottom: calc(18px + env(safe-area-inset-bottom));
  box-shadow: 0 14px 32px rgba(238, 44, 155, 0.28);
  color: #ffffff;
  cursor: pointer;
  display: inline-flex;
  height: 58px;
  justify-content: center;
  position: fixed;
  right: calc(18px + env(safe-area-inset-right));
  width: 58px;
  z-index: 31;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: close/minimize/reopen tests pass.

---

### Task 3: Public Landing Chat Layout Polish

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for internal thread scroll and bottom-sheet behavior**

Add:

```ts
it('keeps the public Nic-Nac panel structured as a real chat window', () => {
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

  expect(css).toContain('grid-template-rows: auto auto minmax(0, 1fr) auto')
  expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-thread')
  expect(css).toContain('overflow-y: auto')
  expect(css).toContain('overscroll-behavior: contain')
  expect(css).toContain('position: sticky')
})

it('treats public Nic-Nac as a mobile bottom sheet', () => {
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

  expect(css).toContain('@media (max-width: 680px)')
  expect(css).toContain('max-height: min(85dvh')
  expect(css).toContain('border-radius: 22px 22px 0 0')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: fail because public thread currently uses visible overflow and the mobile panel is not a deliberate bottom sheet.

- [ ] **Step 3: Implement chat-window layout CSS**

Update the existing public Nic-Nac CSS:

```css
.sparkle-landing-v2 .sl2-nic-nac-panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  max-height: min(78vh, 680px);
  overflow: hidden;
}

.sparkle-landing-v2 .sl2-nic-nac-thread {
  align-content: start;
  display: grid;
  gap: 10px;
  min-height: 120px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 3px;
}

.sparkle-landing-v2 .sl2-nic-nac-form {
  background: rgba(255, 255, 255, 0.94);
  border-top: 1px solid rgba(64, 41, 36, 0.08);
  margin: 0 -18px -18px;
  padding: 14px 18px 18px;
  position: sticky;
  bottom: 0;
}

@media (max-width: 680px) {
  .sparkle-landing-v2 .sl2-nic-nac-popover {
    bottom: 0;
    left: 0;
    right: 0;
  }

  .sparkle-landing-v2 .sl2-nic-nac-panel {
    border-radius: 22px 22px 0 0;
    max-height: min(85dvh, 720px);
    max-width: none;
    width: 100%;
  }
}
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: layout tests pass.

---

### Task 4: Public Message Polish With Canonical Mark

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for assistant mark and thinking dots**

Add:

```ts
it('uses the Nic-Nac mark on public assistant messages and a richer thinking state', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

  expect(source).toContain('sl2-nic-nac-message-row--assistant')
  expect(source).toContain('NicNacMark size={22}')
  expect(source).toContain('sl2-nic-nac-thinking-dots')
  expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-message-row')
  expect(css).toContain('@keyframes sl2-nic-nac-dot-pulse')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: fail because public assistant messages are plain paragraphs without the shared mark.

- [ ] **Step 3: Update public message rendering**

Change message mapping to wrap messages in rows:

```tsx
{messages.map((message, index) => (
  <div
    className={`sl2-nic-nac-message-row sl2-nic-nac-message-row--${message.role}`}
    key={`${message.role}-${index}-${message.text}`}
  >
    {message.role === 'assistant' ? <NicNacMark size={22} /> : null}
    <p className={`sl2-nic-nac-message sl2-nic-nac-message--${message.role}`}>
      {message.text}
    </p>
  </div>
))}
```

Replace loading text with:

```tsx
<div className="sl2-nic-nac-message-row sl2-nic-nac-message-row--assistant">
  <NicNacMark size={22} />
  <p className="sl2-nic-nac-message sl2-nic-nac-message--assistant">
    <span>Nic-Nac is thinking</span>
    <span className="sl2-nic-nac-thinking-dots" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  </p>
</div>
```

- [ ] **Step 4: Style public assistant/visitor rows and dots**

Add:

```css
.sparkle-landing-v2 .sl2-nic-nac-message-row {
  align-items: flex-start;
  display: flex;
  gap: 8px;
  min-width: 0;
}

.sparkle-landing-v2 .sl2-nic-nac-message-row--visitor {
  justify-content: flex-end;
}

.sparkle-landing-v2 .sl2-nic-nac-message-row--assistant {
  justify-content: flex-start;
}

.sparkle-landing-v2 .sl2-nic-nac-message--visitor {
  max-width: min(86%, 320px);
}

.sparkle-landing-v2 .sl2-nic-nac-message--assistant {
  max-width: calc(100% - 30px);
}

.sparkle-landing-v2 .sl2-nic-nac-thinking-dots {
  display: inline-flex;
  gap: 3px;
  margin-left: 5px;
  vertical-align: middle;
}

.sparkle-landing-v2 .sl2-nic-nac-thinking-dots span {
  animation: sl2-nic-nac-dot-pulse 1.2s ease-in-out infinite;
  background: #a48882;
  border-radius: 999px;
  height: 4px;
  width: 4px;
}

.sparkle-landing-v2 .sl2-nic-nac-thinking-dots span:nth-child(2) {
  animation-delay: 0.16s;
}

.sparkle-landing-v2 .sl2-nic-nac-thinking-dots span:nth-child(3) {
  animation-delay: 0.32s;
}

@keyframes sl2-nic-nac-dot-pulse {
  0%, 60%, 100% { opacity: 0.25; transform: translateY(0); }
  30% { opacity: 1; transform: translateY(-2px); }
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: message polish tests pass.

---

### Task 5: Interaction Accessibility

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for focus and Escape behavior**

Add:

```ts
it('handles public Nic-Nac focus and keyboard closing like a chat dialog', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )

  expect(source).toContain('openerRef')
  expect(source).toContain('inputRef')
  expect(source).toContain('inputRef.current?.focus()')
  expect(source).toContain('openerRef.current?.focus()')
  expect(source).toContain('handlePanelKeyDown')
  expect(source).toContain("event.key === 'Escape'")
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: fail because public landing does not yet manage opener/input focus or Escape closing.

- [ ] **Step 3: Add focus management**

In `SparkleSuitePublicNicNac`:

```tsx
const openerRef = useRef<HTMLButtonElement | null>(null)
const inputRef = useRef<HTMLInputElement | null>(null)

useEffect(() => {
  if (!isOpen || isMinimized) {
    return
  }

  inputRef.current?.focus()
}, [isOpen, isMinimized])

useEffect(() => {
  if (isOpen) {
    return
  }

  openerRef.current?.focus()
}, [isOpen])
```

Add keyboard handler:

```tsx
function handlePanelKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== 'Escape') {
    return
  }

  event.preventDefault()
  setIsMinimized(true)
}
```

Wire refs:

```tsx
<button ref={openerRef} ...>
<div onKeyDown={handlePanelKeyDown} ...>
<input ref={inputRef} ... />
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: focus/keyboard tests pass.

---

### Task 6: Handoff Mini-Card Polish

**Files:**
- Modify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Write failing tests for “Leave this for Louis” mini-card**

Add:

```ts
it('presents public Nic-Nac handoff as a polished mini-card', () => {
  const source = readFileSync(
    join(process.cwd(), 'app', '_components', 'sparkle-suite-public-nic-nac.tsx'),
    'utf8',
  )
  const css = readFileSync(join(process.cwd(), 'app', 'globals.css'), 'utf8')

  expect(source).toContain('sl2-nic-nac-handoff__head')
  expect(source).toContain('Leave this for Louis')
  expect(css).toContain('.sparkle-landing-v2 .sl2-nic-nac-handoff')
  expect(css).toContain('background: #fff6fa')
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: fail because current handoff is a plain appended form.

- [ ] **Step 3: Add mini-card header**

Inside the handoff form:

```tsx
<div className="sl2-nic-nac-handoff__head">
  <strong>Leave this for Louis</strong>
  <p>Nic-Nac will keep this scoped to your question; nothing sends from this page yet.</p>
</div>
```

- [ ] **Step 4: Style the mini-card**

Add:

```css
.sparkle-landing-v2 .sl2-nic-nac-handoff {
  background: #fff6fa;
  border: 1px solid rgba(238, 44, 155, 0.16);
  border-radius: 16px;
  padding: 14px;
}

.sparkle-landing-v2 .sl2-nic-nac-handoff__head {
  display: grid;
  gap: 4px;
}

.sparkle-landing-v2 .sl2-nic-nac-handoff__head strong {
  color: #402924;
  font-size: 13px;
  font-weight: 900;
}

.sparkle-landing-v2 .sl2-nic-nac-handoff__head p {
  color: #775d57;
  font-size: 12px;
  line-height: 1.45;
  margin: 0;
}
```

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: handoff mini-card tests pass.

---

### Task 7: Ecosystem Inventory And Guardrail Update

**Files:**
- Modify: `docs/superpowers/specs/2026-05-31-nic-nac-surface-inventory.md`
- Test: `tests/nic-nac-surface-policy.test.ts`

- [ ] **Step 1: Update the surface inventory**

Add this under the inventory summary:

```md
## Shared Visual Identity

- Current canonical Nic-Nac mark: pink circular badge with a white `N`.
- Shared implementation: `app/_components/nic-nac-mark.tsx`.
- Workspace adapter: `app/nic-nac/components/NicNacGlyph.tsx` wraps the shared mark to preserve existing workspace imports.
- Public landing adapter: `app/_components/sparkle-suite-public-nic-nac.tsx` imports the shared mark directly.
- Future customer-site and Sparkle Finder Nic-Nac surfaces must use the shared mark and must keep surface-specific policy boundaries from `lib/nic-nac/surface-policy.ts`.
```

- [ ] **Step 2: Add a test note if surface policy coverage needs no code change**

No runtime policy change is required. Run the existing test:

```bash
npm exec vitest run tests/nic-nac-surface-policy.test.ts
```

Expected: pass.

---

### Task 8: Rendered QA And Preview Deployment

**Files:**
- Verify: `app/_components/sparkle-suite-public-nic-nac.tsx`
- Verify: `app/globals.css`
- Verify: `app/nic-nac/_client.tsx`

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-suite-public-landing.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac-shared-knowledge.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: all pass.

- [ ] **Step 2: Run requested Nic-Nac regression suites**

Run:

```bash
npm exec vitest run tests/nic-nac-shared-knowledge.test.ts tests/nic-nac-surface-policy.test.ts tests/sparkle-suite-public-nic-nac-contract.test.ts tests/sparkle-suite-public-nic-nac-route.test.ts tests/sparkle-suite-public-landing.test.ts tests/nic-nac-workspace-knowledge.test.ts
```

Expected: all pass.

Run:

```bash
npm exec vitest run tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/trade-board-tools.test.ts tests/nic-nac/trade-requests.test.ts tests/nic-nac/calendar-tools.test.ts tests/nic-nac/send-sms-notification.test.ts tests/nic-nac/send-email-notification.test.ts
```

Expected: all pass.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npx tsc --noEmit --pretty false
```

Expected: no output and exit code `0`.

- [ ] **Step 4: Confirm prohibited paths were not touched**

Run:

```bash
git diff --name-only -- chrome-extension/content.js supabase/functions/live-queue-sync docs/sparkle-suite/marketing
```

Expected: no output.

- [ ] **Step 5: Browser QA on preview or local dev**

If using local dev, start the app and test the landing route. If deploying, get explicit approval first because this repo’s guardrail forbids deploy without approval.

Check these flows:

- Landing page desktop: open public Nic-Nac, see pink `N` mark in header, visible minimize and close icon buttons.
- Landing page desktop: minimize panel, reopen from pink `N` bubble.
- Landing page desktop: ask a longer question, verify thread scrolls internally and input remains pinned.
- Landing page desktop: press `Escape`, verify panel minimizes.
- Landing page mobile: open public Nic-Nac, verify bottom-sheet layout, close/minimize controls are visible and tappable.
- Workspace desktop: verify existing right column still uses pink `N`, close/minimize still works, reopen bubble still uses the same mark.
- Workspace mobile: verify existing mobile bubble and modal still use pink `N`.

- [ ] **Step 6: Production safety**

Do not stage, commit, push, or deploy to production without explicit approval. If a preview deployment is approved, deploy preview only and report the URL.

---

## Self-Review

- Spec coverage: The plan covers the pink `N` identity rule, public landing close/minimize, mobile bottom-sheet behavior, internal thread scrolling, assistant message mark, thinking polish, handoff polish, workspace consistency, future customer-site/Finder adapter guidance, and QA.
- Placeholder scan: No `TBD`, `TODO`, or unspecified “add tests” steps remain.
- Type consistency: The shared mark is named `NicNacMark`; the workspace wrapper remains `NicNacGlyph`; public landing imports `NicNacMark`; CSS class names use the existing `sl2-nic-nac-*` namespace.
- Guardrails: The plan avoids production deployment, git staging, commits, and prohibited paths unless Louis explicitly approves those actions.
