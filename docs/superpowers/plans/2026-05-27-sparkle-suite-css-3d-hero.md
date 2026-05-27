# Sparkle Suite CSS 3D Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the new CSS 3D Product Hero skill to the Sparkle Suite home-page hero so the product mockup feels dimensional instead of like flat cards around a tilted screenshot.

**Architecture:** Keep the existing React content and Sparkle Suite brand/copy intact. Add a true 3D scene wrapper around the current product universe, then move the browser screen and feature cards into shared parent perspective with `transform-style: preserve-3d`, tuned `translateZ()` depth, and shadows that match the perceived distance.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, global CSS, Vitest static render tests, Codex in-app Browser visual verification.

---

## File Structure

- Modify `app/_components/sparkle-suite-public-landing.tsx`
  - Add stable CSS 3D scene classes to the hero product mockup.
  - Wrap the current product screen/cards in a dedicated `.sl-product-stage`.
  - Preserve the current content, links, labels, and accessibility names.

- Modify `app/globals.css`
  - Replace the flat 2D cascade transforms with shared perspective and Z-depth.
  - Keep flattening hazards off `.sl-product-stage`.
  - Add desktop, tablet, mobile, and reduced-motion rules.

- Modify `tests/sparkle-suite-public-landing.test.ts`
  - Add a static render contract test that proves the hero has the expected CSS 3D scene structure.

---

### Task 1: Add CSS 3D Scene Render Contract

**Files:**
- Modify: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add a failing static render test**

Add this test inside the existing `describe('Sparkle Suite public landing page', () => { ... })` block:

```ts
  it('renders the hero product mockup as a CSS 3D scene', () => {
    const html = renderLanding()

    expect(html).toContain('sl-product-scene')
    expect(html).toContain('sl-product-stage')
    expect(html).toContain('sl-depth-object--screen')
    expect(html).toContain('sl-depth-object--queue')
    expect(html).toContain('sl-depth-object--trade')
    expect(html).toContain('sl-depth-object--calendar')
    expect(html).toContain('sl-depth-object--email')
    expect(html).toContain('sl-depth-object--sms')
    expect(html).toContain('sl-depth-object--nic-nac')
  })
```

- [ ] **Step 2: Run the focused test and confirm it fails**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: FAIL because `sl-product-scene`, `sl-product-stage`, and the `sl-depth-object--*` classes are not present yet.

---

### Task 2: Add The 3D Scene Markup

**Files:**
- Modify: `app/_components/sparkle-suite-public-landing.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add depth classes to mini product cards**

Change the `ProductMiniScreen` article class to:

```tsx
    <article
      className={`sl-product-card sl-depth-object sl-depth-object--${screen.id} sl-product-card--${screen.id}`}
    >
```

- [ ] **Step 2: Wrap the product universe in a 3D stage**

Replace the opening of `ProductScreenCascade` with this structure, keeping the existing browser-card contents, connector divs, and mapped cards inside `.sl-product-stage`:

```tsx
  return (
    <div
      aria-label="Sparkle Suite product previews"
      className="sl-product-universe sl-cascade sl-product-scene"
    >
      <div className="sl-product-stage">
        <article className="sl-browser-card sl-depth-object sl-depth-object--screen">
          <div className="sl-browser-card__chrome">
            <SparkleSeal className="sl-browser-card__seal" />
            <nav aria-label="Example customer site navigation">
              <span>Home</span>
              <span>Live Shows</span>
              <span>Trades</span>
              <span>About</span>
              <span>Contact</span>
            </nav>
            <span>Join the List</span>
          </div>
```

Then close the new stage after the mapped mini screens:

```tsx
        {hero.screens.slice(1).map((screen) => (
          <ProductMiniScreen key={screen.id} screen={screen} />
        ))}
      </div>
    </div>
  )
```

- [ ] **Step 3: Run the focused test and confirm it passes structurally**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS. The page still renders the same content, but now has a real scene/stage structure ready for CSS depth.

---

### Task 3: Apply The Desktop 3D Camera And Depth

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Replace the flat cascade foundation**

In the `.sparkle-landing` landing-page CSS block, replace the current `.sl-cascade`, `.sl-product-universe`, `.sl-browser-card`, `.sl-product-card`, card-position, and hover transform rules with this 3D foundation:

```css
.sparkle-landing .sl-cascade {
  min-height: 640px;
  position: relative;
}

.sparkle-landing .sl-product-universe {
  min-height: 640px;
  position: relative;
}

.sparkle-landing .sl-product-scene {
  perspective: 1180px;
  perspective-origin: 62% 36%;
}

.sparkle-landing .sl-product-stage {
  inset: 0;
  position: absolute;
  transform-style: preserve-3d;
}

.sparkle-landing .sl-product-stage::before {
  background: radial-gradient(ellipse, rgba(64, 41, 36, 0.2), transparent 68%);
  bottom: 18px;
  content: "";
  height: 120px;
  left: 18%;
  pointer-events: none;
  position: absolute;
  transform: translate3d(0, 0, -140px) rotateX(72deg);
  transform-origin: center;
  width: 72%;
}

.sparkle-landing .sl-depth-object {
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.sparkle-landing .sl-browser-card {
  background: rgba(255, 255, 255, 0.9);
  border: 2px solid rgba(64, 41, 36, 0.78);
  border-radius: 12px;
  box-shadow:
    0 42px 84px rgba(64, 41, 36, 0.24),
    0 12px 28px rgba(238, 44, 155, 0.1);
  left: 12px;
  overflow: hidden;
  position: absolute;
  top: 8px;
  transform:
    translate3d(-2%, 5%, 0)
    rotateX(7deg)
    rotateY(-13deg)
    rotateZ(-2deg);
  transform-origin: 54% 46%;
  width: 620px;
  z-index: 2;
}

.sparkle-landing .sl-product-card {
  --sl-card-depth-transform: translate3d(0, 0, 90px);
  background: rgba(255, 255, 255, 0.96);
  border: 1px solid rgba(238, 44, 155, 0.22);
  border-radius: 14px;
  box-shadow:
    0 28px 56px rgba(64, 41, 36, 0.18),
    0 8px 18px rgba(238, 44, 155, 0.08);
  padding: 15px;
  position: absolute;
  transform: var(--sl-card-depth-transform);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
  width: 194px;
  z-index: 3;
}

.sparkle-landing .sl-product-card:hover {
  box-shadow:
    0 34px 66px rgba(64, 41, 36, 0.2),
    0 10px 22px rgba(238, 44, 155, 0.1);
  transform: var(--sl-card-depth-transform) translateY(-4px);
}
```

- [ ] **Step 2: Replace the individual card transforms with real Z-depth**

Use these card-specific rules:

```css
.sparkle-landing .sl-product-card--queue {
  --sl-card-depth-transform:
    translate3d(0, 0, 175px)
    rotateX(4deg)
    rotateY(-9deg)
    rotateZ(1.5deg);
  right: 0;
  top: 42px;
}

.sparkle-landing .sl-product-card--trade {
  --sl-card-depth-transform:
    translate3d(0, 0, 140px)
    rotateX(3deg)
    rotateY(-7deg)
    rotateZ(1deg);
  right: 18px;
  top: 226px;
}

.sparkle-landing .sl-product-card--calendar {
  --sl-card-depth-transform:
    translate3d(0, 0, 120px)
    rotateX(5deg)
    rotateY(8deg)
    rotateZ(3deg);
  bottom: 76px;
  left: 72px;
}

.sparkle-landing .sl-product-card--email {
  --sl-card-depth-transform:
    translate3d(0, 0, 110px)
    rotateX(4deg)
    rotateY(3deg)
    rotateZ(2deg);
  bottom: 56px;
  left: 264px;
}

.sparkle-landing .sl-product-card--sms {
  --sl-card-depth-transform:
    translate3d(0, 0, 150px)
    rotateX(5deg)
    rotateY(-5deg)
    rotateZ(2deg);
  bottom: 44px;
  right: 210px;
}

.sparkle-landing .sl-product-card--nic-nac {
  --sl-card-depth-transform:
    translate3d(0, 0, 185px)
    rotateX(5deg)
    rotateY(-8deg)
    rotateZ(2.5deg);
  bottom: 24px;
  right: 0;
}
```

- [ ] **Step 3: Keep connector lines inside the same scene**

Update connector depth so the dotted lines do not look pasted on top:

```css
.sparkle-landing .sl-connector {
  border-top: 2px dashed rgba(238, 44, 155, 0.36);
  position: absolute;
  transform: translate3d(0, 0, 70px);
  transform-style: preserve-3d;
  z-index: 1;
}
```

- [ ] **Step 4: Run static checks**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
npx tsc --noEmit --pretty false
```

Expected: PASS.

---

### Task 4: Add Tablet, Mobile, And Reduced-Motion Rules

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Tune tablet instead of letting desktop 3D squeeze**

Inside the existing `@media (max-width: 980px)` block, update the hero visual rules:

```css
  .sparkle-landing .sl-product-scene {
    perspective: 1380px;
    perspective-origin: 54% 32%;
  }

  .sparkle-landing .sl-product-stage {
    min-height: 700px;
  }

  .sparkle-landing .sl-browser-card {
    left: 2%;
    transform:
      translate3d(0, 3%, 0)
      rotateX(5deg)
      rotateY(-8deg)
      rotateZ(-1.5deg);
    width: 72%;
  }
```

- [ ] **Step 2: Use a composed mobile fallback**

Inside the existing `@media (max-width: 640px)` block, replace the current `.sl-cascade`, `.sl-browser-card`, `.sl-product-card`, and `.sl-connector` mobile overrides with:

```css
  .sparkle-landing .sl-cascade,
  .sparkle-landing .sl-product-universe {
    display: grid;
    gap: 12px;
    min-height: auto;
  }

  .sparkle-landing .sl-product-scene {
    perspective: none;
  }

  .sparkle-landing .sl-product-stage {
    display: grid;
    gap: 12px;
    position: relative;
    transform-style: flat;
  }

  .sparkle-landing .sl-product-stage::before,
  .sparkle-landing .sl-connector {
    display: none;
  }

  .sparkle-landing .sl-browser-card {
    position: relative;
    left: auto;
    top: auto;
    transform: none;
    width: 100%;
  }

  .sparkle-landing .sl-product-card,
  .sparkle-landing .sl-product-card--queue,
  .sparkle-landing .sl-product-card--trade,
  .sparkle-landing .sl-product-card--calendar,
  .sparkle-landing .sl-product-card--email,
  .sparkle-landing .sl-product-card--sms,
  .sparkle-landing .sl-product-card--nic-nac {
    --sl-card-depth-transform: none;
    inset: auto;
    min-height: auto;
    position: relative;
    width: auto;
  }
```

- [ ] **Step 3: Respect reduced motion**

Extend the existing `@media (prefers-reduced-motion: reduce)` block:

```css
  .sparkle-landing .sl-product-stage,
  .sparkle-landing .sl-browser-card,
  .sparkle-landing .sl-product-card {
    animation: none !important;
  }
```

- [ ] **Step 4: Run static checks**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
npx tsc --noEmit --pretty false
```

Expected: PASS.

---

### Task 5: Rendered Browser Smoke And Tuning Loop

**Files:**
- Modify if needed: `app/globals.css`

- [ ] **Step 1: Make sure the dev server is running**

Use the existing local app at:

```text
http://localhost:3000/
```

If the server is not responding, start it with:

```powershell
npm run dev
```

- [ ] **Step 2: Verify desktop**

Use the in-app Browser at approximately `1600x900`.

Expected:

- The right hero visual has a shared 3D camera.
- The main browser screen is larger and feels like a product object.
- Feature cards float in front with varied depth, not like sticky notes.
- The CTA and first value row remain visible.
- The dark comparison band peeks below the first viewport, similar to the approved mockup.
- No horizontal scroll.

- [ ] **Step 3: Verify current in-app viewport**

Use the actual in-app browser size Louis is looking at.

Expected:

- Hero still feels dimensional.
- Cards do not cover the main product headline in a messy way.
- Header, CTA, and product mockup all remain readable.

- [ ] **Step 4: Verify mobile**

Use a `390x844` mobile viewport.

Expected:

- No horizontal scroll.
- The product proof stacks intentionally.
- Text stays readable.
- CTA remains easy to find.

- [ ] **Step 5: Tune only the camera variables if the scene is close**

If the scene is close but not quite dimensional enough, tune in this order:

```css
.sparkle-landing .sl-product-scene {
  perspective: 1120px;
  perspective-origin: 64% 34%;
}

.sparkle-landing .sl-browser-card {
  transform:
    translate3d(-2%, 5%, 0)
    rotateX(8deg)
    rotateY(-15deg)
    rotateZ(-2deg);
}
```

If the cards still feel pasted on, increase individual `translate3d(0, 0, Npx)` values by `20px` to `35px` and soften the matching shadows. Do not add more random offsets.

---

### Task 6: Final Verification And Commit

**Files:**
- Commit only the hero/test changes from this plan.

- [ ] **Step 1: Run final local checks**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
npx tsc --noEmit --pretty false
npm run build
```

Expected: PASS.

- [ ] **Step 2: Confirm clean scoped diff**

Run:

```powershell
git diff -- app/_components/sparkle-suite-public-landing.tsx app/globals.css tests/sparkle-suite-public-landing.test.ts
git status --short
```

Expected:

- Only the planned files changed, plus the already-known untracked `docs/sparkle-suite/marketing/`.
- No changes to live queue, Chrome extension, provider code, Supabase functions, Stripe, SMS, email, SignWell, or calendar paths.

- [ ] **Step 3: Commit**

Run:

```powershell
git add -- app/_components/sparkle-suite-public-landing.tsx app/globals.css tests/sparkle-suite-public-landing.test.ts
git commit -m "feat: add CSS 3D Sparkle Suite landing hero"
```

Expected: Commit contains only the 3D hero refinement and the render contract test.

---

## Acceptance Criteria

- The hero product visual uses shared CSS perspective and `preserve-3d`.
- The main screen and floating cards have real Z-depth with varied shadows.
- The result is visibly closer to the approved mockup's dimensional feel.
- Copy, brand, CTAs, and product labels are unchanged unless Louis explicitly asks for copy edits.
- Mobile remains readable and intentional.
- Tests, typecheck, and production build pass.
- No live/provider/workflow surfaces are touched.
