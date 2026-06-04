# Checkout Required Setup Handoff Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` for parallel investigation where helpful, or `superpowers:executing-plans` for direct execution. Work from `C:\Users\louis\sparkle-suite-repo`, not the binder. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the landing page lead -> account signup -> Stripe sandbox checkout -> Nic-Nac required setup handoff so a real paid test account returns to the same preview deployment, loads that account's required setup state, has a valid saved Live Queue sync code, and can send the first Nic-Nac setup reply without falling into demo/reviewer state.

**Smoke Failure Observed On June 4, 2026:**
- Signup on the stable preview succeeded and reached Stripe sandbox checkout.
- Stripe checkout completed, but `success_url` returned to `https://sparkle-suite.vercel.app/nic-nac?...` instead of the stable preview host.
- Production host rendered an old unlocked demo workspace (`Demo Rep / Sparkle Suite Demo`, code `284223`) instead of the new paid required setup flow.
- Manually swapping the host back to the stable preview showed required setup, but with reviewer labeling and chat send failures (`Couldn't send. Try again?`).
- The Live Queue sync code must be the saved generated code format, not a guessed Fizz/VIN-style string, and the rep should see that it is saved in the Sparkle Suite Workspace topbar for future use.

**Architecture:** Keep Stripe checkout creation server-side and authenticated. Add a small return-origin resolver so checkout sessions return to the origin that started checkout when that origin is safe. Keep `NEXT_PUBLIC_APP_URL` as the production fallback, not the default for preview-origin checkouts. Make required setup state guarantee a saved Live Queue sync code before the Live Queue step can talk about extension setup. Make reviewer controls only appear for reviewer smoke sessions, not every preview-required-setup session.

**Tech Stack:** Next.js App Router, TypeScript, Stripe Checkout test mode, Supabase auth/service APIs, existing Nic-Nac AI SDK route/tools, Vitest, Chrome Connector/manual browser smoke against Vercel preview.

---

## Scope And Rules

- Do not modify Chrome Web Store settings.
- Do not modify Sparkle Suite Chrome extension code, package files, or live-show systems.
- Use Stripe sandbox/test mode only.
- Do not send live customer SMS/email/provider messages.
- Do not stage or modify unrelated dirty files:
  - `app/nic-nac/_shell.module.css`
  - `vault/session-log.md`
- Keep rep-facing terms consistent: `Sparkle Suite Workspace`, `customer-facing website`, `Live Queue`, `Trade Board`, `Look/Looks`.

## File Map

- `app/api/stripe/create-checkout/route.ts`  
  Creates Stripe Checkout sessions and currently uses `getAppUrl()` for `success_url`/`cancel_url`.

- `lib/stripe/config.ts` or new `lib/stripe/return-origin.ts`  
  Add safe checkout return-origin resolution.

- `app/nic-nac/_client.tsx`  
  Finalizes returned checkout sessions, loads setup state, resolves conversation IDs, and renders required setup.

- `app/nic-nac/components/RequiredSetupHome.tsx`  
  Shows reviewer actions and currently labels the required setup page as reviewer preview whenever reviewer actions are passed.

- `app/api/self-serve/setup-state/route.ts`  
  Loads required setup state and Live Queue sync code.

- `lib/services/live-queue.ts`  
  Owns approved sync code generation (`AAA-0000` style) and persistence.

- `lib/self-serve/required-setup-checkout.ts`  
  Transitions a paid checkout into required setup.

- `app/api/nic-nac/route.ts` and `app/nic-nac/components/NicNacChatBody.tsx`  
  Need clearer error surfacing for failed required setup sends.

- Tests:
  - `tests/stripe-create-checkout-route.test.ts`
  - `tests/stripe-sync-route.test.ts`
  - `tests/self-serve-setup-state-route.test.ts`
  - `tests/nic-nac-required-setup-client.test.ts`
  - `tests/reviewer-smoke-ui.test.ts`
  - `tests/reviewer-smoke-session.test.ts`
  - `tests/nic-nac-required-setup-tools.test.ts`

---

### Task 1: Fix Stripe Checkout Return Origin

**Files:**
- Modify: `app/api/stripe/create-checkout/route.ts`
- Create or modify: `lib/stripe/return-origin.ts`
- Modify: `tests/stripe-create-checkout-route.test.ts`

- [ ] **Step 1: Add a failing preview-origin checkout test**

In `tests/stripe-create-checkout-route.test.ts`, create a test where:
- `getAppUrlMock` returns `https://sparkle-suite.vercel.app`
- the incoming request URL is `https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app/api/stripe/create-checkout`
- the request includes `origin: https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app`

Assert Stripe receives:

```ts
success_url:
  'https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app/nic-nac?onboarding=required-setup&billing=subscription-success&session_id={CHECKOUT_SESSION_ID}',
cancel_url:
  'https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app/nic-nac?onboarding=checkout-required&billing=subscription-cancelled',
```

- [ ] **Step 2: Add hostile-origin coverage**

Add tests proving the resolver does not trust arbitrary origins:

```ts
origin: 'https://evil.example'
```

Expected: checkout uses `getAppUrl()` fallback, or returns `400` with an actionable error. Prefer fallback only if no user data can leak to the supplied origin.

- [ ] **Step 3: Implement a safe return-origin resolver**

Create a helper such as:

```ts
export function resolveCheckoutReturnOrigin(request: Request) {
  const configured = getAppUrl()
  const candidates = [
    request.headers.get('origin'),
    new URL(request.url).origin,
  ]

  return first safe candidate or configured
}
```

Safe candidates should include:
- localhost origins for local dev.
- `*.vercel.app` preview/deployment origins.
- production Sparkle Suite origins from config.
- `https://www.yoursparklesuite.com` if configured.

Do not allow arbitrary external domains.

- [ ] **Step 4: Use the resolved origin in Stripe URLs**

In `app/api/stripe/create-checkout/route.ts`, compute:

```ts
const returnOrigin = resolveCheckoutReturnOrigin(request)
```

Then use `returnOrigin` for both `success_url` and `cancel_url`.

- [ ] **Step 5: Run focused checkout tests**

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts
```

Expected: PASS.

---

### Task 2: Prevent Paid Preview Returns From Rendering Demo Or Reviewer State

**Files:**
- Modify: `app/nic-nac/_client.tsx`
- Modify: `app/nic-nac/components/RequiredSetupHome.tsx`
- Modify if needed: `lib/reviewer-smoke/session.ts`
- Modify: `tests/nic-nac-required-setup-client.test.ts`
- Modify: `tests/reviewer-smoke-ui.test.ts`
- Modify: `tests/reviewer-smoke-session.test.ts`

- [ ] **Step 1: Add a regression test for paid checkout success UI**

Assert that a checkout success return with real setup state:
- stays in `required_setup`
- does not render `DashboardPlaceholder`
- does not show `Reviewer preview`
- does not show reviewer reset actions
- does not use demo workspace copy

- [ ] **Step 2: Gate reviewer actions by reviewer session/account, not preview deployment**

Today preview deployments may pass `reviewerSmokeVisible`, which is useful on `/start`, but a real paid self-serve signup on preview should not automatically be labeled reviewer preview.

Implement one of:
- pass reviewer actions only when the authenticated setup session is the reviewer smoke account/session, or
- keep the reset affordance outside real required setup and expose it through a reviewer-only route/button.

- [ ] **Step 3: Sanitize checkout-success conversation state**

On `billing=subscription-success`, avoid carrying a stale or foreign `conversationId` through the first required setup load. If a `conversationId` is present during checkout success:
- probe ownership before using it, or
- clear it and resolve a fresh/latest conversation for the authenticated rep after Stripe sync completes.

This prevents the manual host-swap failure mode from becoming a persistent broken chat state.

- [ ] **Step 4: Run focused client/reviewer tests**

```powershell
npm exec vitest run tests/nic-nac-required-setup-client.test.ts tests/reviewer-smoke-ui.test.ts tests/reviewer-smoke-session.test.ts
```

Expected: PASS.

---

### Task 3: Guarantee A Saved Live Queue Sync Code For Required Setup

**Files:**
- Modify: `app/api/self-serve/setup-state/route.ts`
- Modify if needed: `lib/self-serve/required-setup-checkout.ts`
- Modify: `tests/self-serve-setup-state-route.test.ts`
- Modify: `tests/stripe-sync-route.test.ts`
- Confirm: `tests/services/live-queue.test.ts`
- Confirm: `tests/nic-nac-required-setup-tools.test.ts`

- [ ] **Step 1: Add setup-state route test for missing code**

When `getRequiredSetupState()` returns `required_setup` or `setup_blocked` and no code exists, `/api/self-serve/setup-state` should create one with `ensureLiveQueueSyncCodeForRep()` and return it.

Expected response:

```ts
state: {
  status: 'required_setup',
  liveQueueSyncCode: 'GFF-7342',
}
```

- [ ] **Step 2: Add checkout-sync regression coverage**

Extend `tests/stripe-sync-route.test.ts` so a required setup checkout transition either:
- ensures the Live Queue sync code immediately, or
- proves the next setup-state load will ensure it before Nic-Nac reaches Live Queue setup.

The important behavior: a paid setup account never reaches Live Queue setup with only a made-up or null code.

- [ ] **Step 3: Implement code guarantee**

Prefer this order:
1. On paid required setup transition, ensure the sync code once.
2. In `/api/self-serve/setup-state`, use `ensureLiveQueueSyncCodeForRep()` for required setup statuses as an idempotent safety net.
3. Keep `ensure_live_queue_sync_code` available to Nic-Nac for resumed or partial smoke tests.

- [ ] **Step 4: Preserve workspace topbar behavior**

Confirm the full Sparkle Suite Workspace topbar reads the same saved code from the database. The rep should be told:

```text
This code will stay saved at the top of your Sparkle Suite Workspace for future use.
```

They should not be told to write it down.

- [ ] **Step 5: Run focused Live Queue tests**

```powershell
npm exec vitest run tests/self-serve-setup-state-route.test.ts tests/stripe-sync-route.test.ts tests/services/live-queue.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

Expected: PASS.

---

### Task 4: Make Nic-Nac Required Setup Send Failures Actionable

**Files:**
- Modify: `app/nic-nac/components/NicNacChatBody.tsx`
- Modify if needed: `app/api/nic-nac/route.ts`
- Modify: `tests/nic-nac-required-setup-client.test.ts`
- Add if practical: `tests/nic-nac-required-setup-chat-route.test.ts`

- [ ] **Step 1: Add a client error-surfacing test**

Assert that when `/api/nic-nac` returns a JSON error body during required setup, the UI can surface the response status/message instead of only:

```text
Couldn't send. Try again?
```

The UI can remain friendly, but it should preserve the diagnostic cause for smoke testing.

- [ ] **Step 2: Add server-side required setup chat route regression**

Create a route-level test proving a freshly authenticated paid setup rep can send the first required setup chat message with:

```ts
mode: 'required_setup'
conversationId: fresh uuid
messages: [{ role: 'user', parts: [{ type: 'text', text: 'Gracie' }] }]
```

Expected:
- no demo rep fallback
- no reviewer smoke fallback
- no conversation-owner rejection for a fresh conversation
- setup tools are available

- [ ] **Step 3: Improve error response shape if needed**

If `app/api/nic-nac/route.ts` catches setup/auth/tool errors generically, return structured JSON:

```ts
{
  error: 'Required setup chat failed.',
  code: 'REQUIRED_SETUP_CHAT_CONTEXT_MISSING',
  detail: '...'
}
```

Do not leak secrets or provider payloads.

- [ ] **Step 4: Update chat UI failure text**

In required setup mode, show an actionable inline error such as:

```text
Nic-Nac could not send because required setup context is missing. Refresh, then try again.
```

Keep a retry button.

- [ ] **Step 5: Run focused tests**

```powershell
npm exec vitest run tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-chat-route.test.ts
```

Expected: PASS.

---

### Task 5: Add A Repeatable Real Checkout Smoke Path

**Files:**
- Modify or create: `docs/superpowers/smoke/required-setup-checkout-smoke.md`
- Modify if needed: reviewer/test docs near `/start`
- Optional script only if low risk: `scripts/smoke-required-setup-checkout-notes.ts`

- [ ] **Step 1: Document the exact smoke steps**

Include:
- stable preview URL
- fake name/email/password pattern
- Stripe test card `4242 4242 4242 4242`
- fake address/phone accepted by Stripe sandbox
- expected post-checkout URL host
- expected required setup state
- expected first Nic-Nac send behavior
- expected Live Queue code format (`AAA-0000`) and topbar persistence

- [ ] **Step 2: Add expected failure diagnostics**

Document what to capture if it fails:
- final Stripe return URL
- `/api/stripe/sync` response status
- `/api/self-serve/setup-state` response status
- `/api/nic-nac` response status/body
- whether reviewer/demo labels appear

- [ ] **Step 3: Keep checkout smoke separate from reviewer reset**

Reviewer reset remains useful for iterating setup copy, but it cannot prove the real Stripe origin/auth handoff. The real checkout smoke must use a fresh self-serve email account.

---

## Verification Plan

- [ ] Focused tests:

```powershell
npm exec vitest run tests/stripe-create-checkout-route.test.ts tests/stripe-sync-route.test.ts tests/self-serve-setup-state-route.test.ts tests/nic-nac-required-setup-client.test.ts tests/reviewer-smoke-ui.test.ts tests/reviewer-smoke-session.test.ts tests/services/live-queue.test.ts tests/nic-nac-required-setup-tools.test.ts tests/nic-nac-dashboard-placeholder.test.ts
```

- [ ] Broader required setup suite:

```powershell
npm exec vitest run tests/self-serve-required-setup.test.ts tests/nic-nac-branding.test.ts tests/nic-nac-required-setup-prompt.test.ts tests/nic-nac-required-setup-client.test.ts tests/nic-nac-required-setup-tools.test.ts tests/self-serve-setup-state-route.test.ts tests/stripe-create-checkout-route.test.ts tests/stripe-sync-route.test.ts tests/services/live-queue.test.ts tests/reviewer-smoke-session.test.ts tests/reviewer-smoke-ui.test.ts
```

- [ ] Production build:

```powershell
npm run build
```

- [ ] Git status hygiene:

```powershell
git status --short
```

Expected: only intentional plan/fix files changed. Do not stage `app/nic-nac/_shell.module.css` or `vault/session-log.md`.

- [ ] Push branch:

```powershell
git push origin codex/sparkle-cross-phase-hardening
```

- [ ] Verify stable preview alias:

```powershell
npx vercel inspect sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app
```

- [ ] Browser smoke with Chrome Connector:
  - Open stable preview.
  - Start as a real lead, not reviewer shortcut.
  - Create a fresh fake email account.
  - Complete Stripe sandbox checkout.
  - Confirm Stripe returns to the same stable preview host.
  - Confirm required setup page is not demo/reviewer-labeled.
  - Send the first Nic-Nac reply.
  - Confirm Live Queue step provides the Chrome Extension Store link and the saved database sync code.
  - Confirm full Sparkle Suite Workspace topbar shows the same code after unlock.

## Commit Plan

Use small commits:

1. `fix: return checkout to request origin`
2. `fix: isolate paid setup from reviewer state`
3. `fix: guarantee Live Queue sync codes for setup`
4. `fix: surface required setup chat send failures`
5. `docs: add required setup checkout smoke path`

## Self-Review

- Spec coverage: directly addresses the observed checkout host mismatch, demo/reviewer fallback, missing or invented Live Queue code risk, chat send failure opacity, and repeatable full-flow smoke needs.
- Safety: avoids Chrome Web Store settings, extension files, live-show systems, and live customer sends.
- Testability: every behavioral fix has a focused Vitest target plus a final Chrome Connector smoke path.
