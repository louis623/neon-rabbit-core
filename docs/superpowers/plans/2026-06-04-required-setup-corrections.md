# Required Setup Corrections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the required setup flow into a launch-ready guided setup that fixes Nic-Nac copy quality, adds real Live Queue setup with escalation, adds final preview approval UI, and removes ambiguous or educational-only handling for operational setup items.

**Architecture:** Keep the required setup state machine in `lib/self-serve/required-setup.ts`, but make the setup steps reflect real required outcomes. Use existing Nic-Nac chat, setup tools, and required-setup UI surfaces. Add small focused UI components for operational setup panels instead of overloading chat prose.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Supabase service APIs, existing Nic-Nac AI SDK route/tools, existing Amethyst customer-site preview routing.

---

## Scope And Rules

- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not send live SMS/email/provider actions.
- Keep internal terms like `skin`, `appearancePreset`, and `live_queue` where they are data-model names.
- Rep-facing setup language must use `Look`, `Live Queue`, `Trade Board`, `customer-facing website`, and `Sparkle Suite Workspace`.
- Live Queue setup is required. Do not defer it.
- If Live Queue setup cannot be completed during required setup, Nic-Nac must escalate to Louis/support through the required setup support path.

## File Map

- `lib/self-serve/required-setup.ts`  
  Owns required setup step IDs/order and state normalization.

- `lib/nic-nac/required-setup-prompt.ts`  
  Owns required setup behavioral instructions for Nic-Nac.

- `app/nic-nac/components/NicNacChatBody.tsx`  
  Renders step-specific setup UI inside chat.

- `app/nic-nac/components/RequiredSetupLookPicker.tsx`  
  Already renders customer-site Looks; may need minor copy follow-up only.

- `app/nic-nac/components/RequiredSetupLiveQueuePanel.tsx`  
  New UI panel for Live Queue setup readiness.

- `app/nic-nac/components/RequiredSetupPreviewPanel.tsx`  
  New UI panel for final preview and approval.

- `app/api/nic-nac/route.ts` or `lib/nic-nac/*message*`  
  Add assistant text normalization at the message boundary so generated chunks cannot concatenate without spaces.

- `tests/self-serve-required-setup.test.ts`  
  Step order and state-machine coverage.

- `tests/nic-nac-required-setup-prompt.test.ts`  
  Nic-Nac copy/behavior guardrails.

- `tests/nic-nac-branding.test.ts`  
  Setup UI copy and component guardrails.

- `tests/nic-nac-required-setup-client.test.ts`  
  Client wiring guardrails.

---

### Task 1: Fix Required Setup Step Contract

**Files:**
- Modify: `lib/self-serve/required-setup.ts`
- Modify: `tests/self-serve-required-setup.test.ts`
- Modify: `tests/self-serve-onboarding-checklist.test.ts` if checklist text asserts the old label

- [ ] **Step 1: Write the failing step-order test**

In `tests/self-serve-required-setup.test.ts`, update `requiredStepIds` so the operational setup is explicit:

```ts
const requiredStepIds = [
  'account_basics',
  'site_skin',
  'welcome_copy',
  'about_page',
  'show_schedule',
  'customer_site_orientation',
  'live_queue_setup',
  'email_sms_update_readiness',
  'trade_board_orientation',
  'final_preview_approval',
] as const
```

Add assertions:

```ts
expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).toContain('Live Queue setup')
expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).toContain('Email and SMS update readiness')
expect(REQUIRED_SETUP_STEPS.map((step) => step.label)).not.toContain('Live queue orientation')
```

- [ ] **Step 2: Run the test and confirm red**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts
```

Expected: FAIL because `live_queue_setup` and `email_sms_update_readiness` are not in `REQUIRED_SETUP_STEPS`.

- [ ] **Step 3: Update the required setup step list**

In `lib/self-serve/required-setup.ts`, replace the current Live Queue orientation step and add update readiness:

```ts
  {
    id: 'live_queue_setup',
    label: 'Live Queue setup',
    required: true,
  },
  {
    id: 'email_sms_update_readiness',
    label: 'Email and SMS update readiness',
    required: true,
  },
```

Keep `trade_board_orientation` after these operational steps.

- [ ] **Step 4: Run the test and confirm green**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- lib/self-serve/required-setup.ts tests/self-serve-required-setup.test.ts tests/self-serve-onboarding-checklist.test.ts
git commit -m "fix: make setup steps operational"
```

---

### Task 2: Add Required Live Queue Setup UI

**Files:**
- Create: `app/nic-nac/components/RequiredSetupLiveQueuePanel.tsx`
- Create: `app/nic-nac/components/RequiredSetupLiveQueuePanel.module.css`
- Modify: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify: `app/nic-nac/_client.tsx` only if additional rep metadata must be passed
- Modify: `tests/nic-nac-branding.test.ts`
- Modify: `tests/nic-nac-required-setup-client.test.ts`

- [ ] **Step 1: Write the failing UI test**

In `tests/nic-nac-branding.test.ts`, import the new component:

```ts
import { RequiredSetupLiveQueuePanel } from '@/app/nic-nac/components/RequiredSetupLiveQueuePanel'
```

Add:

```ts
it('renders required Live Queue setup as an operational setup panel', () => {
  const html = renderToStaticMarkup(
    createElement(RequiredSetupLiveQueuePanel, {
      extensionCode: '064632',
      onSend: () => {},
    }),
  )

  expect(html).toContain('Set up Live Queue')
  expect(html).toContain('Extension code')
  expect(html).toContain('064632')
  expect(html).toContain('Install or open the Sparkle Suite Chrome extension')
  expect(html).toContain('Enter this extension code')
  expect(html).toContain('Confirm the Party Filter')
  expect(html).toContain('Check Live Queue status')
  expect(html).toContain('I need help with Live Queue setup')
  expect(html).not.toContain('orientation')
  expect(html).not.toContain('LiveQ')
})
```

- [ ] **Step 2: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts
```

Expected: FAIL because `RequiredSetupLiveQueuePanel` does not exist.

- [ ] **Step 3: Create the Live Queue panel**

Create `app/nic-nac/components/RequiredSetupLiveQueuePanel.tsx`:

```tsx
'use client'

import styles from './RequiredSetupLiveQueuePanel.module.css'

export function RequiredSetupLiveQueuePanel({
  extensionCode,
  onSend,
  disabled = false,
}: {
  extensionCode: string
  onSend: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Live Queue setup">
      <div className={styles.header}>
        <p className={styles.kicker}>Required setup</p>
        <h2>Set up Live Queue</h2>
        <p>
          Live Queue needs to be connected before your Sparkle Suite Workspace is unlocked.
          If anything blocks setup, Nic-Nac will gather the details and notify support.
        </p>
      </div>
      <div className={styles.codeBox}>
        <span>Extension code</span>
        <strong>{extensionCode}</strong>
      </div>
      <ol className={styles.steps}>
        <li>Install or open the Sparkle Suite Chrome extension.</li>
        <li>Enter this extension code in the extension.</li>
        <li>Open your Bomb Party Party Orders page.</li>
        <li>Confirm the Party Filter for the show you want synced.</li>
        <li>Check Live Queue status before moving on.</li>
      </ol>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onSend('I connected Live Queue and confirmed it is syncing.')}
          disabled={disabled}
        >
          Live Queue is connected
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() => onSend('I need help with Live Queue setup. Please notify support.')}
          disabled={disabled}
        >
          I need help with Live Queue setup
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Add CSS**

Create `app/nic-nac/components/RequiredSetupLiveQueuePanel.module.css` using the same shell style as `RequiredSetupLookPicker.module.css`: warm paper background, 8px radius, `#402924`, `#ee2c9b`, and button text `#fff6fb`.

- [ ] **Step 5: Wire panel into chat**

In `app/nic-nac/components/NicNacChatBody.tsx`, import and render:

```tsx
import { RequiredSetupLiveQueuePanel } from './RequiredSetupLiveQueuePanel'
```

Add:

```ts
const showLiveQueuePanel =
  chatMode === 'required_setup' && requiredSetupStep === 'live_queue_setup'
```

Render inside `ChatHistory`:

```tsx
{showLiveQueuePanel ? (
  <RequiredSetupLiveQueuePanel
    extensionCode="Waiting for code"
    onSend={handleLookChoice}
    disabled={isStreaming || hasPendingApproval}
  />
) : null}
```

If the real extension code is available from existing rep context in `app/nic-nac/_client.tsx`, pass it instead of `"Waiting for code"`. If it is not available yet, add a follow-up task to expose it from `/api/self-serve/setup-state` or `/api/nic-nac/me` before claiming this complete.

- [ ] **Step 6: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-client.test.ts
```

Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add -- app/nic-nac/components/NicNacChatBody.tsx app/nic-nac/components/RequiredSetupLiveQueuePanel.tsx app/nic-nac/components/RequiredSetupLiveQueuePanel.module.css tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-client.test.ts
git commit -m "feat: add required Live Queue setup panel"
```

---

### Task 3: Make Live Queue Failure Escalate To Support

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify: `tests/nic-nac-required-setup-prompt.test.ts`
- Inspect/modify if needed: existing required setup tool definitions for `request_required_setup_support`

- [ ] **Step 1: Write failing prompt test**

In `tests/nic-nac-required-setup-prompt.test.ts`, add:

```ts
it('requires support escalation when Live Queue setup is blocked', () => {
  const prompt = buildRequiredSetupPrompt()

  expect(prompt).toContain('Live Queue setup')
  expect(prompt).toContain('Live Queue is not optional')
  expect(prompt).toContain('If Live Queue setup is blocked')
  expect(prompt).toContain('request_required_setup_support')
  expect(prompt).toContain('notify Louis or support')
  expect(prompt).not.toContain('come back later')
  expect(prompt).not.toContain('before your first live show')
  expect(prompt).not.toContain('Live Queue orientation')
})
```

- [ ] **Step 2: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: FAIL because Live Queue is still framed as orientation.

- [ ] **Step 3: Update required setup prompt**

Replace step 7 in `lib/nic-nac/required-setup-prompt.ts` with:

```text
7. Live Queue setup:
   - Live Queue is not optional. Do not treat it as education-only.
   - Guide the rep through extension code, Chrome extension status, Bomb Party Party Orders page, Party Filter, and Live Queue status.
   - If Live Queue setup is blocked, gather what the rep sees, call request_required_setup_support, and notify Louis or support when the tool confirms delivery.
   - Do not tell the rep to come back later or remember to do this before their first live show.
```

- [ ] **Step 4: Run and confirm green**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- lib/nic-nac/required-setup-prompt.ts tests/nic-nac-required-setup-prompt.test.ts
git commit -m "fix: require Live Queue setup escalation"
```

---

### Task 4: Add Email/SMS Update Readiness Setup

**Files:**
- Create: `app/nic-nac/components/RequiredSetupUpdatesPanel.tsx`
- Create: `app/nic-nac/components/RequiredSetupUpdatesPanel.module.css`
- Modify: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify: `tests/nic-nac-branding.test.ts`
- Modify: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Write failing UI and prompt tests**

In `tests/nic-nac-branding.test.ts`:

```ts
import { RequiredSetupUpdatesPanel } from '@/app/nic-nac/components/RequiredSetupUpdatesPanel'

it('renders email and SMS update readiness as a setup check', () => {
  const html = renderToStaticMarkup(
    createElement(RequiredSetupUpdatesPanel, {
      onSend: () => {},
    }),
  )

  expect(html).toContain('Email and SMS update readiness')
  expect(html).toContain('Checkout does not text or email customers automatically')
  expect(html).toContain('Review how customers opt in')
  expect(html).toContain('Confirm update readiness')
  expect(html).toContain('I need help with update setup')
})
```

In `tests/nic-nac-required-setup-prompt.test.ts`:

```ts
expect(prompt).toContain('Email and SMS update readiness')
expect(prompt).toContain('Do not send live customer messages during required setup')
expect(prompt).toContain('confirm the rep understands opt-in and update readiness')
```

- [ ] **Step 2: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts
```

Expected: FAIL because the updates panel and prompt language do not exist.

- [ ] **Step 3: Implement updates panel**

Create a component that explains:

- checkout does not automatically message customers
- customers must opt in
- the rep can use email/SMS updates after setup
- Nic-Nac can help prepare updates later
- no live sends happen in required setup

The primary button should send:

```ts
'I understand email and SMS update readiness. No live customer messages should be sent during setup.'
```

The support button should send:

```ts
'I need help with email and SMS update setup. Please notify support.'
```

- [ ] **Step 4: Wire it into chat**

Render the panel when:

```ts
requiredSetupStep === 'email_sms_update_readiness'
```

- [ ] **Step 5: Run and confirm green**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- app/nic-nac/components/NicNacChatBody.tsx app/nic-nac/components/RequiredSetupUpdatesPanel.tsx app/nic-nac/components/RequiredSetupUpdatesPanel.module.css lib/nic-nac/required-setup-prompt.ts tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts
git commit -m "feat: add update readiness setup step"
```

---

### Task 5: Add Final Preview And Approval UI

**Files:**
- Create: `app/nic-nac/components/RequiredSetupPreviewPanel.tsx`
- Create: `app/nic-nac/components/RequiredSetupPreviewPanel.module.css`
- Modify: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify: `app/nic-nac/_client.tsx` if preview URL must be passed from state/context
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify: `tests/nic-nac-branding.test.ts`
- Modify: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Write failing UI test**

In `tests/nic-nac-branding.test.ts`:

```ts
import { RequiredSetupPreviewPanel } from '@/app/nic-nac/components/RequiredSetupPreviewPanel'

it('renders final preview approval with an exact customer-facing website link', () => {
  const html = renderToStaticMarkup(
    createElement(RequiredSetupPreviewPanel, {
      previewHref: '/amethyst/Homepage.html?c=rep-1',
      onApprove: () => {},
    }),
  )

  expect(html).toContain('Preview your customer-facing website')
  expect(html).toContain('href="/amethyst/Homepage.html?c=rep-1"')
  expect(html).toContain('Open preview')
  expect(html).toContain('Approve preview and unlock workspace')
  expect(html).not.toContain('look around the edges')
  expect(html).not.toContain('dashboard')
})
```

- [ ] **Step 2: Write failing prompt test**

In `tests/nic-nac-required-setup-prompt.test.ts`:

```ts
expect(prompt).toContain('Do not guess where the preview link is')
expect(prompt).toContain('The app shows the preview approval panel automatically')
expect(prompt).toContain('Approve preview and unlock workspace')
expect(prompt).not.toContain('look for a preview link')
expect(prompt).not.toContain('somewhere on this page')
```

- [ ] **Step 3: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts
```

Expected: FAIL.

- [ ] **Step 4: Implement preview panel**

Create `RequiredSetupPreviewPanel.tsx`:

```tsx
'use client'

import styles from './RequiredSetupPreviewPanel.module.css'

export function RequiredSetupPreviewPanel({
  previewHref,
  onApprove,
  disabled = false,
}: {
  previewHref: string
  onApprove: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Final customer-facing website preview">
      <p className={styles.kicker}>Final review</p>
      <h2>Preview your customer-facing website</h2>
      <p>Open your preview, review the Look, welcome copy, About section, schedule, and links, then approve it here.</p>
      <a className={styles.previewLink} href={previewHref} target="_blank" rel="noreferrer">
        Open preview
      </a>
      <button
        type="button"
        onClick={() => onApprove('I approve the customer-facing website preview. Unlock my Sparkle Suite Workspace.')}
        disabled={disabled}
      >
        Approve preview and unlock workspace
      </button>
    </section>
  )
}
```

- [ ] **Step 5: Wire preview URL**

Use the same route logic as the unlocked workspace customer site link. If reusable helper exists, use it. If not, extract `buildCustomerSparkleSiteHref` from `DashboardPlaceholder.tsx` into a small shared client-safe helper and test it.

- [ ] **Step 6: Update prompt**

Final preview step must say:

```text
The app shows the preview approval panel automatically. Do not guess where the preview link is, do not mention the dashboard, and do not unlock until the rep clicks or clearly approves the preview.
```

- [ ] **Step 7: Run and confirm green**

Run:

```powershell
npm exec vitest run tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-client.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add -- app/nic-nac/components/NicNacChatBody.tsx app/nic-nac/components/RequiredSetupPreviewPanel.tsx app/nic-nac/components/RequiredSetupPreviewPanel.module.css app/nic-nac/_client.tsx lib/nic-nac/required-setup-prompt.ts tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-prompt.test.ts
git commit -m "feat: add required setup preview approval"
```

---

### Task 6: Normalize Nic-Nac Message Spacing

**Files:**
- Create or modify: `lib/nic-nac/message-normalize.ts`
- Modify: `app/api/nic-nac/route.ts`
- Test: `tests/nic-nac-message-normalize.test.ts`

- [ ] **Step 1: Write failing normalization tests**

Create `tests/nic-nac-message-normalize.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { normalizeNicNacAssistantText } from '@/lib/nic-nac/message-normalize'

describe('normalizeNicNacAssistantText', () => {
  it('adds missing spaces after sentence punctuation between generated chunks', () => {
    expect(normalizeNicNacAssistantText('Perfect.Now let\\'s build your About page.')).toBe(
      "Perfect. Now let's build your About page.",
    )
    expect(normalizeNicNacAssistantText('options:Here are your About page options:')).toBe(
      'options: Here are your About page options:',
    )
  })

  it('does not corrupt urls or email addresses', () => {
    expect(
      normalizeNicNacAssistantText('Open https://bombparty.com/Lindseychapman/parties.Thanks.'),
    ).toBe('Open https://bombparty.com/Lindseychapman/parties. Thanks.')
    expect(normalizeNicNacAssistantText('Email janetest@gmail.com.Got it.')).toBe(
      'Email janetest@gmail.com. Got it.',
    )
  })
})
```

- [ ] **Step 2: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-message-normalize.test.ts
```

Expected: FAIL because the helper does not exist.

- [ ] **Step 3: Implement helper**

Create `lib/nic-nac/message-normalize.ts`:

```ts
export function normalizeNicNacAssistantText(value: string) {
  return value
    .replace(/([.!?])(?=[A-Z])/g, '$1 ')
    .replace(/(:)(?=[A-Z])/g, '$1 ')
    .replace(/\\s{3,}/g, '  ')
}
```

- [ ] **Step 4: Wire at the assistant message boundary**

In `app/api/nic-nac/route.ts`, apply `normalizeNicNacAssistantText` to final assistant text before persisting/sending complete assistant messages. Do not apply it to user messages, URLs alone, tool JSON, or markdown structures.

- [ ] **Step 5: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-message-normalize.test.ts tests/nic-nac\\abort-modes.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add -- lib/nic-nac/message-normalize.ts app/api/nic-nac/route.ts tests/nic-nac-message-normalize.test.ts
git commit -m "fix: normalize Nic-Nac response spacing"
```

---

### Task 7: Tighten Nic-Nac Setup Voice

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Write failing voice guardrail test**

Add:

```ts
it('keeps setup voice concise and avoids repetitive filler', () => {
  const prompt = buildRequiredSetupPrompt()

  expect(prompt).toContain('Do not overuse Perfect')
  expect(prompt).toContain('Use short confirmations like Got it, Thanks, That is saved, or We will use that')
  expect(prompt).toContain('Do not amplify hype claims')
  expect(prompt).toContain('Use customer-facing website, Sparkle Suite Workspace, Live Queue, Trade Board, and Look')
  expect(prompt).not.toContain('LiveQ')
  expect(prompt).not.toContain('TradeBoard')
})
```

- [ ] **Step 2: Run and confirm red**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: FAIL.

- [ ] **Step 3: Update prompt**

Add a `Voice and terminology` block:

```text
Voice and terminology:
- Do not overuse Perfect. Use short confirmations like Got it, Thanks, That is saved, or We will use that.
- Do not amplify hype claims. If the rep gives ambitious wording, polish it into warm, confident customer-facing copy without promising outcomes.
- Use customer-facing website, Sparkle Suite Workspace, Live Queue, Trade Board, and Look.
- Do not use LiveQ, TradeBoard, customer site, setup checklist, dashboard card grid, or vague workspace guesses during required setup.
```

- [ ] **Step 4: Run and confirm green**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add -- lib/nic-nac/required-setup-prompt.ts tests/nic-nac-required-setup-prompt.test.ts
git commit -m "fix: tighten Nic-Nac setup voice"
```

---

### Task 8: Full Verification And Preview Deploy

**Files:**
- No new files expected

- [ ] **Step 1: Run focused setup suite**

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-message-normalize.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run production build**

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 3: Check unrelated dirty files remain unstaged**

```powershell
git status --short
```

Expected: only intentional files staged/committed; do not stage `app/nic-nac/_shell.module.css` or `vault/session-log.md` unless Louis explicitly asks.

- [ ] **Step 4: Push branch**

```powershell
git push origin codex/sparkle-cross-phase-hardening
```

Expected: branch pushes successfully.

- [ ] **Step 5: Verify Vercel preview**

```powershell
$sha = git rev-parse HEAD
npx vercel ls sparkle-suite --meta githubCommitSha=$sha
npx vercel inspect sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app
```

Expected: deployment is Ready and the stable preview alias points to that deployment.

---

## Self-Review

- Spec coverage: Covers final preview gap, Live Queue required setup, support escalation, email/SMS readiness, text spacing, terminology, repetitive confirmations, and hype-polish concerns.
- Placeholder scan: Clean; the plan does not use banned placeholder language or unspecified testing steps.
- Type consistency: New setup IDs are `live_queue_setup` and `email_sms_update_readiness` throughout the plan. Existing `site_skin` remains internal but rep-facing language stays `Look`.
