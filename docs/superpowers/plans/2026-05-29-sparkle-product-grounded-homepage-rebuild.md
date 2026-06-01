# Sparkle Product-Grounded Homepage Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the local-only Sparkle Suite root homepage into a simple, mobile-first, product-grounded landing page that uses real Sparkle Suite/Jane's Sparkle Party surfaces instead of invented UI.

**Architecture:** Create a clean V2 landing surface with isolated `sl2-*` styles and a small content asset manifest. The first screen follows Concept 1: customer site first. The next section follows Concept 2: real workspace proof. The remaining page stays intentionally short: pricing, get-started CTA, compact FAQ/footer.

**Tech Stack:** Next.js App Router, React server components, TypeScript, global CSS in `app/globals.css`, Vitest server-render assertions, local browser verification through the in-app browser.

---

## Production And Safety Guardrails

- Production remains the approved `/prelaunch` page. Do not deploy, push, promote, or change production routing.
- The rebuilt root homepage is local-only until Louis explicitly approves otherwise.
- Do not stage, commit, push, or deploy during execution unless Louis explicitly asks.
- Do not touch `chrome-extension/content.js`, `supabase/functions/live-queue-sync`, `docs/sparkle-suite/marketing`, or attach `+19044383050`.
- Do not show Louis personal identifiers anywhere in the landing page, screenshots, tests, docs, or generated assets.
- Use Jane's Sparkle Party or a sanitized marketing-safe demo identity for product proof.
- Before editing Next.js code, read the relevant Next docs in `node_modules/next/dist/docs/` per `AGENTS.md`.

## Approved Page Shape

1. Header: logo, minimal nav, sign in, primary `Start Sparkle Suite` CTA.
2. Hero: Concept 1 direction, mobile-first, customer site first, real Jane's Sparkle Party/customer-site screenshots.
3. Workspace proof: Concept 2 direction immediately below, real Sparkle Suite/Nic-Nac workspace screenshots with no Louis name or personal identifiers.
4. Pricing: simple pricing section with the current build fee and standard monthly price.
5. Get started: final short CTA to `/start`.
6. Footer: vertical links, Help, Privacy Policy, Terms and Conditions, Sparkle Finder, YouTube, TikTok.

## Files And Responsibilities

- Modify: `app/_components/sparkle-suite-public-landing.tsx`
  - Replace the current sprawling page composition with focused V2 sections.
  - Keep helper components small: `LandingHeader`, `ProductHero`, `WorkspaceProof`, `PricingSection`, `FinalCta`, `LandingFooter`.
- Modify: `lib/sparkle-suite/public-landing-content.ts`
  - Reduce content to the short V2 narrative, pricing, footer links, and screenshot manifest.
  - Store screenshot metadata as local asset paths and alt text, not hard-coded personal data.
- Modify: `app/globals.css`
  - Add isolated `sl2-*` styles.
  - Remove or stop relying on old `sl-product-*`, CSS 3D, floating-card, and long feature-grid styles for the V2 render.
- Modify: `tests/sparkle-suite-public-landing.test.ts`
  - Update tests to assert the new short page, real-product proof, no Louis identifiers, no fake jewelry, no CSS 3D/floating cards, and the expected pricing/CTA route.
- Possibly modify: `app/page.tsx`
  - Only if metadata needs to align with the new simpler homepage description.
- Possibly create: `public/sparkle-suite/landing/*.png`
  - Final curated local screenshots used by the landing page.
- Create or update: `docs/sparkle-suite/landing-page/mobile-polish-audit-2026-05-29.md`
  - Add a short resolution note after implementation QA.

## Screenshot Source Strategy

Use real product screenshots, not image generation, for production-visible hero proof.

Marketing-safe source candidates already found:

- `app/amethyst/[...asset]/route.ts` sets the fallback rep to `Jane` and business to `Jane's Sparkle Party`.
- `lib/seo/amethyst-public-metadata.ts` contains Jane's Sparkle Party public page metadata.
- `lib/amethyst/preview-template-data.ts` contains Jane's Sparkle Party preview data used by tests and demos.

If the Jane demo workspace can be authenticated safely without exposing secrets, capture it. If not, sanitize the current local workspace proof so every visible Louis identifier is replaced by Jane's Sparkle Party or a generic sample label before any screenshot becomes an asset.

## Sub-Agent Batching

Use subagents only if execution needs parallel help. Avoid parallel edits on shared files.

- Batch A: Screenshot/data discovery and asset capture.
- Batch B: Content/tests for the new short page.
- Batch C: Component rebuild and isolated CSS.
- Batch D: Browser visual QA and polish corrections.
- Batch E: Final review, audit update, and report.

Recommended execution: one implementation worker at a time for B/C because `app/_components/sparkle-suite-public-landing.tsx`, `lib/sparkle-suite/public-landing-content.ts`, and `app/globals.css` are tightly coupled. A subagent can independently inspect Jane demo routes/assets or perform final QA review.

## Tasks

### Task 1: Lock The Product-Grounded Asset Source

**Files:**
- Read: `app/amethyst/[...asset]/route.ts`
- Read: `lib/amethyst/preview-template-data.ts`
- Read: `lib/seo/amethyst-public-metadata.ts`
- Create: `public/sparkle-suite/landing/`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Confirm Jane's public demo routes render locally**

Run in browser at mobile and desktop widths:

```text
http://localhost:3000/amethyst/Homepage.html
http://localhost:3000/amethyst/Trade.html
http://localhost:3000/amethyst/Join.html
```

Expected: pages render without a Next.js overlay and visible public copy uses Jane's Sparkle Party or another approved demo identity, not Louis.

- [ ] **Step 2: Capture marketing-safe screenshots**

Capture these files:

```text
public/sparkle-suite/landing/jane-customer-home-mobile.png
public/sparkle-suite/landing/jane-customer-trade-mobile.png
public/sparkle-suite/landing/jane-customer-home-desktop.png
public/sparkle-suite/landing/workspace-proof-desktop.png
public/sparkle-suite/landing/workspace-proof-mobile.png
```

Expected: all images are real app screenshots. `workspace-proof-*` contains no `Louis`, `Chapman`, personal phone, personal email, or extension codes tied to Louis.

- [ ] **Step 3: Add identifier safety assertions**

Add or update a Vitest assertion:

```ts
it('keeps the product-grounded landing free of Louis identifiers', () => {
  const html = renderLanding()

  expect(html).not.toContain('Louis')
  expect(html).not.toContain('Chapman')
  expect(html).not.toContain('346954')
  expect(html).not.toContain('louis@')
})
```

- [ ] **Step 4: Verify the safety test fails before implementation if old workspace labels remain**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected before implementation: FAIL if the current render still exposes old workspace identifiers. Expected after implementation: PASS.

### Task 2: Define The Short V2 Landing Content

**Files:**
- Modify: `lib/sparkle-suite/public-landing-content.ts`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Replace long-page assertions with simple-page assertions**

Update the core content test to expect:

```ts
expect(sparkleSuitePublicLandingContent.hero).toMatchObject({
  eyebrow: 'Customer site first',
  headline: 'One polished place for customers to follow along.',
  body:
    'Sparkle Suite gives reps a polished customer site, live-show tools, and a real workspace behind the scenes.',
  primaryCta: { label: 'Start Sparkle Suite', href: '/start' },
})

expect(sparkleSuitePublicLandingContent.workspaceProof).toMatchObject({
  eyebrow: 'Workspace proof',
  heading: 'A real workspace behind the customer experience.',
})

expect(sparkleSuitePublicLandingContent.sections.map((section) => section.id)).toEqual([
  'hero',
  'workspace-proof',
  'pricing',
  'get-started',
])
```

- [ ] **Step 2: Define the screenshot manifest**

Use this content shape:

```ts
assets: {
  customerMobile: {
    src: '/sparkle-suite/landing/jane-customer-home-mobile.png',
    alt: "Jane's Sparkle Party customer site preview on mobile.",
  },
  customerTradeMobile: {
    src: '/sparkle-suite/landing/jane-customer-trade-mobile.png',
    alt: "Jane's Sparkle Party trade board preview on mobile.",
  },
  customerDesktop: {
    src: '/sparkle-suite/landing/jane-customer-home-desktop.png',
    alt: "Jane's Sparkle Party customer site preview on desktop.",
  },
  workspaceDesktop: {
    src: '/sparkle-suite/landing/workspace-proof-desktop.png',
    alt: 'Sparkle Suite workspace setup checklist preview.',
  },
  workspaceMobile: {
    src: '/sparkle-suite/landing/workspace-proof-mobile.png',
    alt: 'Sparkle Suite mobile workspace setup preview.',
  },
}
```

- [ ] **Step 3: Keep approved pricing copy**

Keep these exact pricing values unless Louis changes pricing:

```ts
buildFee: {
  label: 'Sparkle Suite build fee',
  price: '$49.99',
  body: 'One-time and non-refundable, itemized separately at checkout.',
},
standard: {
  label: 'Standard monthly',
  badge: 'Current monthly rate',
  price: '$74.99/month',
  term: 'Monthly subscription from the start.',
  firstCheckout: '$124.98 first checkout before taxes or Stripe-calculated extras.',
},
```

- [ ] **Step 4: Remove long feature-grid content from the rendered page**

Tests must assert the V2 page does not render these old section headings:

```ts
expect(html).not.toContain('Inside the suite.')
expect(html).not.toContain('Customers can feel the difference.')
expect(html).not.toContain('Less patchwork behind the scenes.')
expect(html).not.toContain('The edge customers can actually feel.')
```

### Task 3: Rebuild The Component Around Four Sections

**Files:**
- Modify: `app/_components/sparkle-suite-public-landing.tsx`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Remove old section render calls**

The final `SparkleSuitePublicLanding` render should follow this order:

```tsx
export function SparkleSuitePublicLanding() {
  return (
    <main className="sparkle-landing sparkle-landing-v2">
      <div className="sl2-shell">
        <LandingHeader />
        <ProductHero />
        <WorkspaceProof />
        <PricingSection />
        <FinalCta />
        <LandingFooter />
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Build `ProductHero` with real screenshots**

The hero must use actual screenshot assets:

```tsx
function ProductHero() {
  const { hero, assets } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-hero" id="top">
      <div className="sl2-hero__copy">
        <span className="sl2-eyebrow">{hero.eyebrow}</span>
        <h1>{hero.headline}</h1>
        <p>{hero.body}</p>
        <LandingButton href={hero.primaryCta.href} label={hero.primaryCta.label} />
      </div>
      <div className="sl2-product-stack" aria-label="Real Sparkle Suite customer site previews">
        <img className="sl2-shot sl2-shot--customer" src={assets.customerMobile.src} alt={assets.customerMobile.alt} />
        <img className="sl2-shot sl2-shot--landing" src={assets.customerDesktop.src} alt={assets.customerDesktop.alt} />
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Build `WorkspaceProof` directly below hero**

```tsx
function WorkspaceProof() {
  const { workspaceProof, assets } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-workspace-proof" id="workspace-proof">
      <div className="sl2-workspace-proof__copy">
        <span className="sl2-eyebrow">{workspaceProof.eyebrow}</span>
        <h2>{workspaceProof.heading}</h2>
        <p>{workspaceProof.body}</p>
      </div>
      <div className="sl2-workspace-proof__shots" aria-label="Real Sparkle Suite workspace previews">
        <img src={assets.workspaceDesktop.src} alt={assets.workspaceDesktop.alt} />
        <img src={assets.workspaceMobile.src} alt={assets.workspaceMobile.alt} />
      </div>
    </section>
  )
}
```

- [ ] **Step 4: Keep pricing and final CTA simple**

Use existing pricing values and one CTA:

```tsx
function FinalCta() {
  const { finalCta } = sparkleSuitePublicLandingContent

  return (
    <section className="sl2-final-cta">
      <h2>{finalCta.heading}</h2>
      <p>{finalCta.body}</p>
      <LandingButton href="/start" label="Start Sparkle Suite" />
    </section>
  )
}
```

### Task 4: Isolate And Polish The V2 CSS

**Files:**
- Modify: `app/globals.css`
- Test: `tests/sparkle-suite-public-landing.test.ts`

- [ ] **Step 1: Add V2 namespace styles after existing landing CSS**

Add styles under:

```css
.sparkle-landing-v2 {
  min-height: 100vh;
  background:
    radial-gradient(circle at 82% 8%, rgba(255, 212, 234, 0.5), transparent 34rem),
    linear-gradient(135deg, #fcf8f6 0%, #fff6fa 48%, #f6ede8 100%);
  color: #402924;
}
```

- [ ] **Step 2: Make mobile the source of truth**

Required mobile CSS behavior:

```css
.sparkle-landing-v2 .sl2-hero {
  display: grid;
  gap: 32px;
  padding: 32px 0 52px;
}

.sparkle-landing-v2 .sl2-hero h1 {
  max-width: 10ch;
  font-family: "Playfair Display", Georgia, serif;
  font-size: clamp(3.4rem, 18vw, 5.2rem);
  line-height: 0.92;
  letter-spacing: 0;
}

.sparkle-landing-v2 .sl2-product-stack {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  justify-items: center;
}
```

- [ ] **Step 3: Add desktop enhancement only after mobile is clean**

At desktop width:

```css
@media (min-width: 980px) {
  .sparkle-landing-v2 .sl2-hero,
  .sparkle-landing-v2 .sl2-workspace-proof {
    grid-template-columns: minmax(0, 0.92fr) minmax(0, 1.08fr);
    align-items: center;
  }
}
```

- [ ] **Step 4: Ban the old hero failure modes**

Tests should assert rendered markup does not contain:

```ts
expect(html).not.toContain('sl-product-scene')
expect(html).not.toContain('sl-product-stage')
expect(html).not.toContain('sl-depth-object')
expect(html).not.toContain('sl-customer-card')
expect(html).not.toContain('sl-feature-grid')
```

### Task 5: Browser QA And Quality Scrub Before Louis Sees It

**Files:**
- No code files unless QA finds issues.
- Possibly update: `docs/sparkle-suite/landing-page/mobile-polish-audit-2026-05-29.md`

- [ ] **Step 1: Run focused unit tests**

Run:

```powershell
npm exec vitest run tests/sparkle-suite-public-landing.test.ts
```

Expected: PASS. Do not continue to Louis-facing review while failing.

- [ ] **Step 2: Run TypeScript if component/content types changed**

Run:

```powershell
npx tsc --noEmit --pretty false
```

Expected: PASS, or document the exact unrelated failure if one exists.

- [ ] **Step 3: Browser inspect mobile**

Open:

```text
http://localhost:3000/?angle=2
```

Set viewport to `390x844`. Verify:

- First screen has logo, concise copy, one primary CTA, and product proof without feeling cramped.
- No horizontal overflow.
- No tiny desktop nav wrapping into multiple rows.
- Screenshot stack is readable and does not hide the CTA.
- No Louis identifiers.
- No CSS 3D, floating cards, animated product movement, or fake UI controls.

- [ ] **Step 4: Browser inspect desktop**

Set viewport to `1440x920`. Verify:

- Hero resembles the quality level of `tmp/sparkle-hero-concepts/concept-1-product-customer-site-first.png`.
- Workspace proof resembles the quality level of `tmp/sparkle-hero-concepts/concept-2-product-workspace-proof.png`.
- Pricing is visible without a long feature maze.
- The page feels premium, real, and restrained.

- [ ] **Step 5: Scrub against quality checklist**

Do not show Louis the rebuild until every answer is yes:

- Does the hero use real Sparkle Suite product surfaces?
- Does the hero feel mobile-first instead of desktop squeezed down?
- Is the customer-facing site the first visual proof?
- Is the workspace proof directly below the hero?
- Is pricing simple and easy to find?
- Is there only one obvious conversion path to `/start`?
- Are there no personal Louis identifiers?
- Are there no invented screens, fake jewelry, fake testimonials, or generic AI imagery?
- Does the page avoid over-explaining the feature set?
- Does the footer keep Help and social placeholders vertically organized?

### Task 6: Final Report And Handoff

**Files:**
- Update: `docs/sparkle-suite/landing-page/mobile-polish-audit-2026-05-29.md`
- Read: `git status --short --branch`

- [ ] **Step 1: Update the audit note**

Append:

```md
## Homepage Rebuild Direction Update - 2026-05-29

The post-launch local root homepage was rebuilt around real product proof instead of CSS 3D or invented UI. The approved structure is customer-site-first hero, workspace proof, pricing, get-started CTA, and footer. The implementation remains local-only pending Louis review.
```

- [ ] **Step 2: Gather final state**

Run:

```powershell
git status --short --branch
```

Expected: branch is still `codex/sparkle-cross-phase-hardening`; no files are staged unless Louis explicitly asked for staging.

- [ ] **Step 3: Report to Louis**

Report:

- plan executed or not executed
- files changed
- tests run and results
- mobile/desktop browser QA results
- remaining judgment items
- explicit statement that production was not changed

## Definition Of Done

- Local root homepage is rebuilt as a short, mobile-first product-grounded page.
- Concept 1 drives the hero: customer site first, real screenshot proof.
- Concept 2 drives the next section: real workspace proof immediately below the hero.
- Page includes pricing and one clear get-started path.
- No feature-grid overload.
- No CSS 3D/floating-card hero dependencies.
- No fake jewelry, generic AI imagery, or invented UI.
- No Louis personal identifiers in content, screenshots, alt text, rendered HTML, or visible page.
- Focused Vitest test passes.
- TypeScript passes if shared types/components changed.
- Browser QA passes at `390x844` and `1440x920`.
- Louis does not see the rebuild until the quality checklist passes.
