# Required Setup Smoke Hardening Followup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Smooth and harden the Sparkle Suite landing-to-working-account required setup flow based on the June 4 full smoke audit, excluding the checkout path that Louis wants to retest separately.

**Architecture:** Keep this as app-side Nic-Nac required setup hardening. Do not modify Chrome extension code, Chrome Web Store settings, or live-show systems. Use tests first for prompt/tool/state behavior, then verify with focused browser smoke against the stable preview.

**Tech Stack:** Next.js App Router, React, Vercel AI SDK tools, Supabase, Vitest, Playwright for audit-only browser verification.

---

## Scope

### Include
- Final preview approval/unlock failure.
- Required setup support escalation failure and grammar spacing around failures.
- Reviewer smoke reset/full-flow testing reliability, except checkout completion.
- Live Queue completion guard so vague replies cannot advance setup.
- Account basics confirmation behavior.
- Setup rail/customer wording cleanup: `Site skin`, `public site`, `Live queue`, `dancefloor/trade board`.
- Welcome copy seeded headline behavior.
- About page choice generation and preservation.
- Trade Board orientation, including stronger light box explanation.
- Tone cleanup for repeated `Perfect`.

### Exclude
- Checkout item 14 from the smoke audit: fresh email signup reached Stripe Checkout and Louis will smoke test checkout again later.
- Chrome extension code, Chrome Web Store settings, extension package files, or production live-show operations.

## File Map

- `lib/self-serve/required-setup.ts`: Required setup state, completion guards, step labels, unlock behavior.
- `lib/nic-nac/required-setup-prompt.ts`: Nic-Nac required setup instructions and voice/wording.
- `lib/nic-nac/tools/unlock-required-setup.ts`: Tool schema and behavior for final unlock.
- `lib/nic-nac/tools/request-required-setup-support.ts`: Support escalation behavior and returned failure state.
- `lib/nic-nac/tools/save-required-setup-answer.ts`: Step schema and completion semantics.
- `app/nic-nac/components/NicNacChatBody.tsx`: Required setup panels, Live Queue completion UI, final preview UI, message spacing if needed.
- `app/nic-nac/components/RequiredSetupHome.tsx`: Setup rail labels and sidebar copy.
- `app/start/StartSparkleSuiteForm.tsx`: Start page wording only; do not change checkout behavior.
- `lib/reviewer-smoke/session.ts`: Reviewer reset state quality and testability, not checkout completion.
- Tests:
  - `tests/self-serve-required-setup.test.ts`
  - `tests/nic-nac-required-setup-prompt.test.ts`
  - `tests/nic-nac-required-setup-tools.test.ts`
  - `tests/nic-nac-required-setup-client.test.ts`
  - `tests/reviewer-smoke-session.test.ts`

---

### Task 1: Reproduce And Fix Final Unlock Failure

**Files:**
- Modify: `lib/self-serve/required-setup.ts`
- Modify if needed: `lib/nic-nac/tools/unlock-required-setup.ts`
- Test: `tests/self-serve-required-setup.test.ts`
- Test: `tests/nic-nac-required-setup-tools.test.ts`

- [ ] **Step 1: Write a failing unlock regression test**

Add a test that creates a state with all required steps complete, calls unlock with preview approval, and expects `dashboard_unlocked`.

```ts
it('unlocks after every required setup step is complete and preview is approved', async () => {
  const state = await unlockRequiredSetup('rep-1', {
    repApprovedPreview: true,
  })

  expect(state.status).toBe('dashboard_unlocked')
  expect(state.dashboardUnlockedAt).toEqual(expect.any(String))
})
```

- [ ] **Step 2: Run the focused failing test**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/nic-nac-required-setup-tools.test.ts
```

Expected before fix: failure showing why final unlock is blocked after `final_preview_approval`.

- [ ] **Step 3: Fix the unlock root cause**

Trace whether the failure is caused by missing `final_preview_approval` in `completed_steps`, a mismatch between `repApprovedPreview` tool schema and service signature, or stale required-step labels. Fix the root cause in `lib/self-serve/required-setup.ts` or `lib/nic-nac/tools/unlock-required-setup.ts`.

- [ ] **Step 4: Run the focused tests again**

Run:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/nic-nac-required-setup-tools.test.ts
```

Expected: all tests pass.

---

### Task 2: Harden Required Setup Support Escalation

**Files:**
- Modify: `lib/nic-nac/tools/request-required-setup-support.ts`
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Test: `tests/nic-nac-required-setup-tools.test.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Write tests for delivered and undelivered support paths**

Assert that Nic-Nac never says Louis was notified unless the tool returns `delivered: true`, and that undelivered support failures produce clean grammar.

```ts
expect(prompt).toContain(
  'Tell the rep Louis has been notified only when the tool returns delivered: true',
)
expect(prompt).toContain(
  'If support notification fails, explain the next support step without run-together sentences',
)
```

- [ ] **Step 2: Fix prompt spacing instruction**

Add an explicit grammar guard to `lib/nic-nac/required-setup-prompt.ts`:

```ts
- Put a space after every sentence when explaining tool failures. Never output run-together text like "right away.I".
```

- [ ] **Step 3: Verify support tool failure result shape**

Ensure `request_required_setup_support` returns enough fields for Nic-Nac to distinguish:

```ts
{ ok: false, delivered: false, reason: 'telegram_not_configured' }
```

from:

```ts
{ ok: true, delivered: true }
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-required-setup-prompt.test.ts
```

Expected: support behavior and grammar guards pass.

---

### Task 3: Make Live Queue Completion Operational, Not Vague

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify if needed: `lib/self-serve/required-setup.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`
- Test: `tests/nic-nac-required-setup-client.test.ts`

- [ ] **Step 1: Add prompt regression tests**

Require the prompt to reject vague acknowledgements for Live Queue completion.

```ts
expect(prompt).toContain(
  'Do not mark Live Queue setup complete from vague replies like yes, okay, install now, or set it up now',
)
expect(prompt).toContain(
  'Only complete Live Queue setup after the rep confirms the extension is installed, the saved sync code was entered, Bomb Party Party Orders is open, Party Filter is set, and Live Queue status is connected',
)
```

- [ ] **Step 2: Add UI/state test for the Live Queue panel**

Assert that the required setup panel still shows the explicit checklist and `Live Queue is connected` action while the step is active.

- [ ] **Step 3: Update prompt**

Add this rule to the Live Queue setup section:

```ts
- Do not mark Live Queue setup complete from vague replies like yes, okay, install now, or set it up now.
- Only complete Live Queue setup after the rep confirms all of these: extension installed, saved sync code entered, Bomb Party Party Orders open, Party Filter set, and Live Queue status connected.
```

- [ ] **Step 4: Update client completion path if the panel button bypasses details**

If `Live Queue is connected` currently completes without recording checklist evidence, save a structured answer:

```ts
{
  extensionInstalled: true,
  syncCodeEntered: true,
  partyOrdersOpen: true,
  partyFilterSet: true,
  liveQueueConnected: true,
}
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-client.test.ts
```

Expected: vague-chat completion is blocked by prompt contract; explicit completion remains available.

---

### Task 4: Restore Account Basics Summary Before Look Step

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify if needed: `lib/self-serve/required-setup.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`
- Test: `tests/self-serve-required-setup.test.ts`

- [ ] **Step 1: Add prompt test**

```ts
expect(prompt).toContain(
  'After these account basics are captured, summarize them and ask the rep to confirm before marking account_basics complete',
)
expect(prompt).toContain(
  'Do not advance to the customer-site Look until the rep confirms the account basics summary',
)
```

- [ ] **Step 2: Update prompt**

Strengthen account basics:

```ts
- After these fields are captured, summarize customerFacingDisplayName, liveShowName, bestContactEmail, bombPartyRepStoreLink, and primaryLiveShowOrSocialLink.
- Ask: "Does that all look right before we pick your customer-site Look?"
- Do not complete account_basics until the rep confirms the summary.
```

- [ ] **Step 3: Add service guard if state completion currently auto-advances too early**

If `save_required_setup_answer` is completing `account_basics` as soon as the last field is captured, require an explicit confirmation answer.

- [ ] **Step 4: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts tests/self-serve-required-setup.test.ts
```

Expected: account basics cannot silently skip confirmation.

---

### Task 5: Fix Required Setup Labels And Public Copy

**Files:**
- Modify: `lib/self-serve/required-setup.ts`
- Modify: `app/nic-nac/components/RequiredSetupHome.tsx`
- Modify: `app/start/StartSparkleSuiteForm.tsx`
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Test: `tests/nic-nac-required-setup-client.test.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Add label/copy tests**

```ts
expect(rendered).not.toContain('Site skin')
expect(rendered).toContain('Customer-site Look')
expect(rendered).not.toContain('public site')
expect(rendered).toContain('customer-facing website')
expect(rendered).not.toContain('dancefloor/trade board')
expect(rendered).toContain('Trade Board')
expect(rendered).toContain('Live Queue')
```

- [ ] **Step 2: Replace labels**

Use:
- `Customer-site Look`
- `customer-facing website`
- `Live Queue`
- `Trade Board`

- [ ] **Step 3: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-prompt.test.ts
```

Expected: stale wording is gone from required setup surfaces.

---

### Task 6: Remove Stale Reviewer Seeded Welcome Copy

**Files:**
- Modify: `lib/reviewer-smoke/session.ts`
- Test: `tests/reviewer-smoke-session.test.ts`

- [ ] **Step 1: Add reviewer smoke test**

Assert required setup reset starts welcome copy empty enough for Nic-Nac to ask for the headline first.

```ts
expect(spies.setupUpsert).toHaveBeenCalledWith(
  expect.objectContaining({
    answers: expect.not.objectContaining({
      welcome_copy: expect.objectContaining({
        headline: 'Welcome, sparkle friends.',
      }),
    }),
  }),
  expect.any(Object),
)
```

- [ ] **Step 2: Update reviewer setup seed**

For `required_setup`, keep account basics/Look test data only if needed, but do not seed `welcome_copy.headline`.

- [ ] **Step 3: Run tests**

Run:

```powershell
npm exec vitest run tests/reviewer-smoke-session.test.ts
```

Expected: reviewer setup no longer tells Nic-Nac a headline already exists.

---

### Task 7: Make About Page Produce Rep-Specific Choices

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Add prompt test**

```ts
expect(prompt).toContain(
  'Do not complete the About page immediately after free-talk',
)
expect(prompt).toContain(
  'Show 2 or 3 polished About page choices and ask the rep to pick, blend, or revise',
)
expect(prompt).toContain(
  'After the rep picks or approves an About option, save the selected About copy and move on',
)
```

- [ ] **Step 2: Update prompt**

Add:

```ts
- Do not complete the About page immediately after free-talk.
- Show 2 or 3 polished About page choices and ask the rep to pick, blend, or revise.
- Preserve concrete facts from the rep in every option.
- After the rep picks or approves an About option, save the selected About copy and move on.
```

- [ ] **Step 3: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: prompt requires options and preservation.

---

### Task 8: Strengthen Trade Board And Light Box Orientation

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`

- [ ] **Step 1: Add light box prompt test**

```ts
expect(prompt).toContain('Light Box')
expect(prompt).toContain(
  'The Light Box is ordered by Sparkle Suite after payment',
)
expect(prompt).toContain(
  'The Light Box helps with consistent jewelry photos when a piece is not in the master jewelry library',
)
expect(prompt).toContain(
  'Do not require any Trade Board inventory before unlock',
)
```

- [ ] **Step 2: Update Trade Board orientation**

Replace the Trade Board section with:

```ts
9. Trade Board orientation:
   - Teach how Trade Board works without requiring inventory before unlock.
   - Explain that Trade Board helps reps organize customer trade requests instead of chasing DMs, comments, and screenshots.
   - Explain that trades are rep-controlled: the rep decides what to list, approves or declines requests, and handles shipping/logistics.
   - Explain the Light Box clearly: Sparkle Suite orders the Light Box after payment, and it helps reps take consistent jewelry photos when a piece is not already in the master jewelry library.
   - Tell the rep they can add Trade Board inventory later with Nic-Nac.
```

- [ ] **Step 3: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts
```

Expected: Trade Board includes clear Light Box explanation.

---

### Task 9: Reduce Repetitive Perfect And Streaming Grammar Issues

**Files:**
- Modify: `lib/nic-nac/required-setup-prompt.ts`
- Modify if needed: `app/nic-nac/components/NicNacChatBody.tsx`
- Test: `tests/nic-nac-required-setup-prompt.test.ts`
- Test if renderer changed: `tests/nic-nac-required-setup-client.test.ts`

- [ ] **Step 1: Add prompt tests**

```ts
expect(prompt).toContain('Do not use Perfect more than once during required setup')
expect(prompt).toContain('Never output run-together sentence pairs like Perfect.Now, options:Here, or right away.I')
```

- [ ] **Step 2: Update prompt**

Add:

```ts
- Do not use Perfect more than once during required setup.
- Prefer Got it, Thanks, That is saved, We will use that, Great, or Sounds good.
- Never output run-together sentence pairs like Perfect.Now, options:Here, or right away.I.
```

- [ ] **Step 3: If renderer is joining streamed chunks without spacing, add a renderer test**

Assert text output normalizes chunk boundaries:

```ts
expect(renderedText).not.toContain('right away.I')
expect(renderedText).toContain('right away. I')
```

- [ ] **Step 4: Run tests**

Run:

```powershell
npm exec vitest run tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-client.test.ts
```

Expected: prompt and renderer avoid obvious run-together text.

---

### Task 10: Make Reviewer Smoke Useful Without Re-testing Checkout

**Files:**
- Modify: `lib/reviewer-smoke/session.ts`
- Modify if needed: `app/start/StartSparkleSuiteForm.tsx`
- Test: `tests/reviewer-smoke-session.test.ts`

- [ ] **Step 1: Add test for `required_setup` reset quality**

Assert reset produces:
- onboarding status,
- no stale welcome headline,
- real Live Queue code,
- step state ready for full required setup.

- [ ] **Step 2: Leave checkout behavior alone**

Do not change item 14 or Stripe checkout behavior in this task.

- [ ] **Step 3: Rename reviewer button copy if needed**

If `Start smoke checkout` remains blocked by active subscription for the seeded reviewer account, either:
- make the button clearly say it is only for reviewer accounts without active subscriptions, or
- leave the button unchanged and document that full checkout smoke uses fresh email signup.

- [ ] **Step 4: Run tests**

Run:

```powershell
npm exec vitest run tests/reviewer-smoke-session.test.ts
```

Expected: reviewer setup preview is reliable for setup iteration; checkout item remains excluded.

---

## Verification Plan

- [ ] Run focused tests:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-tools.test.ts tests/reviewer-smoke-session.test.ts
```

- [ ] Run required setup broader tests:

```powershell
npm exec vitest run tests/services/live-queue.test.ts tests/self-serve-setup-state-route.test.ts tests/nic-nac-required-setup-client.test.ts tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-me-route.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/nic-nac/tool-routing.test.ts tests/reviewer-smoke-session.test.ts
```

- [ ] Run build:

```powershell
npm run build
```

- [ ] Browser smoke on stable preview after push:
  - Landing page loads.
  - `/start` loads.
  - `Open setup preview` reaches required setup.
  - Account basics summary appears before Look.
  - Welcome copy asks for headline first.
  - About page shows 2 or 3 choices.
  - Live Queue provides Chrome Extension Store link and saved sync code.
  - Vague Live Queue reply does not complete the step.
  - Explicit Live Queue connected confirmation completes the step.
  - Email/SMS readiness confirms no live sends.
  - Trade Board orientation clearly explains Light Box.
  - Final preview approval unlocks the workspace.

## Commit Plan

Use small commits:

1. `fix: repair required setup final unlock`
2. `fix: harden Live Queue setup completion`
3. `fix: smooth required setup copy and labels`
4. `fix: strengthen Trade Board light box orientation`
5. `fix: improve reviewer setup smoke reliability`

Do not stage unrelated dirty files:
- `app/nic-nac/_shell.module.css`
- `vault/session-log.md`

## Self-Review

- Spec coverage: covers all smoke findings except checkout item 14, which Louis explicitly excluded.
- Placeholder scan: no TBD/TODO placeholders.
- Type consistency: uses existing step/tool names: `account_basics`, `live_queue_setup`, `email_sms_update_readiness`, `final_preview_approval`, `unlock_required_setup`, `request_required_setup_support`.
