# Nic-Nac Trade Photo Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop Nic-Nac from saving label/back-of-card photos as Trade Board jewelry photos, add guarded zoom/crop support for clear small jewelry photos, and make the rep/customer boards expose photo quality/source issues before launch.

**Architecture:** Treat chat photos as candidate assets with ordering, role, quality, and provenance instead of anonymous file parts. Select or reject a photo before any canonical/listing write, then render source/quality state in the workspace and customer board so bad images cannot silently ship.

**Tech Stack:** Next.js App Router, AI SDK UI message parts/tools, Supabase/Postgres/storage, sharp image processing, Vitest.

---

## Audit Findings

1. The current bad Trade Board image is a stored source image, not a render crop issue. The visible `The Elodie Luxe` listings all use the same public Supabase image of the box/card back with the printed label and earring backs.
2. The newest three board listings use canonical fallback behavior: `listing_photo_url` is not the intended jewelry-front photo, so `DashboardPlaceholder.tsx` and the customer board both render `listing.listing_photo_url ?? listing.design.canonical_photo_url`.
3. `app/nic-nac/_client.tsx` compresses multiple attachments in parallel and pushes each result as it completes. This can reorder the rep's selected photos.
4. `lib/nic-nac/tools/add-listing.ts` currently uses "last image wins" when resolving a chat photo from conversation history.
5. Nic-Nac's model may visually understand which photo is the label and which is the jewelry, but the tool independently chooses an image from persisted parts unless the model passes an explicit photo URL.
6. `listing-photo-processing.ts` and `design-source-photo-processing.ts` check size, blur, lighting, framing, and detail, but do not check whether the photo is actually a front-facing jewelry photo rather than packaging/text/card/label.
7. Existing catalog designs with a bad canonical photo can be repeatedly listed without revalidating or replacing that canonical photo.
8. Batch recovery creates a new design once, then additional physical units fall back to canonical photo, which multiplies one bad canonical image across all duplicate listings.
9. The workspace and customer board do not show whether an image came from a custom listing photo, canonical fallback, chat auto-selection, or enhancement output.
10. There is no guarded auto-zoom/crop path for photos where the jewelry is clear but too small inside a larger frame.

## Batch 1: Stop Wrong Photo Selection

**Files:**
- Modify: `app/nic-nac/_client.tsx`
- Modify: `lib/nic-nac/tools/add-listing.ts`
- Test: `tests/nic-nac-client-attachment-order.test.ts`
- Test: `tests/nic-nac/add-listing-recovery.test.ts`

- [ ] **Step 1: Add a failing client attachment order test**

Create a focused test that simulates two selected files whose compression resolves out of order and asserts the submitted UI message parts preserve original selection order.

Run: `npm exec vitest run tests/nic-nac-client-attachment-order.test.ts`

Expected before fix: FAIL because accepted attachments are pushed by completion order.

- [ ] **Step 2: Preserve selected file order in the client**

In `handlePickFiles`, replace `accepted.push(...)` inside `Promise.all` with an indexed result array:

```ts
const results = await Promise.all(
  slice.map(async (file, index) => {
    try {
      const compressed = await compressImage(file)
      return {
        index,
        attachment: {
          id: newAttachmentId(),
          dataUrl: compressed.dataUrl,
          mediaType: 'image/jpeg' as const,
          width: compressed.width,
          height: compressed.height,
          blurRisk: compressed.blurRisk,
          lightingRisk: compressed.lightingRisk,
          subjectCoverage: compressed.subjectCoverage,
          subjectCentered: compressed.subjectCentered,
        },
      }
    } catch {
      failed.push(file.name || 'image')
      return null
    }
  }),
)
const accepted = results
  .filter((result): result is NonNullable<typeof result> => result !== null)
  .sort((a, b) => a.index - b.index)
  .map((result) => result.attachment)
```

- [ ] **Step 3: Add a failing server test for label/card vs jewelry selection**

In `tests/nic-nac/add-listing-recovery.test.ts`, add cases where both images exist and the label/back-card is last. The tool must not select the last image blindly.

Expected before fix: FAIL because `resolvePhotoFromConversation` chooses the last image.

- [ ] **Step 4: Extract photo candidate selection**

Create a helper near `resolvePhotoFromConversation` that returns all image parts with `messageId`, `partIndex`, dimensions, quality signals, and URL.

Selection rule for Batch 1:
- If one explicit `listingPhotoUrl` or `piecePhotoUrl` is supplied, use it.
- If exactly one chat image exists, use it only after existing preflight passes.
- If multiple chat images exist and no explicit selected image exists, do not guess by order; return a tool error/needs-action asking the rep to pick or send the jewelry-front photo.

- [ ] **Step 5: Update prompt/tool copy**

Update the `add_listing` tool description and trade-board prompt to say Nic-Nac must keep label photos for reading item details and only save jewelry-front photos to the board. If multiple images are present, Nic-Nac should identify which one it intends to use before writing.

- [ ] **Step 6: Verify Batch 1**

Run:

```bash
npm exec vitest run tests/nic-nac-client-attachment-order.test.ts tests/nic-nac/add-listing-recovery.test.ts tests/nic-nac/tool-routing.test.ts
npx tsc --noEmit --pretty false
```

## Batch 2: Semantic Photo Guardrails

**Files:**
- Create: `lib/services/jewelry-photo-semantics.ts`
- Modify: `lib/services/listing-photo-processing.ts`
- Modify: `lib/services/design-source-photo-processing.ts`
- Test: `tests/services/jewelry-photo-semantics.test.ts`
- Test: `tests/services/listing-photo-processing.test.ts`
- Test: `tests/services/design-source-photo-processing.test.ts`

- [ ] **Step 1: Add semantic classifier tests**

Create synthetic fixtures for:
- front-facing jewelry on clean background
- box/card/label with readable text and tiny jewelry
- low-quality blurry jewelry
- clear small jewelry that could be cropped

Expected before implementation: FAIL because no classifier exists.

- [ ] **Step 2: Implement conservative semantic classification**

Add a classifier that returns:

```ts
type JewelryPhotoSemanticResult = {
  role: 'jewelry' | 'label_or_packaging' | 'uncertain'
  confidence: number
  reasons: string[]
  canAttemptCrop: boolean
}
```

Use existing image signals first. Treat very low subject coverage plus high text/detail density and poor background cleanliness as `label_or_packaging`. Treat clear centered subject with clean background as `jewelry`. Treat borderline cases as `uncertain`.

- [ ] **Step 3: Block bad semantics before upload/write**

In both listing and design source processing:
- reject `label_or_packaging`
- reject low-confidence `uncertain` for automatic writes
- return user-safe coaching that asks for the actual jewelry-front photo

- [ ] **Step 4: Verify Batch 2**

Run:

```bash
npm exec vitest run tests/services/jewelry-photo-semantics.test.ts tests/services/listing-photo-processing.test.ts tests/services/design-source-photo-processing.test.ts tests/nic-nac/add-listing-recovery.test.ts
npx tsc --noEmit --pretty false
```

## Batch 3: Guarded Zoom/Crop

**Files:**
- Create: `lib/services/jewelry-photo-crop.ts`
- Modify: `lib/services/listing-photo-processing.ts`
- Modify: `lib/services/design-source-photo-processing.ts`
- Test: `tests/services/jewelry-photo-crop.test.ts`
- Test: `tests/services/listing-photo-processing.test.ts`

- [ ] **Step 1: Add failing crop tests**

Test that a clear, centered, small jewelry subject is cropped with margin and rechecked, while label/card and blurry images are not auto-cropped.

- [ ] **Step 2: Implement crop candidate generation**

Use `sharp` to create a conservative crop around the detected subject bounds with padding. Re-run `analyzeServerImageQuality`, semantic classification, and preflight on the cropped image.

- [ ] **Step 3: Select crop only when it improves quality**

Only use the crop if:
- semantic result is `jewelry`
- subject coverage improves materially
- blur/detail do not regress
- output remains above minimum resolution

- [ ] **Step 4: Report crop provenance**

Return `selectedSource: 'original' | 'enhanced' | 'cropped' | 'cropped_enhanced'` from processing helpers so UI and tests can verify the path.

## Batch 4: Workspace And Customer Board Visibility

**Files:**
- Modify: `app/nic-nac/components/DashboardPlaceholder.tsx`
- Modify: `app/nic-nac/components/DashboardPlaceholder.module.css`
- Modify: `lib/amethyst/trade-board-listings.ts`
- Modify: `public/amethyst/trade.jsx`
- Test: `tests/nic-nac-dashboard-placeholder.test.ts`
- Test: `tests/amethyst-trade-template.test.ts`

- [ ] **Step 1: Add photo source rendering tests**

Assert workspace and customer board can distinguish custom listing photo, canonical fallback, and missing/bad photo state.

- [ ] **Step 2: Add workspace photo source/bad-photo indicators**

Show a compact source indicator in the rep workspace only. Do not clutter the customer board with internal language.

- [ ] **Step 3: Add click-to-zoom**

Make board thumbnails open the full image in a lightweight modal or focused preview so reps can inspect whether the board is showing the actual jewelry.

- [ ] **Step 4: Verify visual behavior**

Use the in-app browser at `/nic-nac?c=1fa4ba02-154e-4d5b-aef2-759cb13abbfb` and the customer board link. Confirm no overlap, no console errors, and photo preview opens/closes.

## Batch 5: Existing Bad Data Recovery

**Files:**
- Create: `scripts/audit-trade-board-photos.ts`
- Optional migration only if needed after code plan approval.

- [ ] **Step 1: Add read-only audit script**

Scan available listings and canonical photos for likely label/packaging semantics. Output listing/design ids, item numbers, photo URLs, and recommended action. Do not mutate data.

- [ ] **Step 2: Run against Jane/Jane Sparkles demo account**

Confirm `ER76003 / The Elodie Luxe` is flagged as a bad canonical photo.

- [ ] **Step 3: Prepare manual recovery path**

After explicit approval, remove or replace the bad canonical photo and require a new jewelry-front photo before the piece appears with a customer-facing image.

## Final Verification

Run:

```bash
npm exec vitest run tests/nic-nac/add-listing-recovery.test.ts tests/services/listing-photo-processing.test.ts tests/services/design-source-photo-processing.test.ts tests/nic-nac-dashboard-placeholder.test.ts tests/amethyst-trade-template.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Browser smoke:
- Open the current Nic-Nac workspace URL.
- Add a known piece with label + jewelry photos.
- Verify the wrong card photo is rejected or a confirmation is requested.
- Add a clear small jewelry photo and verify crop/zoom is used only when quality passes.
- Confirm workspace and customer board show the corrected image without manual refresh.
