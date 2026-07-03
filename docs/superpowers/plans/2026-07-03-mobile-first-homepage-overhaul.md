# Mobile-First Homepage Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Simplify the signed-in Sparkle Finder homepage into a mobile-first app-style experience built around "Find the pieces you love. Build your collection with Sparkle Finder." while preserving all existing backend plumbing, Nic-Nac capabilities, collection persistence, and route coverage.

**Architecture:** Replace the current homepage command-center presentation with a small set of focused home components: a simplified app home, a guided Find a Piece panel, and the existing Bling Vault collection layer with simplified copy. Keep existing routes, data loading, Supabase persistence, Nic-Nac route/tool plumbing, and collection model logic intact; only change entry points, navigation emphasis, copy, and theme treatment.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind utility classes, CSS custom properties in `app/globals.css`, Vitest route/render tests, Playwright smoke tests, existing `npm run lint`, `npm run test`, `npm run build`, and `npm run smoke:sparkle-finder` verification.

---

## Execution Model

Use subagents for implementation and review, but do not dispatch multiple implementation subagents in parallel against the same files.

Recommended flow:

1. Controller reads this plan and creates a checklist.
2. One implementer subagent handles one task at a time.
3. After each task, dispatch a spec-compliance reviewer subagent.
4. After spec compliance passes, dispatch a code-quality reviewer subagent.
5. Only then move to the next task.
6. After all tasks, dispatch a final regression reviewer subagent focused on capability preservation.
7. Run the full smoke and pressure-test suite locally.

Why sequential implementation: Tasks share `app/globals.css`, `components/layout/SparkleFinderNav.tsx`, homepage components, and homepage tests. Sequential implementers avoid conflicting edits while still getting fresh-context accuracy.

## File Map

Create:

- `components/home/SimpleFinderHome.tsx` - opening signed-in homepage section with promise copy, primary Find a Piece action, secondary My Collection and Browse Library actions, compact stats, profile cue, and contextual route shortcuts.
- `components/home/FindPiecePanel.tsx` - guided find panel behind the Find a Piece action; routes customers into Library search, Wishlist/Nic-Nac help, missing-piece Studio path, live shows, rep boards, favorites, and collectors without putting all of those in primary nav.

Modify:

- `app/globals.css` - Amethyst-inspired theme token update, nav styling, primary CTA contrast, and any home-specific utility classes required by `SimpleFinderHome` or `FindPiecePanel`.
- `components/layout/SparkleFinderNav.tsx` - simplify app nav to Home, Library, Find, Account, with logout still available for signed-in mobile users.
- `components/home/AuthenticatedHomePage.tsx` - remove the current `HeroAndAgenda` plus `FinderCommandCenter` opening stack from the signed-in home and render `SimpleFinderHome`, `FindPiecePanel`, and `HomepageBlingVault`.
- `components/home/HomepageBlingVault.tsx` - simplify section copy around collection/Bling Vault, keep Hero Piece, Wishlist rail, and mosaic.
- `components/home/HeroPieceSpotlight.tsx` - Amethyst styling and customer-goal copy; keep tap-through to Library item detail.
- `components/home/WishlistRail.tsx` - make the Wishlist wording less internal and route the find action into the new find panel or existing item detail.
- `components/home/BlingVaultMosaic.tsx` - rename visible "Bling Vault Mosaic" copy while preserving lazy loading and `data-smoke="bling-vault-tile"`.
- `components/home/BlingVaultTile.tsx` - Amethyst styling only; keep item links and stable dimensions.
- `tests/sparkle-finder/routes.test.ts` - update signed-in homepage/nav expectations, add capability-preservation assertions.
- `tests/smoke/sparkle-finder-home.spec.ts` - update authenticated homepage smoke expectations and keep route/regression checks.
- `vault/session-log.md` and `vault/decisions.md` only after implementation is verified.

Do not modify:

- Supabase migrations.
- Nic-Nac API route or tool definitions unless tests reveal a necessary entry-point label adjustment.
- Collection persistence helpers.
- Auth architecture.
- Stripe/billing flows.

## Subagent Roles

Use these focused subagent prompts during execution:

- **Implementer subagent per task:** Gets only the task text, file map, relevant spec excerpt, and current test output. Must use test-driven-development.
- **Spec reviewer subagent per task:** Checks the diff against `docs/superpowers/specs/2026-07-03-mobile-first-homepage-overhaul-design.md` and this plan. It should answer: "Does the task preserve capabilities and implement only its scope?"
- **Code-quality reviewer subagent per task:** Checks accessibility, mobile responsiveness, text overflow, route safety, and whether the code follows existing patterns.
- **Final regression reviewer subagent:** Reviews the completed diff for lost features, broken routes, removed Nic-Nac/tool plumbing, weak smoke coverage, or accidental marketplace/shop behavior.

---

### Task 1: Lock The New Homepage And Preservation Contract In Tests

**Files:**

- Modify: `tests/sparkle-finder/routes.test.ts`
- Modify: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Update the route test for simplified app navigation**

In `tests/sparkle-finder/routes.test.ts`, update the test named `renders the main homepage with app navigation for signed-in customers`.

Replace the old signed-in nav expectations:

```ts
expect(markup).toContain("Sparkle Finder primary navigation");
expect(markup).toContain('href="/library"');
expect(markup).toContain('href="/live-shows"');
expect(markup).toContain('href="/rep-boards"');
expect(markup).not.toContain('href="/shop"');
expect(markup).toContain('href="/photo-setup"');
expect(markup).toContain('href="/account"');
expect(markup).toContain(">Silver<");
expect(markup).toContain("Today across Sparkle Suite");
expect(markup).toContain('data-smoke="finder-command-center"');
expect(markup).toContain('data-smoke="homepage-bling-vault"');
expect(markup).toContain("Ask Nic-Nac or tap a simple action.");
expect(markup).toContain("Bling Vault");
expect(markup).toContain("Hero Piece");
expect(markup).toContain("Wishlist");
```

with the new contract:

```ts
expect(markup).toContain("Sparkle Finder primary navigation");
expect(markup).toContain('href="/"');
expect(markup).toContain(">Home<");
expect(markup).toContain('href="/library"');
expect(markup).toContain(">Library<");
expect(markup).toContain('href="#find-a-piece"');
expect(markup).toContain(">Find<");
expect(markup).toContain('href="/account"');
expect(markup).toContain(">Silver<");
expect(markup).not.toContain('href="/shop"');
expect(markup).not.toContain('href="/live-shows"');
expect(markup).not.toContain('href="/rep-boards"');
expect(markup).not.toContain('href="/favorites"');
expect(markup).not.toContain('href="/collectors"');
expect(markup).not.toContain(">Showcase<");
expect(markup).not.toContain("Today across Sparkle Suite");
expect(markup).not.toContain('data-smoke="finder-command-center"');
expect(markup).toContain('data-smoke="simple-finder-home"');
expect(markup).toContain('data-smoke="find-piece-panel"');
expect(markup).toContain('data-smoke="homepage-bling-vault"');
expect(markup).toContain("Find the pieces you love.");
expect(markup).toContain("Build your collection with Sparkle Finder.");
expect(markup).toContain("Find a Piece");
expect(markup).toContain("My Collection");
expect(markup).toContain("Browse Library");
expect(markup).toContain("Hero Piece");
expect(markup).toContain("Wishlist");
```

- [ ] **Step 2: Update the command-center route test into an app-home route test**

Rename the test `renders authenticated home as a unified Nic-Nac command center and Bling Vault` to:

```ts
it("renders authenticated home as a simple app home with preserved collection stats", () => {
```

Replace the command-center slice setup with:

```ts
const homeMarkup = markup.slice(
  markup.indexOf('data-smoke="simple-finder-home"'),
  markup.indexOf('data-smoke="homepage-bling-vault"'),
);
```

Replace old assertions that require `"Collector profile"`, `"Your Finder Space"`, `"Open Showcase Studio"`, `"Find a library piece"`, `"View Bling Vault"`, and `"Bling Vault Mosaic"` with:

```ts
expect(markup).toContain('data-smoke="simple-finder-home"');
expect(markup).toContain('data-smoke="find-piece-panel"');
expect(markup).toContain('data-smoke="homepage-bling-vault"');
expect(markup).not.toContain("Nic-Nac Home");
expect(markup).not.toContain("Ask Nic-Nac or tap a simple action.");
expect(markup).not.toContain("Command Center");
expect(markup).not.toContain("Open Showcase Studio");
expect(markup).toContain("Add a Missing Piece");
expect(markup).toContain("Find the pieces you love.");
expect(markup).toContain("Build your collection with Sparkle Finder.");
expect(markup).toContain("Check my Wishlist");
expect(markup).toContain("Ask Nic-Nac for Help");
expect(markup).toContain("Live Shows");
expect(markup).toContain("Rep Boards");
expect(markup).toContain("Favorite Reps");
expect(markup).toContain("Collectors");
expect(homeMarkup).toContain("Owned");
expect(homeMarkup).toContain("Wishlist");
expect(homeMarkup).toContain("Diamonds");
expect(homeMarkup).toContain("Unicorns");
expect(homeMarkup).toContain("Found by Sparkle Finder");
expect(homeMarkup).not.toContain("Featured");
expect(homeMarkup).not.toContain(">Saved<");
```

- [ ] **Step 3: Preserve Bling Vault ordering and lazy-load assertions**

In the same test file, update visible copy assertions from `"Bling Vault Mosaic"` to `"Bling Vault"` or `"Your Collection"` depending on the implementation copy. Keep the ordering and bounded batch assertions:

```ts
const vaultMarkup = markup.slice(markup.indexOf('data-smoke="homepage-bling-vault"'));
expect(vaultMarkup.indexOf("Hero Piece")).toBeLessThan(vaultMarkup.indexOf("Wishlist"));
expect(vaultMarkup.indexOf("Wishlist")).toBeLessThan(vaultMarkup.indexOf("Bling Vault"));
expect((markup.match(/data-smoke="bling-vault-tile"/g) ?? []).length).toBeLessThanOrEqual(8);
```

- [ ] **Step 4: Add a route test that contextual links preserve hidden top-nav capabilities**

Add this new test near the authenticated homepage tests:

```ts
it("keeps advanced Finder capabilities reachable from contextual homepage links", () => {
  const markup = renderToStaticMarkup(renderHomeContent(silverPreviewRouteAccountState()));

  expect(markup).toContain('href="/live-shows"');
  expect(markup).toContain("Live Shows");
  expect(markup).toContain('href="/rep-boards"');
  expect(markup).toContain("Rep Boards");
  expect(markup).toContain('href="/favorites"');
  expect(markup).toContain("Favorite Reps");
  expect(markup).toContain('href="/collectors"');
  expect(markup).toContain("Collectors");
  expect(markup).toContain('href="/silver#showcase-studio"');
  expect(markup).toContain("Add a Missing Piece");
  expect(markup).toContain('href="#homepage-nic-nac"');
  expect(markup).toContain("Ask Nic-Nac for Help");
  expect(markup).not.toContain('href="/shop"');
});
```

- [ ] **Step 5: Update Playwright authenticated homepage smoke title and expectations**

In `tests/smoke/sparkle-finder-home.spec.ts`, rename:

```ts
test(`${viewport.name} authenticated homepage renders unified Nic-Nac Home and Bling Vault`, async ({ page }) => {
```

to:

```ts
test(`${viewport.name} authenticated homepage renders simple app home and preserved Finder flows`, async ({ page }) => {
```

Replace the old authenticated homepage expectations with:

```ts
await expect(page.locator('[data-smoke="simple-finder-home"]')).toBeVisible();
await expect(page.locator('[data-smoke="find-piece-panel"]')).toBeVisible();
await expect(page.locator('[data-smoke="homepage-bling-vault"]')).toBeVisible();
await expect(page.getByText("Find the pieces you love.")).toBeVisible();
await expect(page.getByText("Build your collection with Sparkle Finder.")).toBeVisible();
await expect(page.getByRole("link", { name: "Find a Piece" })).toBeVisible();
await expect(page.getByRole("link", { name: "My Collection" })).toBeVisible();
await expect(page.getByRole("link", { name: "Browse Library" }).first()).toBeVisible();
await expect(page.getByText("Nic-Nac Home")).toHaveCount(0);
await expect(page.getByText("Ask Nic-Nac or tap a simple action.")).toHaveCount(0);
await expect(page.getByText("Hero Piece")).toBeVisible();
await expect(page.getByText("Bling Vault")).toBeVisible();
```

Keep the existing collection-stat, bounded tile count, image frame, footer, and overlap assertions, but change locators from `[data-smoke="finder-command-center"]` to `[data-smoke="simple-finder-home"]`.

- [ ] **Step 6: Run focused tests and confirm they fail**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL on missing `simple-finder-home`, `find-piece-panel`, new promise copy, and simplified nav.

Run:

```powershell
npx playwright test tests/smoke/sparkle-finder-home.spec.ts --project=chromium
```

Expected: FAIL on missing authenticated homepage smoke selectors/copy. Public homepage tests may pass.

- [ ] **Step 7: Commit failing tests**

Commit only the test changes:

```powershell
git add tests/sparkle-finder/routes.test.ts tests/smoke/sparkle-finder-home.spec.ts
git commit -m "test: define simplified homepage contract"
```

Expected: commit succeeds with failing tests intentionally documenting the new contract.

---

### Task 2: Apply The Amethyst App Skin And Simplify Primary Navigation

**Files:**

- Modify: `app/globals.css`
- Modify: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Update theme tokens in `app/globals.css`**

Change the `:root` token block to this Amethyst-leaning palette while keeping existing token names:

```css
:root {
  --background: #fbf7ff;
  --foreground: #281533;
  --sparkle-warm-bg: #fbf7ff;
  --sparkle-blush-bg: #f5edff;
  --sparkle-paper: #ffffff;
  --sparkle-paper-soft: #f7f0ff;
  --sparkle-plum: #4b1f68;
  --sparkle-plum-deep: #281533;
  --sparkle-ink-muted: #6c5a76;
  --sparkle-blush: #ead9ff;
  --sparkle-rose: #9d4edd;
  --sparkle-coral: #c77dff;
  --sparkle-border: rgba(75, 31, 104, 0.14);
  --sparkle-border-strong: rgba(75, 31, 104, 0.24);
  --sparkle-panel: #2b123d;
  --sparkle-panel-text: #fbf4ff;
  --sparkle-shadow-sm: 0 18px 44px rgba(43, 18, 61, 0.1);
  --sparkle-shadow-md: 0 22px 54px rgba(157, 78, 221, 0.16);
  --sparkle-radius-sm: 0.5rem;
  --sparkle-radius-md: 0.75rem;
  --sparkle-radius-lg: 1rem;
  --surface: var(--sparkle-paper);
  --surface-muted: var(--sparkle-blush-bg);
  --accent: var(--sparkle-rose);
  --accent-strong: var(--sparkle-plum);
  --border: var(--sparkle-border);
}
```

- [ ] **Step 2: Update page background and panel gradients**

In `app/globals.css`, replace the `body` background with:

```css
body {
  min-height: 100vh;
  margin: 0;
  background:
    radial-gradient(circle at 82% 8%, rgba(199, 125, 255, 0.24), transparent 32rem),
    radial-gradient(circle at 12% 16%, rgba(255, 255, 255, 0.82), transparent 22rem),
    linear-gradient(145deg, #fbf7ff 0%, #f5edff 48%, #fffafd 100%);
  color: var(--foreground);
  font-family: var(--font-dm-sans), Arial, sans-serif;
}
```

Update `.sparkle-finder-nav-shell`, `.sparkle-finder-footer-strip`, and `.sparkle-finder-site-footer` gradients from the current brown/plum values to:

```css
background: linear-gradient(145deg, #281533 0%, #4b1f68 58%, #6f2dbd 100%);
```

- [ ] **Step 3: Keep CTA contrast high**

In `app/globals.css`, update primary CTA and Nic-Nac colors:

```css
.sparkle-home-primary-cta {
  background: #6f2dbd;
  color: #ffffff;
}

.sparkle-home-primary-cta:hover {
  background: #5a189a;
}

.sparkle-nic-nac-mark {
  background: #9d4edd;
  color: #ffffff;
}
```

Update `.finder-nic-nac-chatbot__form button` to use:

```css
background: #6f2dbd;
color: #ffffff;
```

- [ ] **Step 4: Simplify nav item definitions**

In `components/layout/SparkleFinderNav.tsx`, change imports from:

```ts
import { BookOpen, Heart, LogOut, Menu, Sparkles, UserRound, UsersRound, Video } from "lucide-react";
```

to:

```ts
import { BookOpen, Home, LogOut, Search, UserRound } from "lucide-react";
```

Replace `navItems` with:

```ts
const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Find", href: "#find-a-piece", icon: Search },
];
```

- [ ] **Step 5: Keep account and logout behavior intact**

Do not change:

```ts
const isSignedIn = isSparkleFinderSignedIn(accountState);
const accountLabel = accountState.status === "anonymous" ? "Sign In" : getSparkleFinderNavStatusLabel(accountState);
const accountHref = isSignedIn ? "/account" : "/auth/sign-in";
```

Keep the desktop Account link and mobile Log Out link exactly as they are except for the simplified nav item list.

- [ ] **Step 6: Run focused nav/theme tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected after this task: nav assertions should pass, homepage component assertions still fail until Tasks 3-5.

- [ ] **Step 7: Commit**

```powershell
git add app/globals.css components/layout/SparkleFinderNav.tsx tests/sparkle-finder/routes.test.ts
git commit -m "feat: simplify app navigation and amethyst theme"
```

---

### Task 3: Replace Command Center With The Simple Finder Home

**Files:**

- Create: `components/home/SimpleFinderHome.tsx`
- Modify: `components/home/AuthenticatedHomePage.tsx`
- Modify: `components/home/FinderCommandCenter.tsx` or delete after replacement if no imports remain
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Create `components/home/SimpleFinderHome.tsx`**

Add this component:

```tsx
import Link from "next/link";
import { BookOpen, Gem, Heart, Search, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { RepBadge } from "@/components/account/RepBadge";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";
import type { CustomerAccount, SilverProfile } from "@/lib/sparkle-finder/types";

type SimpleFinderHomeProps = {
  customer: CustomerAccount;
  model: HomepageBlingVaultModel;
  profile?: SilverProfile;
};

export function SimpleFinderHome({ customer, model, profile }: SimpleFinderHomeProps) {
  const profilePhotoUrl = profile?.photoUrl.trim();

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[linear-gradient(180deg,rgba(251,247,255,0.98),rgba(245,237,255,0.76))]"
      data-smoke="simple-finder-home"
      id="home"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(18rem,0.55fr)] lg:items-stretch lg:px-10 lg:py-7">
        <article className="grid content-start gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[rgba(255,255,255,0.92)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div className="grid gap-3">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Sparkle Finder</p>
            <h1 className="sparkle-display max-w-3xl text-4xl font-semibold leading-[1.04] text-[var(--sparkle-plum-deep)] sm:text-5xl">
              Find the pieces you love.
            </h1>
            <p className="max-w-2xl text-base font-semibold leading-7 text-[var(--sparkle-ink-muted)] sm:text-lg">
              Build your collection with Sparkle Finder.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
            <HomeAction href="#find-a-piece" icon={Search} label="Find a Piece" primary />
            <HomeAction href="#bling-vault" icon={Gem} label="My Collection" />
            <HomeAction href="/library" icon={BookOpen} label="Browse Library" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <MiniMetric icon={Gem} label="Owned" value={model.counts.owned} />
            <MiniMetric icon={Heart} label="Wishlist" value={model.counts.wishlist} />
            <MiniMetric icon={Sparkles} label="Diamonds" value={model.counts.diamonds} />
            <MiniMetric icon={ShieldCheck} label="Unicorns" value={model.counts.unicorns} />
            <MiniMetric className="col-span-2 sm:col-span-1" icon={Search} label="Found by Sparkle Finder" value={model.counts.finderFinds} />
          </div>
        </article>

        <aside className="grid content-start gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-center gap-3">
            <div
              aria-label={`${customer.displayName} avatar`}
              className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--sparkle-border)] bg-[linear-gradient(135deg,#fbf7ff,#ead9ff)] font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum)] shadow-inner"
            >
              {profilePhotoUrl ? (
                <span
                  aria-hidden="true"
                  className="size-full bg-cover bg-center"
                  style={{ backgroundImage: `url("${profilePhotoUrl}")` }}
                />
              ) : (
                getInitials(customer.displayName)
              )}
            </div>
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="truncate font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {customer.displayName}
                </h2>
                <RepBadge repIdentity={customer.repIdentity} />
              </div>
              <p className="mt-1 text-sm font-semibold text-[var(--sparkle-ink-muted)]">Your collection home</p>
            </div>
          </div>
          <Link
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
            href="/account"
          >
            <UserRound aria-hidden="true" className="size-4" />
            Account
          </Link>
        </aside>
      </div>
    </section>
  );
}

function HomeAction({
  href,
  icon: Icon,
  label,
  primary = false,
}: {
  href: string;
  icon: typeof Search;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      className={
        primary
          ? "sparkle-home-primary-cta inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-5 text-sm font-black shadow-[var(--sparkle-shadow-md)] transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
          : "inline-flex min-h-12 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-5 text-sm font-black text-[var(--sparkle-plum)] transition hover:bg-[var(--sparkle-paper-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      }
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function MiniMetric({
  className = "",
  icon: Icon,
  label,
  value,
}: {
  className?: string;
  icon: typeof Gem;
  label: string;
  value: number;
}) {
  return (
    <div className={`flex min-h-16 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-3 ${className}`}>
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" strokeWidth={1.7} />
      <div>
        <p className="text-base font-black leading-none text-[var(--sparkle-plum-deep)]">{value}</p>
        <p className="mt-1 text-xs font-bold leading-tight text-[var(--sparkle-ink-muted)]">{label}</p>
      </div>
    </div>
  );
}

function getInitials(displayName: string): string {
  return displayName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
```

- [ ] **Step 2: Render `SimpleFinderHome` from `AuthenticatedHomePage`**

In `components/home/AuthenticatedHomePage.tsx`, replace:

```tsx
import { HeroAndAgenda } from "@/components/home/HeroAndAgenda";
import { FinderCommandCenter } from "@/components/home/FinderCommandCenter";
```

with:

```tsx
import { FindPiecePanel } from "@/components/home/FindPiecePanel";
import { SimpleFinderHome } from "@/components/home/SimpleFinderHome";
```

Remove unused service imports:

```tsx
getLiveShows,
getReps,
```

Replace:

```tsx
<HeroAndAgenda liveShows={getLiveShows()} reps={getReps()} />
<FinderCommandCenter
  accountState={accountState}
  customer={customer}
  model={blingVaultModel}
  profile={profile}
/>
<HomepageBlingVault model={blingVaultModel} />
```

with:

```tsx
<SimpleFinderHome customer={customer} model={blingVaultModel} profile={profile} />
<FindPiecePanel accountState={accountState} model={blingVaultModel} />
<HomepageBlingVault model={blingVaultModel} />
```

- [ ] **Step 3: Keep `FinderCommandCenter.tsx` temporarily if imports remain**

Run:

```powershell
rg -n "FinderCommandCenter" .
```

If only `components/home/FinderCommandCenter.tsx` remains, delete the file in Task 6 cleanup. If tests still import it directly, update those tests first.

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected after this task: simple-home assertions pass; `FindPiecePanel` assertions fail until Task 4; copy/theme assertions for Bling Vault may fail until Task 5.

- [ ] **Step 5: Commit**

```powershell
git add components/home/SimpleFinderHome.tsx components/home/AuthenticatedHomePage.tsx tests/sparkle-finder/routes.test.ts
git commit -m "feat: add simple finder home"
```

---

### Task 4: Add The Guided Find Panel Without Removing Existing Feature Routes

**Files:**

- Create: `components/home/FindPiecePanel.tsx`
- Modify: `components/home/AuthenticatedHomePage.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Create `components/home/FindPiecePanel.tsx`**

Add:

```tsx
import Link from "next/link";
import { Bot, CalendarDays, Camera, Heart, Search, Sparkles, UsersRound } from "lucide-react";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";

type FindPiecePanelProps = {
  accountState: SparkleFinderAccountState;
  model: HomepageBlingVaultModel;
};

export function FindPiecePanel({ accountState, model }: FindPiecePanelProps) {
  const nicNacItemId = model.wishlistItems[0]?.jewelryItemId ?? model.heroItem?.jewelryItemId;

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[rgba(255,255,255,0.72)]"
      data-smoke="find-piece-panel"
      id="find-a-piece"
    >
      <div className="mx-auto grid max-w-[112rem] gap-4 px-5 py-6 sm:px-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(21rem,0.65fr)] lg:px-10">
        <article className="grid content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Find a Piece</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              What are you looking for?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Start with what you know. Sparkle Finder will point you toward the right library, collection, rep, or Nic-Nac path.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <FindOption href="/library" icon={Search} label="I know the name" />
            <FindOption href="/library" icon={Sparkles} label="I know the collection" />
            <FindOption href="/silver#showcase-studio" icon={Camera} label="Add a Missing Piece" />
            <FindOption href="#homepage-nic-nac" icon={Heart} label="Check my Wishlist" />
            <FindOption href="#homepage-nic-nac" icon={Bot} label="Ask Nic-Nac for Help" />
          </div>

          <div className="grid gap-2 border-t border-[var(--sparkle-border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <ContextLink href="/live-shows" icon={CalendarDays} label="Live Shows" />
            <ContextLink href="/rep-boards" icon={UsersRound} label="Rep Boards" />
            <ContextLink href="/favorites" icon={Heart} label="Favorite Reps" />
            <ContextLink href="/collectors" icon={UsersRound} label="Collectors" />
          </div>
        </article>

        <div id="homepage-nic-nac">
          <FindThisForMe accountState={accountState} compact jewelryItemId={nicNacItemId} />
        </div>
      </div>
    </section>
  );
}

function FindOption({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Search;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-12 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-border-strong)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{label}</span>
    </Link>
  );
}

function ContextLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Search;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-ink-muted)] transition hover:text-[var(--sparkle-plum)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{label}</span>
    </Link>
  );
}
```

- [ ] **Step 2: Confirm `AuthenticatedHomePage` passes `accountState` and model**

Verify `components/home/AuthenticatedHomePage.tsx` contains:

```tsx
<FindPiecePanel accountState={accountState} model={blingVaultModel} />
```

- [ ] **Step 3: Run focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected after this task: contextual route capability assertions pass. Some Bling Vault copy assertions may still fail.

- [ ] **Step 4: Run targeted smoke against local dev if server is available**

If the dev server is already running on `http://127.0.0.1:4310`, run:

```powershell
npx playwright test tests/smoke/sparkle-finder-home.spec.ts --project=chromium
```

Expected: authenticated homepage smoke may still fail on Bling Vault copy until Task 5. Route accessibility should pass.

- [ ] **Step 5: Commit**

```powershell
git add components/home/FindPiecePanel.tsx components/home/AuthenticatedHomePage.tsx tests/sparkle-finder/routes.test.ts tests/smoke/sparkle-finder-home.spec.ts
git commit -m "feat: add guided find panel"
```

---

### Task 5: Simplify The Collection Layer Copy While Preserving Bling Vault Behavior

**Files:**

- Modify: `components/home/HomepageBlingVault.tsx`
- Modify: `components/home/HeroPieceSpotlight.tsx`
- Modify: `components/home/WishlistRail.tsx`
- Modify: `components/home/BlingVaultMosaic.tsx`
- Modify: `components/home/BlingVaultTile.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Update `HomepageBlingVault` visible copy**

In `components/home/HomepageBlingVault.tsx`, change the section headline from:

```tsx
<h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-4xl">
  Browse your saved sparkle.
</h2>
```

to:

```tsx
<h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-4xl">
  Build your collection.
</h2>
```

Change the manage link label:

```tsx
Manage full collection
```

to:

```tsx
Manage Collection
```

- [ ] **Step 2: Update `HeroPieceSpotlight` empty copy**

In `components/home/HeroPieceSpotlight.tsx`, change:

```tsx
Start your Bling Vault.
```

to:

```tsx
Start your collection.
```

Change:

```tsx
Add a library piece to your Wishlist or mark one as owned, then Nic-Nac can help keep the hunt simple.
```

to:

```tsx
Find a piece in the Library, add it to your Wishlist, or mark it as owned so Sparkle Finder can help with the hunt.
```

- [ ] **Step 3: Update `WishlistRail` copy**

In `components/home/WishlistRail.tsx`, change:

```tsx
Pieces Nic-Nac can watch.
```

to:

```tsx
Pieces you want to find.
```

Change the empty state:

```tsx
Add a piece from the library and Nic-Nac can watch for fresh 48-hour leads.
```

to:

```tsx
Add pieces from the Library so Sparkle Finder knows what to look for.
```

- [ ] **Step 4: Update `BlingVaultMosaic` copy while preserving data-smoke and lazy loading**

In `components/home/BlingVaultMosaic.tsx`, change:

```tsx
<p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Bling Vault Mosaic</p>
```

to:

```tsx
<p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Bling Vault</p>
```

Change:

```tsx
The rest of your sparkle, loaded as you scroll.
```

to:

```tsx
Your collection, loaded as you scroll.
```

Do not change:

```ts
const initialBatchSize = 8;
const mobileBatchSize = 8;
const desktopBatchSize = 12;
const automaticBatchLimit = 3;
```

Do not remove:

```tsx
data-smoke="bling-vault-tile"
```

- [ ] **Step 5: Apply Amethyst card styling lightly**

In `components/home/BlingVaultTile.tsx`, keep the link href and `data-smoke`. Update only the color feel by changing the badge accent from rose-heavy to token-based Amethyst:

```tsx
<span className="rounded border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-2 py-1 text-xs font-black capitalize text-[var(--sparkle-plum)]">
  {item.jewelryItem.bpLabel}
</span>
```

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: homepage and Bling Vault render tests pass.

- [ ] **Step 7: Commit**

```powershell
git add components/home/HomepageBlingVault.tsx components/home/HeroPieceSpotlight.tsx components/home/WishlistRail.tsx components/home/BlingVaultMosaic.tsx components/home/BlingVaultTile.tsx tests/sparkle-finder/routes.test.ts tests/smoke/sparkle-finder-home.spec.ts
git commit -m "feat: simplify collection homepage copy"
```

---

### Task 6: Remove Dead Command-Center Code And Confirm No Capability Loss

**Files:**

- Delete: `components/home/FinderCommandCenter.tsx` if no imports remain
- Modify: `tests/sparkle-finder/routes.test.ts`
- Modify: `tests/smoke/sparkle-finder-home.spec.ts`

- [ ] **Step 1: Confirm `FinderCommandCenter` is unused**

Run:

```powershell
rg -n "FinderCommandCenter|finder-command-center|Nic-Nac Home|Ask Nic-Nac or tap a simple action" app components tests
```

Expected before deletion: only `components/home/FinderCommandCenter.tsx` and explicit negative assertions in tests should appear.

- [ ] **Step 2: Delete the dead component if safe**

Delete `components/home/FinderCommandCenter.tsx` only if no production import remains.

- [ ] **Step 3: Update tests to keep negative assertions**

Keep these negative assertions in route and smoke tests:

```ts
expect(markup).not.toContain("Nic-Nac Home");
expect(markup).not.toContain("Ask Nic-Nac or tap a simple action.");
```

For Playwright:

```ts
await expect(page.getByText("Nic-Nac Home")).toHaveCount(0);
await expect(page.getByText("Ask Nic-Nac or tap a simple action.")).toHaveCount(0);
```

- [ ] **Step 4: Run focused tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add components/home/FinderCommandCenter.tsx tests/sparkle-finder/routes.test.ts tests/smoke/sparkle-finder-home.spec.ts
git commit -m "chore: remove old finder command center"
```

If the file was not deleted because another import remains, commit only the test cleanup with:

```powershell
git add tests/sparkle-finder/routes.test.ts tests/smoke/sparkle-finder-home.spec.ts
git commit -m "test: guard against old command center copy"
```

---

### Task 7: Smoke, Pressure Test, And Visual QA

**Files:**

- Modify: `vault/session-log.md`
- Modify: `vault/open-items.md` if a verified follow-up remains
- No production code changes unless verification finds a bug

- [ ] **Step 1: Run lint**

Run:

```powershell
npm run lint
```

Expected: PASS with no errors.

- [ ] **Step 2: Run focused route tests**

Run:

```powershell
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```powershell
npm run test
```

Expected: PASS for the full Vitest suite.

- [ ] **Step 4: Run production build**

Run:

```powershell
npm run build
```

Expected: PASS.

- [ ] **Step 5: Start local dev server for smoke and visual QA**

Run:

```powershell
npm run dev -- -p 4310
```

Expected: server starts at `http://127.0.0.1:4310` or `http://localhost:4310`.

If port `4310` is occupied, use:

```powershell
npm run dev -- -p 4311
```

and run smoke with:

```powershell
$env:SPARKLE_FINDER_BASE_URL='http://127.0.0.1:4311'; npm run smoke:sparkle-finder
```

- [ ] **Step 6: Run Sparkle Finder smoke**

Run:

```powershell
npm run smoke:sparkle-finder
```

Expected: PASS. Existing optional live API smoke tests may remain skipped unless the environment variables are set.

- [ ] **Step 7: Run authenticated homepage Playwright smoke directly**

Run:

```powershell
npx playwright test tests/smoke/sparkle-finder-home.spec.ts --project=chromium
```

Expected: PASS.

- [ ] **Step 8: Capture pressure-test screenshots**

Run these against the local dev URL:

```powershell
npx playwright screenshot --viewport-size=390,844 http://127.0.0.1:4310/ verification\sparkle-finder\homepage-mobile-390.png
npx playwright screenshot --viewport-size=430,932 http://127.0.0.1:4310/ verification\sparkle-finder\homepage-mobile-430.png
npx playwright screenshot --viewport-size=768,1024 http://127.0.0.1:4310/ verification\sparkle-finder\homepage-tablet-768.png
npx playwright screenshot --viewport-size=1440,900 http://127.0.0.1:4310/ verification\sparkle-finder\homepage-desktop-1440.png
```

Expected: screenshots render without overlap, clipped text, blank content, framework overlay, or command-grid clutter.

- [ ] **Step 9: Run route availability pressure check**

With the dev server running, visit these routes manually or with Playwright/curl:

```text
/
/library
/library/jewel-rainbow-crown-ring
/live-shows
/rep-boards
/favorites
/collectors
/silver
/account
/privacy-policy
/terms-and-conditions
```

Expected:

- signed-in preview routes still open when `sparkle_finder_auth_mode=silver` is present,
- anonymous gated routes still show sign-in wall,
- no route returns a framework error page,
- no route reintroduces shop or marketplace language.

- [ ] **Step 10: Final regression reviewer subagent**

Dispatch a reviewer subagent with this prompt:

```text
Review the completed Sparkle Finder homepage overhaul diff. Verify it preserves backend capabilities and existing routes while simplifying the UI.

Check specifically:
- no Supabase persistence helpers removed,
- no Nic-Nac route/tool/model/memory/telemetry code removed,
- Library, Wishlist, owned collection, Bling Vault, live shows, rep boards, favorites, collectors, Silver/profile, account, privacy, and terms routes still have tests or smoke coverage,
- "Nic-Nac Home" and broad command-center copy are gone,
- homepage uses "Find the pieces you love. Build your collection with Sparkle Finder.",
- app can still be used as a website and is mobile-app friendly,
- no shop, paid-link, marketplace, buy/sell, or customer-to-customer trading behavior was introduced.

Return findings ordered by severity with file/line references.
```

Expected: no blocking findings. Any P0/P1/P2 finding must be fixed before completion.

- [ ] **Step 11: Update session memory**

Append a concise entry to `vault/session-log.md` after verification. Include:

```md
- Implemented the mobile-first Sparkle Finder homepage overhaul:
  - Simple signed-in home built around "Find the pieces you love. Build your collection with Sparkle Finder."
  - Simplified primary nav to Home, Library, Find, Account.
  - Moved live shows, rep boards, favorites, collectors, missing-piece flow, and Nic-Nac into contextual find paths.
  - Applied Amethyst-inspired Sparkle Suite customer-site visual direction.
  - Preserved existing backend plumbing, Nic-Nac flows, Supabase persistence, collection stats, and route coverage.
  - Verification passed: `npm run lint`, `npm exec vitest run tests/sparkle-finder/routes.test.ts`, `npm run test`, `npm run build`, `npm run smoke:sparkle-finder`, `npx playwright test tests/smoke/sparkle-finder-home.spec.ts --project=chromium`, and 390/430/768/1440 viewport visual QA screenshots.
```

- [ ] **Step 12: Commit verified implementation and memory**

Commit all final production/test/doc changes:

```powershell
git add app components tests vault
git commit -m "feat: simplify mobile-first homepage"
```

Expected: commit succeeds.

---

## Final Verification Checklist

Before claiming completion, all of these must be true:

- [ ] `npm run lint` passes.
- [ ] `npm exec vitest run tests/sparkle-finder/routes.test.ts` passes.
- [ ] `npm run test` passes.
- [ ] `npm run build` passes.
- [ ] `npm run smoke:sparkle-finder` passes.
- [ ] `npx playwright test tests/smoke/sparkle-finder-home.spec.ts --project=chromium` passes.
- [ ] 390, 430, 768, and 1440 viewport screenshots are inspected.
- [ ] Final regression reviewer subagent finds no blocking capability-loss issues.
- [ ] `git status --short` shows only intended changes before the final commit and clean after commit.

## Rollback Notes

If the redesign causes unexpected issues:

- Revert only the UI commits for `SimpleFinderHome`, `FindPiecePanel`, nav/theme, and copy changes.
- Do not revert Supabase migrations or backend capability commits.
- Keep the design docs unless Louis changes direction again.
