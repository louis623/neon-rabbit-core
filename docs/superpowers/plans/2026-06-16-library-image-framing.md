# Sparkle Finder Library Image Framing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve Sparkle Finder library image framing so API/database jewelry photos show more of the actual piece and avoid awkward bottom cropping in cards and item detail pages.

**Architecture:** Start with a Finder-side presentation fix because the API already sends `canonicalPhotoUrl` into `JewelryItem.imageUrl`; the current crop is caused by `bg-cover bg-center` in Finder. Add a reusable image-frame component with type-aware default focal positioning, apply it to the library grid and item detail hero, then verify with screenshot tests. Keep API/database focal-point metadata as a second phase only if default framing is not enough.

**Tech Stack:** Next.js App Router, React, Tailwind utility classes, Vitest route rendering tests, Sparkle Finder smoke/Playwright flow.

---

## Files

- Create: `C:\Users\louis\sparkle-finder-repo\components\library\JewelryImageFrame.tsx`
  - Reusable display component for jewelry library photos.
  - Owns `object-fit`, focal-position defaults, placeholder state, and accessible image labeling.
- Modify: `C:\Users\louis\sparkle-finder-repo\components\library\JewelryCard.tsx`
  - Replace background-image card thumbnail with `JewelryImageFrame`.
- Modify: `C:\Users\louis\sparkle-finder-repo\app\(hub)\library\[itemId]\page.tsx`
  - Replace detail hero background-image with `JewelryImageFrame`.
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`
  - Add rendering assertions for image-fit classes and focal defaults.
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\smoke\sparkle-finder-home.spec.ts`
  - Add a lightweight smoke assertion that a real API-backed library item renders an image frame without falling back to the placeholder.

## Product Recommendation

Use a two-stage image strategy:

1. Immediate Finder-side improvement:
   - Use a reusable frame with `object-fit: contain` by default for library thumbnails.
   - Give the image a soft off-white/pink background so letterboxing feels intentional.
   - Increase card image area from `aspect-[4/3]` to `aspect-[4/3] sm:aspect-[16/11]` only if visual QA shows the card needs more height.
   - Apply type-aware default `object-position`:
     - necklaces: `center 58%`
     - earrings: `center 52%`
     - rings/bracelets/stacks: `center center`
   - This avoids cutting off the lower pendant while keeping cards neat.

2. Later metadata enhancement if needed:
   - Add optional `imageFocalX`, `imageFocalY`, and `imageFit` metadata in Sparkle Suite.
   - Send those fields through the Finder catalog API.
   - Map them into Sparkle Finder `JewelryItem`.
   - Use metadata when present, otherwise fall back to type-aware defaults.

The first stage should fix the screenshot issue without changing the API or database.

---

### Task 1: Add a Reusable Jewelry Image Frame

**Files:**
- Create: `C:\Users\louis\sparkle-finder-repo\components\library\JewelryImageFrame.tsx`
- Test: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Write the failing route-rendering test**

Add this test near the existing library route tests in `tests\sparkle-finder\routes.test.ts`:

```ts
it("renders library photos with containment framing instead of cover cropping", () => {
  const markup = renderToStaticMarkup(
    <JewelryCard
      item={{
        id: "bp-necklace-piper",
        name: "The Piper Necklace",
        collectionName: "July Birthday",
        collectionYear: 2026,
        jewelryType: "necklace",
        material: "Rhodium Plating",
        mainStone: "Lab-Created Ruby",
        bpMsrp: 39.95,
        imageUrl: "https://cdn.example.test/piper-necklace.jpg",
        bpLabel: "standard",
        itemNumber: "NK1234",
        searchTags: ["necklace", "ruby"],
        availableListingCount: 0,
        knownRepListingIds: [],
      }}
    />,
  );

  expect(markup).toContain("object-contain");
  expect(markup).toContain("object-position:center 58%");
  expect(markup).not.toContain("bg-cover");
});
```

If `JewelryCard` is not already imported in that test file, add:

```ts
import { JewelryCard } from "@/components/library/JewelryCard";
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL because `JewelryCard` still uses `bg-cover bg-center` and does not render `object-contain`.

- [ ] **Step 3: Create the minimal image-frame component**

Create `components\library\JewelryImageFrame.tsx`:

```tsx
import { Gem } from "lucide-react";
import type { JewelryType } from "@/lib/sparkle-finder/types";

type JewelryImageFrameProps = {
  imageUrl: string;
  name: string;
  jewelryType: JewelryType;
  variant?: "card" | "detail";
};

export function JewelryImageFrame({
  imageUrl,
  name,
  jewelryType,
  variant = "card",
}: JewelryImageFrameProps) {
  const iconSize = variant === "detail" ? "size-20" : "size-12";

  return (
    <div className="grid size-full place-items-center bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
      {imageUrl ? (
        <img
          alt={name}
          className="size-full object-contain"
          loading={variant === "card" ? "lazy" : "eager"}
          src={imageUrl}
          style={{ objectPosition: getDefaultObjectPosition(jewelryType) }}
        />
      ) : (
        <Gem aria-hidden="true" className={iconSize} strokeWidth={variant === "detail" ? 1.2 : 1.4} />
      )}
    </div>
  );
}

function getDefaultObjectPosition(jewelryType: JewelryType) {
  if (jewelryType === "necklace") {
    return "center 58%";
  }

  if (jewelryType === "earrings") {
    return "center 52%";
  }

  return "center center";
}
```

- [ ] **Step 4: Run the focused test and confirm it still fails until the card uses the component**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL for the new assertion until `JewelryCard` is updated.

---

### Task 2: Apply the Frame to Library Cards

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\components\library\JewelryCard.tsx`
- Test: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Replace the card background image**

In `JewelryCard.tsx`, replace:

```tsx
import { Gem } from "lucide-react";
```

with:

```tsx
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
```

Then replace the current image block:

```tsx
<div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[rgba(239,201,201,0.72)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
  {item.imageUrl ? (
    <div
      aria-label={item.name}
      className="size-full bg-cover bg-center"
      role="img"
      style={{ backgroundImage: `url("${item.imageUrl}")` }}
    />
  ) : (
    <Gem aria-hidden="true" className="size-12" strokeWidth={1.4} />
  )}
</div>
```

with:

```tsx
<div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[rgba(239,201,201,0.72)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]">
  <JewelryImageFrame imageUrl={item.imageUrl} jewelryType={item.jewelryType} name={item.name} />
</div>
```

- [ ] **Step 2: Run the focused route test**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS for the new card image containment assertion.

- [ ] **Step 3: Review visual tradeoff**

Start the local app if needed:

```powershell
npm run dev -- --hostname 127.0.0.1 --port 4310
```

Open:

```text
http://127.0.0.1:4310/library
```

Expected visual result:

- The Piper Necklace pendant is no longer cut off at the bottom.
- Cards may show more background/letterboxing, but the jewelry should be fully visible.
- No card text overlaps the image.

---

### Task 3: Apply the Frame to the Item Detail Hero

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\app\(hub)\library\[itemId]\page.tsx`
- Test: `C:\Users\louis\sparkle-finder-repo\tests\sparkle-finder\routes.test.ts`

- [ ] **Step 1: Add a failing assertion for detail-page containment**

Add or update a detail-page route test in `tests\sparkle-finder\routes.test.ts`:

```ts
it("renders library detail photos with full-photo framing", () => {
  const markup = renderToStaticMarkup(
    renderItemDetailPageContent(
      { itemId: "bp-necklace-piper" },
      {
        status: "authenticated",
        customer: {
          id: "customer-1",
          email: "marlena@example.test",
          displayName: "Marlena",
          plan: "silver",
        },
      },
      {
        id: "bp-necklace-piper",
        name: "The Piper Necklace",
        collectionName: "July Birthday",
        collectionYear: 2026,
        jewelryType: "necklace",
        material: "Rhodium Plating",
        mainStone: "Lab-Created Ruby",
        bpMsrp: 39.95,
        imageUrl: "https://cdn.example.test/piper-necklace.jpg",
        bpLabel: "standard",
        itemNumber: "NK1234",
        searchTags: ["necklace", "ruby"],
        availableListingCount: 0,
        knownRepListingIds: [],
      },
    ),
  );

  expect(markup).toContain("object-contain");
  expect(markup).toContain("object-position:center 58%");
  expect(markup).not.toContain("bg-cover");
});
```

If `renderItemDetailPageContent` is not already imported, add:

```ts
import { renderItemDetailPageContent } from "@/app/(hub)/library/[itemId]/page";
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL because the detail page still uses `bg-cover bg-center`.

- [ ] **Step 3: Replace detail hero background image**

In `app\(hub)\library\[itemId]\page.tsx`, replace:

```tsx
import { Gem } from "lucide-react";
```

with:

```tsx
import { JewelryImageFrame } from "@/components/library/JewelryImageFrame";
```

Then replace the hero image block:

```tsx
<div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)] text-[var(--sparkle-plum)]">
  {item.imageUrl ? (
    <div
      aria-label={item.name}
      className="size-full bg-cover bg-center"
      role="img"
      style={{ backgroundImage: `url("${item.imageUrl}")` }}
    />
  ) : (
    <Gem aria-hidden="true" className="size-20" strokeWidth={1.2} />
  )}
</div>
```

with:

```tsx
<div className="grid aspect-[16/10] place-items-center overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fffefd,#fff3f0)]">
  <JewelryImageFrame imageUrl={item.imageUrl} jewelryType={item.jewelryType} name={item.name} variant="detail" />
</div>
```

- [ ] **Step 4: Run the focused route test**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

---

### Task 4: Visual QA and Smoke Coverage

**Files:**
- Modify: `C:\Users\louis\sparkle-finder-repo\tests\smoke\sparkle-finder-home.spec.ts`

- [ ] **Step 1: Add a smoke assertion for the library image frame**

In the library-related smoke flow, add:

```ts
await page.goto(`${baseUrl}/library`, { waitUntil: "domcontentloaded" });
await expect(page.getByRole("img", { name: "The Piper Necklace" })).toBeVisible();
```

If the real API data means `The Piper Necklace` can change, prefer a stable selector by adding `data-smoke="library-image-frame"` to the wrapper in `JewelryImageFrame` and assert:

```ts
await expect(page.locator('[data-smoke="library-image-frame"]').first()).toBeVisible();
```

- [ ] **Step 2: Run focused unit/route coverage**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/catalog-service.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run the Sparkle Finder smoke suite**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected: PASS with the current expected skipped count.

- [ ] **Step 4: Browser visual QA**

Use Browser plugin if available. The flow under test is:

```text
/library -> API-backed jewelry grid renders -> thumbnails show complete jewelry without awkward bottom clipping
```

Check:

- Desktop viewport: `1440x900`
- Mobile viewport: `390x844`
- Library grid first viewport
- At least one necklace detail page
- Console errors/warnings
- No framework overlay
- No broken image icons
- No text/image overlap

Expected result:

- Necklace pendant is visible rather than cut off at the bottom.
- Earrings still look centered.
- Detail hero displays the full photo cleanly.
- Cards still scan neatly and do not become too tall.

---

### Task 5: Optional Sparkle Suite Metadata Follow-Up

Only do this task if visual QA shows default Finder framing is still inconsistent across many real uploaded photos.

**Files:**
- Sparkle Suite API and database files must be inspected in `C:\Users\louis\sparkle-suite-repo` before editing.
- Sparkle Finder mapping file: `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\catalog-service.ts`
- Sparkle Finder type file: `C:\Users\louis\sparkle-finder-repo\lib\sparkle-finder\types.ts`

- [ ] **Step 1: Add optional Finder fields**

In `lib\sparkle-finder\types.ts`, extend `JewelryItem`:

```ts
imageFocalX?: number;
imageFocalY?: number;
imageFit?: "contain" | "cover";
```

- [ ] **Step 2: Map API focal metadata when available**

In `catalog-service.ts`, map fields from Sparkle Suite API payload after those fields exist upstream:

```ts
imageFocalX: typeof item.imageFocalX === "number" ? item.imageFocalX : undefined,
imageFocalY: typeof item.imageFocalY === "number" ? item.imageFocalY : undefined,
imageFit: item.imageFit === "cover" ? "cover" : "contain",
```

- [ ] **Step 3: Use focal metadata in `JewelryImageFrame`**

Update `JewelryImageFrameProps`:

```ts
imageFocalX?: number;
imageFocalY?: number;
imageFit?: "contain" | "cover";
```

Use:

```tsx
const objectPosition =
  typeof imageFocalX === "number" && typeof imageFocalY === "number"
    ? `${imageFocalX}% ${imageFocalY}%`
    : getDefaultObjectPosition(jewelryType);
```

And:

```tsx
className={`size-full ${imageFit === "cover" ? "object-cover" : "object-contain"}`}
```

- [ ] **Step 4: Add API mapping tests**

In `tests\sparkle-finder\catalog-service.test.ts`, assert focal metadata maps only when supplied and defaults safely when absent.

---

## Self-Review

Spec coverage:

- Shows more image and avoids bottom cutoff: Task 1-3.
- Dynamic centering/default focal behavior: Task 1 plus optional Task 5.
- Database/API consideration: Product recommendation plus Task 5.
- Visual/browser proof: Task 4.

No API/database change is required for the first fix because the observed issue comes from Finder presentation classes.

No placeholders remain in the required implementation path.
