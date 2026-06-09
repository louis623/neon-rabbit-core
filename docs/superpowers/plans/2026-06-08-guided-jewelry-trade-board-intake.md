# Guided Jewelry Trade Board Intake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a guided Nic-Nac workflow that starts with item number lookup, only asks for photos when the item is missing from the Sparkle Suite jewelry database, and adds a complete help/resource guide for reps.

**Architecture:** Keep the first version conversational and tool-driven instead of building a separate wizard UI. Add a new quick chip that starts a guided flow, strengthen routing for item-number-only follow-ups, update Nic-Nac prompts with a clear state machine, and add a searchable help resource with photo/light-box best practices.

**Tech Stack:** Next.js app router, React chat components, Vercel AI SDK tool routing, Vitest, Sparkle Suite Supabase-backed service tools.

---

## File Structure

**Modify:**
- `app/nic-nac/components/Chips.tsx` - add the quick chip label that starts the guided add flow.
- `lib/nic-nac/tools/index.ts` - keep trade-board tools loaded for bare item numbers and guided intake follow-ups.
- `lib/nic-nac/prompt-builder.ts` - production routed Nic-Nac prompt for workspace mode.
- `lib/nic-nac/system-prompt.ts` - legacy static prompt reference kept in sync with production prompt concepts.
- `lib/services/help-resources.ts` - new help/resource guide entry for adding jewelry pieces and photo best practices.
- `tests/nic-nac/tool-routing.test.ts` - routing regression tests for guided intake.
- `tests/nic-nac/prompt-routing.test.ts` - prompt contract tests for the guided flow.
- `tests/nic-nac/system-prompt-add-listing.test.ts` - legacy prompt contract coverage.
- `tests/help-resources.test.ts` or `tests/nic-nac-dashboard-placeholder.test.ts` - help/resource guide discovery coverage.
- `tests/reviewer-smoke-ui.test.ts` or a focused chip test if one exists - verifies the quick chip is present.

**Do not modify:**
- Chrome extension code.
- Live Queue extension files.
- Binder path `C:\Users\louis\sparkle-suite`.

## Behavioral Design

The rep-facing happy path:

1. Rep clicks **Add a piece to Trade Board**.
2. Nic-Nac asks for the item number first.
3. Rep gives an item number such as `ER13743`.
4. Nic-Nac searches the Sparkle Suite jewelry database.
5. If the item exists, Nic-Nac confirms the match and asks whether to add one to the board.
6. If confirmed, Nic-Nac calls `add_listing` with `mode:'single'` and `itemNumber`.
7. If the item does not exist, Nic-Nac starts missing-catalog intake:
   - ask for label/details photo,
   - extract item number, design name, stone, material, MSRP,
   - ask for collection or packaging photo if collection is not visible,
   - confirm extracted catalog data,
   - ask for front-facing jewelry photo with light-box instructions,
   - run `add_listing` with new-design fields and the jewelry photo index.
8. Nic-Nac never asks the rep to retype readable label details. If a detail is not visible, ask one focused question.

## Sub-Agent Strategy

Use subagents if speed matters:

- **Subagent A: Chat Workflow and Routing**
  Owns `lib/nic-nac/tools/index.ts`, `lib/nic-nac/prompt-builder.ts`, `lib/nic-nac/system-prompt.ts`, and related Nic-Nac tests.
- **Subagent B: Help Resource Guide**
  Owns `lib/services/help-resources.ts` and help/resource tests.
- **Subagent C: UI Chip and Smoke QA**
  Owns `app/nic-nac/components/Chips.tsx`, chip/UI tests, and browser QA.

Run Subagents A and B in parallel. Run Subagent C after A confirms the starter chip text and prompt text are final, because the chip text is part of the workflow contract.

---

### Task 1: Add The Guided Intake Quick Chip

**Files:**
- Modify: `app/nic-nac/components/Chips.tsx`
- Test: `tests/reviewer-smoke-ui.test.ts` or a new focused `tests/nic-nac-chips.test.ts`

- [ ] **Step 1: Write the failing test**

Add or update a UI/source test that expects the workspace chip list to include the new guided flow starter.

```ts
expect(source).toContain('Add a piece to Trade Board')
```

If using a rendered component test, assert the chip button text:

```ts
expect(screen.getByRole('button', { name: 'Add a piece to Trade Board' })).toBeTruthy()
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: FAIL because the chip is not present yet.

- [ ] **Step 3: Implement the chip**

Change `WORKSPACE_CHIP_LABELS` in `app/nic-nac/components/Chips.tsx` to:

```ts
const WORKSPACE_CHIP_LABELS = [
  'Add a piece to Trade Board',
  "What's on my board?",
  'Remove a listing',
]
```

- [ ] **Step 4: Run the focused test**

Run:

```bash
npm exec vitest run tests/reviewer-smoke-ui.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task if executing with frequent commits**

```bash
git add app/nic-nac/components/Chips.tsx tests/reviewer-smoke-ui.test.ts
git commit -m "feat: add trade board intake quick action"
```

---

### Task 2: Route Item-Number-Only Intake Replies To Trade Board Tools

**Files:**
- Modify: `lib/nic-nac/tools/index.ts`
- Test: `tests/nic-nac/tool-routing.test.ts`

- [ ] **Step 1: Add failing routing tests**

Add tests for the chip starter and the next item-number-only reply.

```ts
it('routes the guided add-a-piece chip to trade-board tools', () => {
  const intents = getToolIntentsForText('Add a piece to Trade Board')

  expect(intents).toEqual(['trade_board'])
  expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
  expect(listToolNamesForIntents(intents)).toContain('add_listing')
})

it('keeps trade-board tools for an item-number reply during guided intake', () => {
  const messages = [
    {
      role: 'user',
      parts: [{ type: 'text', text: 'Add a piece to Trade Board' }],
    },
    {
      role: 'assistant',
      parts: [{ type: 'text', text: "What's the item number?" }],
    },
    {
      role: 'user',
      parts: [{ type: 'text', text: 'ER13743' }],
    },
  ]
  const intents = getToolIntentsForMessages(messages)

  expect(intents).toEqual(['trade_board'])
  expect(listToolNamesForIntents(intents)).toContain('search_jewelry_database')
  expect(shouldRequireToolCallForMessages(messages, intents)).toBe(true)
})
```

- [ ] **Step 2: Run the test and confirm failure**

Run:

```bash
npm exec vitest run tests/nic-nac/tool-routing.test.ts
```

Expected: FAIL on bare item number routing.

- [ ] **Step 3: Implement routing**

In `getToolIntentsForText`, add item-number detection to the trade-board pattern list:

```ts
/\b[A-Z]{1,4}\d{3,}\b/i,
```

In `isContextualFollowUp`, add the same pattern:

```ts
/\b[A-Z]{1,4}\d{3,}\b/i,
```

Expand the previous-assistant context regex to include:

```ts
item number|guided|add a piece
```

- [ ] **Step 4: Run the test**

Run:

```bash
npm exec vitest run tests/nic-nac/tool-routing.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task if executing with frequent commits**

```bash
git add lib/nic-nac/tools/index.ts tests/nic-nac/tool-routing.test.ts
git commit -m "fix: route guided jewelry intake replies to trade tools"
```

---

### Task 3: Add Nic-Nac Guided Intake Prompt Contract

**Files:**
- Modify: `lib/nic-nac/prompt-builder.ts`
- Modify: `lib/nic-nac/system-prompt.ts`
- Test: `tests/nic-nac/prompt-routing.test.ts`
- Test: `tests/nic-nac/system-prompt-add-listing.test.ts`

- [ ] **Step 1: Write failing prompt tests**

Add prompt tests that require the item-number-first flow and photo flow.

```ts
expect(prompt).toContain('When the rep starts "Add a piece to Trade Board", ask for the item number first')
expect(prompt).toContain('search_jewelry_database before asking for photos')
expect(prompt).toContain('If the item exists, confirm the match before add_listing')
expect(prompt).toContain('If the item is missing, ask for the label/details photo')
expect(prompt).toContain('The collection may be on packaging instead of the label')
expect(prompt).toContain('Ask for collection or a packaging photo if it is not visible')
expect(prompt).toContain('Ask for the jewelry-front photo only after catalog details are confirmed')
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```bash
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts
```

Expected: FAIL until the prompt contract exists.

- [ ] **Step 3: Implement production prompt instructions**

In the `trade_board` section of `lib/nic-nac/prompt-builder.ts`, add a compact state machine:

```ts
- Guided add flow: When the rep starts "Add a piece to Trade Board", ask for the item number first. Do not ask for photos yet.
- After the rep gives an item number, call search_jewelry_database before asking for photos.
- If the item exists, summarize the matched design and ask whether to add one piece to the board. On confirmation, call add_listing with mode:'single' and itemNumber. If they give a quantity, use mode:'batch'.
- If the item is missing, start catalog intake: ask for the label/details photo first. Read item number, design name, main stone, material, and MSRP from the label.
- The collection may be on packaging instead of the label. If collection/month/year is not visible, ask for the collection name or a packaging photo.
- Confirm extracted catalog data before creating a new design.
- Ask for the jewelry-front photo only after catalog details are confirmed. Tell the rep to use the white light-box background, brightest light, centered front-facing jewelry, and a clear close shot.
- For the final add_listing retry, pass piecePhotoIndex/listingPhotoIndex when multiple photos are in the conversation.
```

Keep the prompt under the existing `prompt.length < 9_000` test. If needed, trim older duplicated wording.

- [ ] **Step 4: Mirror the essential rules in the legacy static prompt**

In `lib/nic-nac/system-prompt.ts`, add equivalent concise guidance under `add_listing`.

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit only this task if executing with frequent commits**

```bash
git add lib/nic-nac/prompt-builder.ts lib/nic-nac/system-prompt.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts
git commit -m "feat: guide Nic-Nac jewelry intake flow"
```

---

### Task 4: Add Help Resource Guide For Trade Board And Jewelry Database Intake

**Files:**
- Modify: `lib/services/help-resources.ts`
- Test: `tests/help-resources.test.ts`

- [ ] **Step 1: Write failing help-resource test**

Add a test that finds the guide by trade board, jewelry database, and light box keywords.

```ts
it('includes a rep guide for adding jewelry pieces with light-box photo best practices', () => {
  const results = getHelpResources('add jewelry trade board light box white background')
  const guide = results.find((resource) => resource.id === 'adding-jewelry-to-trade-board')

  expect(guide).toBeTruthy()
  expect(guide?.title).toContain('Add jewelry to your trade board')
  expect(guide?.body).toContain('Start with the item number')
  expect(guide?.body).toContain('white background')
  expect(guide?.body).toContain('brightest light')
  expect(guide?.body).toContain('label/details photo')
  expect(guide?.body).toContain('packaging photo')
  expect(guide?.quickActions).toContain('Add a piece to Trade Board')
})
```

- [ ] **Step 2: Run test and confirm failure**

Run:

```bash
npm exec vitest run tests/help-resources.test.ts
```

Expected: FAIL because the guide does not exist.

- [ ] **Step 3: Add the guide**

Add this `HelpResource` near the existing trade-board help entries:

```ts
{
  id: 'adding-jewelry-to-trade-board',
  category: 'Trade board',
  title: 'Add jewelry to your trade board and the Sparkle Suite database',
  summary:
    'Start with the item number, then use label, packaging, and jewelry-front photos only when the item is not already in the database.',
  body:
    'Start with the item number. Nic-Nac checks the Sparkle Suite jewelry database first. If the item is already there, you can add it to your trade board without uploading photos. If the item is not in the database yet, Nic-Nac will ask for a label/details photo to read the item number, design name, stone, material, and MSRP. The collection is often on the packaging, not the label, so Nic-Nac may ask for the collection name or a packaging photo if it is not visible. After the catalog details are confirmed, upload the jewelry-front photo for the customer-facing board image. For best photos, use your light box with the white background installed, turn the light to the brightest setting, center the jewelry, face it toward the camera, keep the shot clear and close, and avoid using the colored backdrops for catalog or board photos.',
  quickActions: [
    'Add a piece to Trade Board',
    'Review photo best practices',
    'Ask Nic-Nac what info is missing',
  ],
  video: {
    title: 'Adding trade board jewelry and taking light-box photos',
    provider: 'youtube',
    status: 'placeholder',
  },
}
```

- [ ] **Step 4: Run test**

Run:

```bash
npm exec vitest run tests/help-resources.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task if executing with frequent commits**

```bash
git add lib/services/help-resources.ts tests/help-resources.test.ts
git commit -m "docs: add jewelry intake help guide"
```

---

### Task 5: Strengthen Add-Listing Photo Index Tests For The Guided Flow

**Files:**
- Modify: `tests/nic-nac/add-listing-recovery.test.ts`
- Modify only if test exposes a gap: `lib/nic-nac/tools/add-listing.ts`

- [ ] **Step 1: Add a regression test for label-first then front-photo flow**

Add a test that simulates a conversation where the label photo arrives first and the front photo arrives later. The final `piecePhotoIndex` should resolve the latest front photo without picking the label photo.

```ts
const supabaseMock = makeConversationLookupMock([
  {
    parts: [
      { type: 'text', text: 'Here is the jewelry-front photo.' },
      { type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,SlRZ' },
    ],
  },
  {
    parts: [
      { type: 'text', text: 'Here is the label photo.' },
      { type: 'file', mediaType: 'image/jpeg', url: 'data:image/jpeg;base64,TEFCRUw=' },
    ],
  },
])
```

Expected assertion:

```ts
expect(uploadJewelryPhotoMock.mock.calls[0][1]).toBe('data:image/png;base64,SlRZ')
```

- [ ] **Step 2: Run the add-listing tests**

Run:

```bash
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts
```

Expected: PASS if current latest-message resolution is enough; FAIL if the helper still scans too broadly.

- [ ] **Step 3: Patch only if needed**

If the test fails because `resolvePhotoFromConversation` picks an older label photo, change the final new-design photo request to prefer the latest user message with an image unless `piecePhotoIndex` points to a specific multi-photo message.

- [ ] **Step 4: Run test again**

Run:

```bash
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit only this task if executing with frequent commits**

```bash
git add lib/nic-nac/tools/add-listing.ts tests/nic-nac/add-listing-recovery.test.ts
git commit -m "test: cover guided jewelry photo intake order"
```

---

### Task 6: Focused Verification

**Files:**
- No source changes unless failures reveal a bug.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm exec vitest run tests/nic-nac/tool-routing.test.ts tests/nic-nac/prompt-routing.test.ts tests/nic-nac/system-prompt-add-listing.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/help-resources.test.ts tests/reviewer-smoke-ui.test.ts
```

Expected: PASS.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: Next.js production build succeeds.

- [ ] **Step 3: Browser QA on local or deployed preview**

Open the workspace and verify:

```text
1. The quick chip "Add a piece to Trade Board" is visible in workspace Nic-Nac.
2. Clicking it sends the starter text.
3. Nic-Nac asks for item number first.
4. Replying ER13743 keeps the flow in trade-board tools.
5. Help & Resources search for "light box" returns the new guide.
```

- [ ] **Step 4: Deploy only after Louis approves implementation**

Deploy command:

```bash
npx vercel --yes
npx vercel alias set <new-preview-url> sparkle-suite-demo.vercel.app
```

Expected: `https://sparkle-suite-demo.vercel.app/` points to the new deployment.

---

## Self-Review

**Spec coverage:** The plan covers the quick action, item-number-first lookup, existing-item fast path, missing-catalog intake, collection-on-packaging rule, front-photo quality guidance, help/resource guide, tests, build, QA, and deployment.

**Placeholder scan:** No task depends on unspecified future behavior. The only conditional step is explicitly bounded: patch photo resolution only if the regression test exposes a gap.

**Type consistency:** The plan uses existing tool names `search_jewelry_database` and `add_listing`, existing photo index names `piecePhotoIndex` and `listingPhotoIndex`, and existing help-resource fields `id`, `category`, `title`, `summary`, `body`, `quickActions`, and `video`.

**Recommended execution:** Subagent-driven execution is useful here because the chat workflow, help guide, and UI chip are separable. Keep final integration and deploy in the main session so the stable demo link stays controlled.
