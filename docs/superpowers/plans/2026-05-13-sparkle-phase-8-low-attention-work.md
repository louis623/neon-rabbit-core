# Sparkle Suite Phase 8 Low-Attention Work Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the remaining Phase 8 work that is already bounded and does not require Louis attention, provider approval, migration verification, legal copy, or live send/payment decisions.

**Architecture:** Keep each slice operator-only and deterministic. Add pure helpers under `lib/prelaunch`, render read-only summaries in the internal intake review page, and pin behavior with focused Vitest tests before touching production code.

**Tech Stack:** Next.js App Router, React server/client components, TypeScript, Vitest, existing prelaunch intake review and agent-run patterns.

---

## Scope Boundaries

Allowed:
- Read-only internal readiness panels.
- Pure helper logic derived from existing intake, QR, Scribe, and photo-quality data.
- Tests that assert guardrails and absence of live action language.
- Small commits after each verified slice.

Not allowed in this plan:
- SMS/Telnyx campaign, phone-number attachment, or handset smoke work.
- Google OAuth or Drive transcript acquisition.
- Supabase/Docker migration verification for payment gates.
- Live payment webhook work on `sparkle_suite_payment_gates`.
- Live SignWell sends or legal agreement copy.
- Vendor order, shipping, kit pricing, or fulfillment automation.
- Any work under `docs/sparkle-suite/marketing/`.

## File Map

- `lib/prelaunch/camera-quality-prep.ts`: new pure helper for Phase 8.19 camera/sample-photo screening guidance.
- `tests/prelaunch/prelaunch-camera-quality-prep.test.ts`: new helper tests for Phase 8.19.
- `app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx`: render read-only camera quality prep, QR readiness, and Scribe completeness panels.
- `tests/prelaunch/prelaunch-intake-review-page.test.ts`: UI assertions and guardrail checks.
- `lib/prelaunch/qr-assets.ts`: extend existing manifest with operator verification steps and display target metadata, without generating QR images.
- `tests/prelaunch/prelaunch-qr-assets.test.ts`: manifest tests.
- `tests/prelaunch/prelaunch-qr-assets-route.test.ts`: route payload tests if manifest shape changes.
- `lib/prelaunch/scribe-readiness.ts`: new pure helper for Scribe brief completeness and operator-only follow-up grouping.
- `tests/prelaunch/prelaunch-scribe-readiness.test.ts`: helper tests.

---

### Task 1: Phase 8.19 Camera Quality Prep

**Files:**
- Create: `lib/prelaunch/camera-quality-prep.ts`
- Create: `tests/prelaunch/prelaunch-camera-quality-prep.test.ts`
- Modify: `app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx`
- Modify: `tests/prelaunch/prelaunch-intake-review-page.test.ts`

- [ ] **Step 1: Write the failing helper test**

Create tests for:
- phone-only intake requires sample-photo screening and two-device workflow confirmation
- unknown device setup asks for manual device confirmation
- qualified intake still needs a sample photo before any setup is treated as ready
- guardrails contain no fulfillment action language

Run:
```powershell
npm exec vitest run tests/prelaunch/prelaunch-camera-quality-prep.test.ts
```

Expected: FAIL because `@/lib/prelaunch/camera-quality-prep` does not exist.

- [ ] **Step 2: Write the failing UI test**

Add an assertion to `tests/prelaunch/prelaunch-intake-review-page.test.ts` that the internal review card renders:
- `Camera quality prep`
- `Sample photo still needs Nic-Nac screening`
- `Confirm two-device workflow`
- `Do not treat this as kit approval`

Also assert the HTML does not contain:
- `Send SMS`
- `Order camera`
- `Approve shipment`
- `Collect kit fee`

Run:
```powershell
npm exec vitest run tests/prelaunch/prelaunch-intake-review-page.test.ts
```

Expected: FAIL because the panel is not rendered yet.

- [ ] **Step 3: Implement the helper**

Create `buildCameraQualityPrep(submission)` returning:
- `status: 'sample_photo_required'`
- `items` with required/review statuses
- `guardrails` with no live action wording

Use existing `PrelaunchIntakeReviewSubmission` fields:
- `deviceSetup`
- `fitFlags`
- `currentSetup`
- `setupGoal`

- [ ] **Step 4: Render the panel**

Render the helper output on each internal intake card near the existing Photography kit prep block.

- [ ] **Step 5: Verify and commit**

Run:
```powershell
npm exec vitest run tests/prelaunch/prelaunch-camera-quality-prep.test.ts tests/prelaunch/prelaunch-intake-review-page.test.ts
npm exec vitest run tests/prelaunch
npx tsc --noEmit --pretty false
git diff --check
npm run build
```

Commit:
```powershell
git add -- app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx lib/prelaunch/camera-quality-prep.ts tests/prelaunch/prelaunch-camera-quality-prep.test.ts tests/prelaunch/prelaunch-intake-review-page.test.ts
git commit -m "feat: add camera quality prep guidance"
```

---

### Task 2: QR Readiness Verification

**Files:**
- Modify: `lib/prelaunch/qr-assets.ts`
- Modify: `tests/prelaunch/prelaunch-qr-assets.test.ts`
- Modify: `tests/prelaunch/prelaunch-qr-assets-route.test.ts`
- Modify: `app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx`
- Modify: `tests/prelaunch/prelaunch-intake-review-page.test.ts`

- [ ] **Step 1: Write failing manifest tests**

Add tests asserting the approved QR manifest includes:
- `displayTarget: 'www.yoursparklesuite.com/prelaunch#waitlist'`
- `verificationSteps` for scan target, campaign params, and approved asset path
- `blockedActions` covering dynamic QR generation, external QR provider calls, and retired assets

Run:
```powershell
npm exec vitest run tests/prelaunch/prelaunch-qr-assets.test.ts
```

Expected: FAIL because the manifest does not include these fields.

- [ ] **Step 2: Implement manifest fields**

Extend `getApprovedPrelaunchQrManifest()` only. Do not add QR image generation, dependencies, external provider URLs, or network calls.

- [ ] **Step 3: Render QR readiness steps**

Update the existing Approved QR flyer panel to show scan verification steps and blocked actions.

- [ ] **Step 4: Verify and commit**

Run the focused QR tests, full prelaunch suite, TypeScript, diff check, and build.

Commit:
```powershell
git add -- lib/prelaunch/qr-assets.ts tests/prelaunch/prelaunch-qr-assets.test.ts tests/prelaunch/prelaunch-qr-assets-route.test.ts app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx tests/prelaunch/prelaunch-intake-review-page.test.ts
git commit -m "feat: add QR readiness verification"
```

---

### Task 3: Scribe Handoff Completeness

**Files:**
- Create: `lib/prelaunch/scribe-readiness.ts`
- Create: `tests/prelaunch/prelaunch-scribe-readiness.test.ts`
- Modify: `app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx`
- Modify: `tests/prelaunch/prelaunch-intake-review-page.test.ts`

- [ ] **Step 1: Write failing helper tests**

Cover:
- no transcript means transcript handoff needed when intake is `meeting_ready`
- queued transcript without a brief means Scribe processing review needed
- brief with open questions or manual review warnings marks handoff incomplete
- clean brief marks Scribe follow-up review ready, still operator-only

Run:
```powershell
npm exec vitest run tests/prelaunch/prelaunch-scribe-readiness.test.ts
```

Expected: FAIL because `@/lib/prelaunch/scribe-readiness` does not exist.

- [ ] **Step 2: Implement helper**

Create `buildScribeReadiness(submission)` returning:
- `label`
- `status: 'missing' | 'review' | 'ready'`
- `items`
- `guardrails`

Guardrails must say no autonomous profile writeback, no legal/payment approval, and no live SignWell send.

- [ ] **Step 3: Render helper output**

Render a compact Scribe handoff completeness block near the existing Scribe run details.

- [ ] **Step 4: Verify and commit**

Run focused Scribe tests, full prelaunch suite, TypeScript, diff check, and build.

Commit:
```powershell
git add -- app/internal/prelaunch/intake/_components/PrelaunchIntakeReviewPageContent.tsx lib/prelaunch/scribe-readiness.ts tests/prelaunch/prelaunch-scribe-readiness.test.ts tests/prelaunch/prelaunch-intake-review-page.test.ts
git commit -m "feat: add Scribe handoff readiness"
```

---

## Final Verification

After all safe slices are committed:

Run:
```powershell
npm exec vitest run tests/prelaunch
npx tsc --noEmit --pretty false
git diff --check
npm run build
git status --short --branch
```

Update Neon Rabbit HQ and Open Brain with:
- each commit hash
- tests run
- explicit confirmation that parked Phase 8 lanes were not touched
- remaining Phase 8 blockers that require Louis/provider decisions
