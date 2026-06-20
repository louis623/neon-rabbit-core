# Sparkle Suite Live Trade Request Alerts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make incoming trade requests visible and actionable during a live show by moving the Request inbox above the Board overview and adding a live Nic-Nac trade request card without sound notifications.

**Architecture:** Reuse the current trade request service, dashboard polling, Nic-Nac persisted notification, and Nic-Nac message refresh loop. The UI change is intentionally calm: three visual surfaces show the request, and the rep can approve or deny from the Request inbox or Nic-Nac card. V1 rule check remains truthful by showing the requested piece's collection/type rule target because the customer offer is currently free text.

**Tech Stack:** Next.js App Router, React client components, AI SDK `UIMessage`, Supabase-backed trade request services, Vitest, Testing Library-style static contract tests already used in this repo.

---

## Scope Rules

- Work from `C:\Users\louis\sparkle-suite-repo`, not the binder folder.
- Do not touch Chrome Web Store settings.
- Do not modify Sparkle Suite Chrome extension code or live queue extension files.
- Do not add sound, autoplay audio, browser notifications, or live-show extension alerts.
- Do not rerun onboarding, start checkout, deploy, commit, or push unless Louis explicitly asks during execution.
- Keep Nic-Nac useful and secondary: the Trade Board remains the main workspace surface.

## Current Behavior To Preserve

- Public customer requests enter through `app/api/amethyst/trade-requests/route.ts`.
- `submitTradeRequest` creates the pending request and listing state changes in `lib/services/trade-requests.ts`.
- `notifyRepOfTradeRequest` writes a Nic-Nac assistant message in `lib/nic-nac/trade-request-notifications.ts`.
- The workspace fetches pending requests from `app/api/nic-nac/trade-requests/route.ts`.
- The dashboard already polls trade workspace state every 45 seconds while the Trade Board section is active.
- `NicNacChatBody` already polls persisted conversation messages every 45 seconds and merges server messages through `mergeServerMessages`.

## File Structure

- Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
  - Move the Request inbox panel above the Board overview panel.
  - Display request details in a faster live-show shape.
  - Keep existing approve/deny handlers and state refresh behavior.

- Modify `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\trade-request-notifications.ts`
  - Add a structured custom message part alongside the existing text fallback.
  - Keep `message_id: trade-request-{requestId}` for idempotency.

- Modify `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
  - Render the custom trade request card inside assistant messages.
  - Make the card refresh conversation + trade workspace after approve/deny.
  - Keep approval irreversible behavior aligned with existing route semantics.

- Create `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\TradeRequestLiveCard.tsx`
  - Focused presentational/action component for the Nic-Nac live trade card.
  - No sound or browser notification code.

- Create `C:\Users\louis\sparkle-suite-repo\lib\nic-nac/trade-request-card-parts.ts`
  - Shared type guard and builder for the custom card part.

- Modify tests:
  - `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\trade-request-notifications.test.ts`
  - `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-client-message-refresh.test.ts`
  - `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`
  - Add `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-trade-request-live-card.test.tsx` if component test tooling is already available. If TSX component testing is not configured, extend the static UI contract test instead.

---

### Task 1: Add A Shared Trade Request Card Part Contract

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\trade-request-card-parts.ts`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac\trade-request-notifications.test.ts`

- [ ] **Step 1: Write the failing contract test**

Add assertions to `tests/nic-nac/trade-request-notifications.test.ts` that the notification insert includes both a text fallback and a structured card part.

```ts
expect(upsertMock).toHaveBeenCalledWith(
  expect.objectContaining({
    message_id: 'trade-request-req-1',
    role: 'assistant',
    parts: expect.arrayContaining([
      expect.objectContaining({
        type: 'text',
        text: expect.stringContaining('New trade request from Morgan'),
      }),
      expect.objectContaining({
        type: 'data-trade-request-card',
        data: expect.objectContaining({
          requestId: 'req-1',
          customerName: 'Morgan',
          requestedItem: expect.objectContaining({
            itemNumber: 'RG100',
            designName: 'Rose Glow',
          }),
          offeredText: 'RG095, same collection ring',
          ruleCheck: expect.objectContaining({
            status: 'needs_review',
            label: 'Compare against RG / Rose Garden',
          }),
        }),
      }),
    ]),
  }),
  { onConflict: 'conversation_id,message_id', ignoreDuplicates: true },
)
```

- [ ] **Step 2: Run the failing test**

Run from `C:\Users\louis\sparkle-suite-repo`:

```powershell
npm exec vitest run tests/nic-nac/trade-request-notifications.test.ts
```

Expected: fail because the structured card part does not exist yet.

- [ ] **Step 3: Create the card part helper**

Create `lib/nic-nac/trade-request-card-parts.ts`:

```ts
import type { TradeRequestNotificationSummary } from '@/lib/services/types'

export type TradeRequestCardPart = {
  type: 'data-trade-request-card'
  data: {
    requestId: string
    customerName: string
    requestedItem: {
      itemNumber: string
      designName: string
      typePrefix: string
      collectionName: string | null
      bpMsrp: number | null
    }
    offeredText: string
    ruleCheck: {
      status: 'needs_review'
      label: string
      description: string
    }
  }
}

export function buildTradeRequestCardPart(
  summary: TradeRequestNotificationSummary,
): TradeRequestCardPart {
  const collectionName = summary.listing.collectionName ?? null
  const ruleTarget = collectionName
    ? `${summary.listing.typePrefix} / ${collectionName}`
    : summary.listing.typePrefix

  return {
    type: 'data-trade-request-card',
    data: {
      requestId: summary.requestId,
      customerName: summary.customerName,
      requestedItem: {
        itemNumber: summary.listing.itemNumber,
        designName: summary.listing.designName,
        typePrefix: summary.listing.typePrefix,
        collectionName,
        bpMsrp: summary.listing.bpMsrp ?? null,
      },
      offeredText: summary.customerDescription,
      ruleCheck: {
        status: 'needs_review',
        label: `Compare against ${ruleTarget}`,
        description:
          'Customer offers are free text right now, so the rep should confirm same type and collection before approving.',
      },
    },
  }
}

export function isTradeRequestCardPart(
  part: unknown,
): part is TradeRequestCardPart {
  if (!part || typeof part !== 'object') return false
  const candidate = part as { type?: unknown; data?: unknown }
  if (candidate.type !== 'data-trade-request-card') return false
  if (!candidate.data || typeof candidate.data !== 'object') return false
  const data = candidate.data as { requestId?: unknown; customerName?: unknown }
  return typeof data.requestId === 'string' && typeof data.customerName === 'string'
}
```

- [ ] **Step 4: Use the helper in notification persistence**

Modify `lib/nic-nac/trade-request-notifications.ts`:

```ts
import { buildTradeRequestCardPart } from '@/lib/nic-nac/trade-request-card-parts'
```

Change the inserted `parts` array:

```ts
parts: [
  {
    type: 'text',
    text: buildTradeRequestNotificationText(summary),
  },
  buildTradeRequestCardPart(summary),
],
```

- [ ] **Step 5: Run the notification test**

```powershell
npm exec vitest run tests/nic-nac/trade-request-notifications.test.ts
```

Expected: pass.

---

### Task 2: Move Request Inbox Above Board Overview

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Write the failing UI order test**

Add a static contract assertion that `Request inbox` appears before `Board overview` in `TradeBoardWorkspaceCard`.

```ts
const source = readFileSync(
  path.join(process.cwd(), 'app/nic-nac/components/DashboardPlaceholder.tsx'),
  'utf8',
)

const tradeBoardCardStart = source.indexOf('function TradeBoardWorkspaceCard')
const requestInboxIndex = source.indexOf('Request inbox', tradeBoardCardStart)
const boardOverviewIndex = source.indexOf('Board overview', tradeBoardCardStart)

expect(requestInboxIndex).toBeGreaterThan(tradeBoardCardStart)
expect(boardOverviewIndex).toBeGreaterThan(tradeBoardCardStart)
expect(requestInboxIndex).toBeLessThan(boardOverviewIndex)
```

- [ ] **Step 2: Run the failing test**

```powershell
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: fail because `Board overview` currently appears first.

- [ ] **Step 3: Move the request inbox panel**

In `TradeBoardWorkspaceCard`, move the `<div className={styles.workspacePanel}>` block whose title is `Request inbox` so it renders immediately after the intro card and before the board overview panel. Keep the same `requests.map`, `onApproveRequest`, `onRejectRequest`, and `actionState.pendingKey` code.

- [ ] **Step 4: Improve the request row content**

In the request row, keep the existing text and add a compact rule line:

```tsx
<div className={styles.helperNote}>
  Rule check: compare against{' '}
  {request.listing.design.collectionName
    ? `${request.listing.design.typePrefix} / ${request.listing.design.collectionName}`
    : request.listing.design.typePrefix}
</div>
```

If the request type shape exposes `collection?.name` instead of `collectionName`, use the actual existing shape from `TradeRequestWithListing` in `lib/services/types.ts`. Do not create a fake pass/fail check from the free-text offer.

- [ ] **Step 5: Run the UI order test**

```powershell
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: pass.

---

### Task 3: Render A Nic-Nac Live Trade Request Card

**Files:**
- Create: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\TradeRequestLiveCard.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-trade-request-live-card.test.tsx`

- [ ] **Step 1: Write the component behavior test**

If TSX component testing is configured, add:

```tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { TradeRequestLiveCard } from '@/app/nic-nac/components/TradeRequestLiveCard'

describe('TradeRequestLiveCard', () => {
  it('shows requested item, offered item, rule check, and actions', async () => {
    const onDecision = vi.fn()

    render(
      <TradeRequestLiveCard
        request={{
          requestId: 'req-1',
          customerName: 'Morgan',
          requestedItem: {
            itemNumber: 'RG100',
            designName: 'Rose Glow',
            typePrefix: 'RG',
            collectionName: 'Rose Garden',
            bpMsrp: 39.95,
          },
          offeredText: 'RG095, same collection ring',
          ruleCheck: {
            status: 'needs_review',
            label: 'Compare against RG / Rose Garden',
            description:
              'Customer offers are free text right now, so the rep should confirm same type and collection before approving.',
          },
        }}
        pendingAction={null}
        onDecision={onDecision}
      />,
    )

    expect(screen.getByText('New trade request')).toBeInTheDocument()
    expect(screen.getByText('Morgan')).toBeInTheDocument()
    expect(screen.getByText('RG100 - Rose Glow')).toBeInTheDocument()
    expect(screen.getByText('RG095, same collection ring')).toBeInTheDocument()
    expect(screen.getByText('Compare against RG / Rose Garden')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Deny' }))
    expect(onDecision).toHaveBeenCalledWith('reject', 'req-1')
  })
})
```

- [ ] **Step 2: Run the failing component test**

```powershell
npm exec vitest run tests/nic-nac-trade-request-live-card.test.tsx
```

Expected: fail because `TradeRequestLiveCard` does not exist.

- [ ] **Step 3: Create the live card component**

Create `app/nic-nac/components/TradeRequestLiveCard.tsx`:

```tsx
'use client'

import styles from '@/app/nic-nac/NicNac.module.css'
import type { TradeRequestCardPart } from '@/lib/nic-nac/trade-request-card-parts'

type TradeDecision = 'approve' | 'reject'

export function TradeRequestLiveCard({
  request,
  pendingAction,
  onDecision,
}: {
  request: TradeRequestCardPart['data']
  pendingAction: TradeDecision | null
  onDecision: (decision: TradeDecision, requestId: string) => void
}) {
  return (
    <div className={styles.tradeRequestLiveCard}>
      <div className={styles.tradeRequestLiveHeader}>
        <span className={styles.statusBadgeWarning}>New trade request</span>
        <strong>{request.customerName}</strong>
      </div>

      <dl className={styles.tradeRequestLiveDetails}>
        <div>
          <dt>Requested</dt>
          <dd>
            {request.requestedItem.itemNumber} - {request.requestedItem.designName}
          </dd>
        </div>
        <div>
          <dt>Offered</dt>
          <dd>{request.offeredText}</dd>
        </div>
        <div>
          <dt>Rule check</dt>
          <dd>{request.ruleCheck.label}</dd>
        </div>
      </dl>

      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionButton}
          disabled={pendingAction !== null}
          onClick={() => onDecision('approve', request.requestId)}
        >
          {pendingAction === 'approve' ? 'Approving...' : 'Approve'}
        </button>
        <button
          type="button"
          className={styles.helperButton}
          disabled={pendingAction !== null}
          onClick={() => onDecision('reject', request.requestId)}
        >
          {pendingAction === 'reject' ? 'Denying...' : 'Deny'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Add minimal CSS**

Modify `app/nic-nac/NicNac.module.css` with compact card styles that match existing workspace panels and do not use animation or audio:

```css
.tradeRequestLiveCard {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid rgba(238, 44, 155, 0.34);
  border-radius: 16px;
  background: rgba(255, 246, 250, 0.92);
}

.tradeRequestLiveHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tradeRequestLiveDetails {
  display: grid;
  gap: 8px;
  margin: 0;
}

.tradeRequestLiveDetails div {
  display: grid;
  gap: 2px;
}

.tradeRequestLiveDetails dt {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--muted);
}

.tradeRequestLiveDetails dd {
  margin: 0;
  color: var(--ink);
}
```

If the CSS file uses different custom property names than `--muted` and `--ink`, use the exact existing variables already present in `NicNac.module.css`.

- [ ] **Step 5: Render the custom part inside assistant messages**

In `NicNacChatBody.tsx`, import:

```ts
import { TradeRequestLiveCard } from './TradeRequestLiveCard'
import { isTradeRequestCardPart } from '@/lib/nic-nac/trade-request-card-parts'
```

Inside `AssistantMessage`, render the card part:

```tsx
{message.parts?.map((part, partIndex) => {
  if (isTradeRequestCardPart(part)) {
    return (
      <TradeRequestLiveCard
        key={`${message.id}-trade-card-${partIndex}`}
        request={part.data}
        pendingAction={pendingTradeDecision?.requestId === part.data.requestId
          ? pendingTradeDecision.action
          : null}
        onDecision={onTradeRequestDecision}
      />
    )
  }

  return renderExistingAssistantPart(part, partIndex)
})}
```

Use the actual existing assistant part rendering shape in `AssistantMessage`; do not introduce a second loop that drops text, tool, or approval parts.

- [ ] **Step 6: Run the component test**

```powershell
npm exec vitest run tests/nic-nac-trade-request-live-card.test.tsx
```

Expected: pass.

---

### Task 4: Wire Card Actions To Existing Trade Request Route

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\workspace-refresh-events.ts` only if a new event helper is needed.
- Test: `C:\Users\louis\sparkle-suite-repo\tests\nic-nac-client-message-refresh.test.ts`

- [ ] **Step 1: Write a refresh event test**

Extend the client refresh test to assert that a newly merged trade request card does not dispatch mutation refresh by itself, but a completed approve/reject card action does dispatch `NIC_NAC_WORKSPACE_REFRESH_EVENT` with `{ topic: 'trade' }`.

```ts
expect(dispatchEventSpy).toHaveBeenCalledWith(
  expect.objectContaining({
    type: 'nic-nac-workspace-refresh',
  }),
)
```

Use the exact exported event name from `lib/nic-nac/workspace-refresh-events.ts`.

- [ ] **Step 2: Run the failing test**

```powershell
npm exec vitest run tests/nic-nac-client-message-refresh.test.ts
```

Expected: fail until the card action handler dispatches the refresh event.

- [ ] **Step 3: Add the decision handler**

In `NicNacChatBody.tsx`, add local state and a handler near the existing chat callbacks:

```tsx
const [pendingTradeDecision, setPendingTradeDecision] = useState<{
  requestId: string
  action: 'approve' | 'reject'
} | null>(null)

const handleTradeRequestDecision = useCallback(
  async (action: 'approve' | 'reject', requestId: string) => {
    setPendingTradeDecision({ requestId, action })

    try {
      const response = await fetch('/api/nic-nac/trade-requests', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action, requestId }),
      })

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null

      if (!response.ok) {
        throw new Error(payload?.error || 'Unable to update that trade request.')
      }

      window.dispatchEvent(
        new CustomEvent(NIC_NAC_WORKSPACE_REFRESH_EVENT, {
          detail: { topic: 'trade' },
        }),
      )
      await refreshConversationMessages()
    } catch (error) {
      console.error('[nic-nac] Trade request card action failed:', error)
    } finally {
      setPendingTradeDecision(null)
    }
  },
  [refreshConversationMessages],
)
```

If the route expects `action: 'approve' | 'reject'`, keep those exact strings. If it expects `approve_trade` or `reject_trade`, update the handler to match the existing route body schema from `app/api/nic-nac/trade-requests/route.ts`.

- [ ] **Step 4: Pass the handler into `AssistantMessage`**

Add props to `AssistantMessage`:

```tsx
onTradeRequestDecision={handleTradeRequestDecision}
pendingTradeDecision={pendingTradeDecision}
```

Update the `AssistantMessage` prop type accordingly.

- [ ] **Step 5: Run route and client tests**

```powershell
npm exec vitest run tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-client-message-refresh.test.ts
```

Expected: pass.

---

### Task 5: Tighten Live Refresh Cadence For Requests Without Adding Noise

**Files:**
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\DashboardPlaceholder.tsx`
- Modify: `C:\Users\louis\sparkle-suite-repo\app\nic-nac\components\NicNacChatBody.tsx`
- Test: `C:\Users\louis\sparkle-suite-repo\tests\reviewer-smoke-ui.test.ts`

- [ ] **Step 1: Add static assertions for no audio or browser notification**

Add a test that scans the changed Nic-Nac files:

```ts
const files = [
  'app/nic-nac/components/DashboardPlaceholder.tsx',
  'app/nic-nac/components/NicNacChatBody.tsx',
  'app/nic-nac/components/TradeRequestLiveCard.tsx',
]

for (const file of files) {
  const source = readFileSync(path.join(process.cwd(), file), 'utf8')
  expect(source).not.toContain('new Audio(')
  expect(source).not.toContain('HTMLAudioElement')
  expect(source).not.toContain('Notification.requestPermission')
  expect(source).not.toContain('new Notification(')
}
```

- [ ] **Step 2: Lower active Trade Board and Nic-Nac message polling to 15 seconds**

In `DashboardPlaceholder.tsx`, change the trade workspace interval constant from 45 seconds to 15 seconds only while the Trade Board section is active.

```ts
const TRADE_WORKSPACE_REFRESH_MS = 15_000
```

In `NicNacChatBody.tsx`, change the conversation refresh interval from `45_000` to `15_000`. Keep the existing guards:

```ts
if (document.visibilityState === 'hidden') return
if (hasPendingApproval) return
```

- [ ] **Step 3: Run the no-audio/no-notification test**

```powershell
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: pass.

---

### Task 6: Final Verification Pass

**Files:**
- No additional source files.

- [ ] **Step 1: Run focused tests**

```powershell
npm exec vitest run tests/nic-nac/trade-request-notifications.test.ts tests/nic-nac-trade-requests-route.test.ts tests/nic-nac-client-message-refresh.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected: all listed tests pass.

- [ ] **Step 2: Run typecheck if the workbench can write its build info**

```powershell
npx tsc --noEmit --pretty false
```

Expected: no new type errors from the changed files. If unrelated existing test type errors appear, record the exact files and verify the changed files are clean.

- [ ] **Step 3: Run local visual review only after Louis asks for implementation**

Start the local dev server from `C:\Users\louis\sparkle-suite-repo` only during execution:

```powershell
npm run dev -- --port 3001
```

Open:

```text
http://localhost:3001/nic-nac?conversationId=45764110-0330-4a5d-964b-5b5ff49fb662
```

Expected visual result:

- Trade Board intro remains first.
- Request inbox appears above Board overview.
- Empty state says `No pending trade requests right now.` when no requests exist.
- When a test request exists, the request row shows customer, requested item, offered text, rule check, Approve, and Deny.
- Nic-Nac shows a live trade request card after the persisted notification merges into the current conversation.
- No sound plays.
- No browser notification prompt appears.

---

## Acceptance Criteria

- The rep has three visual surfaces for a pending trade request: Board overview count, Request inbox, and Nic-Nac live card.
- Request inbox is above Board overview.
- Nic-Nac card includes customer name, requested item, offered text, and a truthful rule-check prompt.
- Approve and Deny from the Nic-Nac card call the existing paid workspace trade request route.
- Approve remains irreversible and uses existing backend behavior; Deny remains reversible.
- After approve or deny, the workspace refreshes without a manual page reload.
- No audio, browser notification permission prompt, Chrome extension alert, or live queue extension change is introduced.
- Tests cover notification payload, UI order, card rendering, route action integration, and no-audio/no-browser-notification guardrails.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-05-sparkle-suite-live-trade-request-alerts.md`.

Two execution options:

1. **Subagent-Driven (recommended)** - Dispatch a fresh subagent per task, review between tasks, fastest clean iteration.
2. **Inline Execution** - Execute tasks in this session using executing-plans, with checkpoints after each task.

