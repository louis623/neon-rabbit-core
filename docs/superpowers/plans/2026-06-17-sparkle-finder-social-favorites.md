# Sparkle Finder Social Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Sparkle Finder's first focused social utility layer: favorite reps for broad member habit, Silver-powered favorite rep intelligence, public Showcase discovery, and collector follows without adding customer-to-customer trading, DMs, marketplace behavior, or shared auth boundaries.

**Architecture:** Keep Sparkle Finder customer auth and customer-owned data inside the Sparkle Finder boundary. Treat Sparkle Suite rep, show, board, and catalog data as read-only discovery data. Build the social layer as small customer-scoped tables, server actions, focused service helpers, and restrained UI surfaces that reinforce the product promise: keep up with favorite reps, follow inspiring public Showcases, and let Nic-Nac help collectors track what they love.

**Tech Stack:** Next.js App Router, React, TypeScript, Tailwind CSS, Supabase SSR/RLS, existing Sparkle Finder customer entitlement helpers, existing Sparkle Suite/Finder catalog and rep-read services, Vitest, Playwright smoke tests, and existing copy-guardrail tests.

---

## Product Contract

### Membership Split

Free/logged-in members get light network-building utility:

- Heart favorite reps from rep cards, calendar entries, and board surfaces.
- See a compact favorite reps shortcut list.
- Open favorite rep site, next show, and trade board links.
- View public Sparkle Showcases.
- Search public profiles by handle/display name.
- Follow a small number of public collectors if the implementation chooses a free cap.

Silver members get the sticky personal layer:

- Full Favorite Reps dashboard.
- Favorite rep filtering for calendar and board views.
- Favorite rep notes.
- Next-show reminder-ready metadata.
- Nic-Nac memory and tool access for favorite reps.
- Full public Showcase discovery and following/followers management.
- Profile and collection visibility controls.
- Future alert hooks without SMS or promotional messaging unless consent work is explicitly approved.

### Guardrails

- Do not add customer-to-customer trading, buy/sell, checkout, escrow, fulfillment, disputes, or marketplace language.
- Do not add DMs, open posting, or a general-purpose feed.
- Do not share or repoint Sparkle Finder auth through Sparkle Suite, Neon Rabbit HQ, or another product.
- Treat follows as one-way by default. Do not implement mutual friends unless Louis explicitly changes the model.
- Add blocking/reporting before any deeper social controls.
- Keep every rep-facing click routed back to the rep-owned Sparkle Suite site, live, or board.
- Do not apply Supabase migrations until Louis explicitly approves.
- Do not commit, push, deploy, or smoke live production until Louis explicitly asks.

### UI Positioning

The feature should feel like a collector home base, not a social network clone.

Approved product promise:

```text
Keep up with your favorite reps, follow collectors whose Showcases inspire you, and let Nic-Nac help you track what you love.
```

Primary labels:

- `Favorite Reps`
- `Favorites`
- `Sparkle Showcase`
- `Collectors`
- `Follow`
- `Following`
- `Rep notes`
- `Next show`
- `Trade board`
- `Ask Nic-Nac`

Avoid labels:

- `Marketplace`
- `Trade with this collector`
- `Buy from member`
- `Sell your jewelry`
- `DM`
- `Message seller`
- `Friend request`
- `Customer trade`

---

## File Structure

Active implementation workbench:

```text
C:\Users\louis\sparkle-finder-repo
```

Binder-safe plan location:

```text
C:\Users\louis\sparkle-finder\docs\superpowers\plans\2026-06-17-sparkle-finder-social-favorites.md
```

Expected create files:

- `lib/sparkle-finder/social-types.ts`
  - Shared types for favorite reps, collector follows, social caps, profile discovery, report/block records, and display models.

- `lib/sparkle-finder/favorite-reps-service.ts`
  - Pure service helpers for mapping read-only rep/show/board data into favorite rep cards and dashboard rows.

- `lib/sparkle-finder/favorite-reps-actions.ts`
  - Pure validation helpers for heart/unheart, notes, caps, and permission checks.

- `lib/sparkle-finder/collector-social-service.ts`
  - Public Showcase/profile search and follow/follower read models.

- `lib/sparkle-finder/collector-social-actions.ts`
  - Pure permission helpers for follow/unfollow, block, report, and visibility.

- `components/favorites/FavoriteRepHeartButton.tsx`
  - Client button for hearting/unhearting reps with pending and disabled states.

- `components/favorites/FavoriteRepsPanel.tsx`
  - Compact favorite rep shortcut panel for logged-in hub surfaces.

- `components/favorites/FavoriteRepsDashboard.tsx`
  - Silver dashboard for favorite reps, next shows, board links, and notes.

- `components/favorites/FavoriteRepNotesForm.tsx`
  - Silver-only note editor for one favorite rep.

- `components/social/CollectorSearch.tsx`
  - Profile/search UI for public Sparkle Showcases.

- `components/social/CollectorFollowButton.tsx`
  - One-way follow/unfollow control.

- `components/social/CollectorSocialPanel.tsx`
  - Following/followers summary and public Showcase shortcuts.

- `components/social/SocialSafetyControls.tsx`
  - Block/report controls used on public Showcase and collector profile surfaces.

- `app/(hub)/favorites/page.tsx`
  - Logged-in Favorites page. Free users see compact favorite reps; Silver users see full dashboard.

- `app/(hub)/collectors/page.tsx`
  - Public Showcase/collector discovery for logged-in users.

- `app/(hub)/favorites/actions.ts`
  - Server actions for favorite reps and notes.

- `app/(hub)/collectors/actions.ts`
  - Server actions for follows, blocks, reports, and profile search submissions.

- `supabase/migrations/20260617_sparkle_finder_social_favorites.sql`
  - Migration file only. Do not apply until approved.

- `tests/sparkle-finder/favorite-reps-service.test.ts`
  - Pure favorite rep mapping and entitlement tests.

- `tests/sparkle-finder/favorite-reps-actions.test.ts`
  - Favorite rep action validation tests.

- `tests/sparkle-finder/collector-social-service.test.ts`
  - Public profile discovery and follow read-model tests.

- `tests/sparkle-finder/collector-social-actions.test.ts`
  - Follow/block/report permission tests.

- `tests/smoke/sparkle-finder-social-favorites.spec.ts`
  - Browser smoke for hearting reps, Favorites page, collector discovery, follows, and safety controls.

Expected modify files:

- `app/(hub)/silver/page.tsx`
  - Add Favorite Reps and collector social entry points inside the Silver workspace, near Nic-Nac and Showcase surfaces.

- `app/(hub)/reps/page.tsx` or the current rep directory route
  - Add heart controls to rep cards.

- `app/(hub)/calendar/page.tsx` or the current live calendar route
  - Add heart controls to show/rep entries and a favorite-reps filter.

- `app/(hub)/boards/page.tsx` or the current board/trade-board route
  - Add heart controls to rep board owner cards and a favorite-reps filter where practical.

- `app/showcase/[handle]/page.tsx`
  - Add follow and safety controls to public Showcases.

- `components/layout/SparkleFinderNav.tsx`
  - Add `Favorites` and `Collectors` navigation for logged-in users, keeping nav compact.

- `components/nic-nac/FinderNicNacWorkspace.tsx`
  - Add quick prompts for favorite reps and followed collectors.

- `lib/sparkle-finder/nic-nac/tools/index.ts`
  - Route favorite rep and collector-follow phrases to social tools.

- `lib/sparkle-finder/nic-nac/tools/find-reps.ts`
  - Prefer favorite reps when answering relevant rep discovery questions.

- `lib/sparkle-finder/nic-nac/tools/save-favorite-rep.ts`
  - Persist favorite rep changes through the new favorite rep service.

- `lib/sparkle-finder/legal-content.ts`
  - Add social/favorites/follow/block/report language.

- `lib/sparkle-finder/copy-guardrails.ts`
  - Extend blocked marketplace/trading language.

- `tests/sparkle-finder/routes.test.ts`
  - Add route and nav expectations.

- `tests/sparkle-finder/copy-guardrails.test.ts`
  - Add social copy guardrail coverage.

- `scripts/smoke-sparkle-finder.ts`
  - Include the new smoke spec in the local smoke runner.

---

## Data Model

Create the migration file only:

```text
C:\Users\louis\sparkle-finder-repo\supabase\migrations\20260617_sparkle_finder_social_favorites.sql
```

Do not run `supabase db push` until Louis explicitly approves.

Tables:

```sql
create table if not exists public.sparkle_finder_favorite_reps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  rep_id text not null,
  rep_display_name text not null default '',
  rep_site_url text,
  rep_board_url text,
  notes text not null default '',
  notify_next_show boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, rep_id)
);

create table if not exists public.sparkle_finder_collector_follows (
  id uuid primary key default gen_random_uuid(),
  follower_user_id uuid not null references auth.users(id) on delete cascade,
  followed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_user_id, followed_user_id),
  check (follower_user_id <> followed_user_id)
);

create table if not exists public.sparkle_finder_collector_blocks (
  id uuid primary key default gen_random_uuid(),
  blocker_user_id uuid not null references auth.users(id) on delete cascade,
  blocked_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null default '',
  created_at timestamptz not null default now(),
  unique (blocker_user_id, blocked_user_id),
  check (blocker_user_id <> blocked_user_id)
);

create table if not exists public.sparkle_finder_social_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('collector_profile', 'showcase', 'favorite_rep')),
  target_id text not null,
  reason text not null check (reason in ('spam', 'harassment', 'scam_or_impersonation', 'inappropriate', 'other')),
  details text not null default '',
  created_at timestamptz not null default now()
);
```

RLS rules:

- Favorite reps: user can select/insert/update/delete only their own rows.
- Follows: users can manage only their own following rows; public follower counts must be read through safe aggregate helpers or policies that do not expose blocked relationships.
- Blocks: blocker can manage own block rows; blocked users cannot select rows identifying who blocked them unless a future moderation design requires it.
- Reports: authenticated users can insert reports; reports are not publicly selectable.
- Public profile/showcase reads must respect `showcase_visibility = 'public'` and block relationships.

---

## Task 1: Lock Social UX Contract In Tests

**Files:**

- Modify: `tests/sparkle-finder/routes.test.ts`
- Modify: `tests/sparkle-finder/copy-guardrails.test.ts`
- Create: `tests/sparkle-finder/favorite-reps-service.test.ts`
- Create: `tests/sparkle-finder/collector-social-service.test.ts`

- [ ] **Step 1: Add route expectations for Favorites and Collectors**

Add tests that render the authenticated nav and assert:

```ts
expect(markup).toContain("Favorites");
expect(markup).toContain("Collectors");
expect(markup).toContain("/favorites");
expect(markup).toContain("/collectors");
```

Expected absent strings:

```ts
expect(markup).not.toMatch(/marketplace/i);
expect(markup).not.toMatch(/customer-to-customer/i);
expect(markup).not.toMatch(/dm/i);
expect(markup).not.toMatch(/message seller/i);
```

- [ ] **Step 2: Add Silver workspace expectations**

Assert `/silver` includes:

```text
Favorite Reps
Sparkle Showcase
Ask Nic-Nac
```

Assert `/silver` does not include:

```text
Friend request
Trade with this collector
Marketplace
```

- [ ] **Step 3: Add copy guardrail tests**

Add disallowed visible marketing phrases:

```ts
[
  "trade with this collector",
  "buy from this member",
  "sell your jewelry",
  "message seller",
  "customer marketplace",
  "friend request",
]
```

Allow legal disclaimer wording only in legal content where the sentence says Sparkle Finder does not support those behaviors.

- [ ] **Step 4: Run failing tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/copy-guardrails.test.ts
```

Expected: FAIL because routes, nav items, and guardrails are not all present yet.

---

## Task 2: Add Social Types And Fixture Models

**Files:**

- Create: `lib/sparkle-finder/social-types.ts`
- Modify: `lib/fixtures/sparkle-finder-fixtures.ts`
- Test: `tests/sparkle-finder/favorite-reps-service.test.ts`
- Test: `tests/sparkle-finder/collector-social-service.test.ts`

- [ ] **Step 1: Define social types**

Create:

```ts
export type FavoriteRepAccessLevel = "free" | "silver";

export type FavoriteRep = {
  id: string;
  userId: string;
  repId: string;
  repDisplayName: string;
  repSiteUrl: string | null;
  repBoardUrl: string | null;
  notes: string;
  notifyNextShow: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FavoriteRepCard = FavoriteRep & {
  nextShowAt: string | null;
  nextShowTitle: string | null;
  boardItemCount: number;
  isSilverEnhanced: boolean;
};

export type CollectorFollow = {
  id: string;
  followerUserId: string;
  followedUserId: string;
  createdAt: string;
};

export type CollectorBlock = {
  id: string;
  blockerUserId: string;
  blockedUserId: string;
  reason: string;
  createdAt: string;
};

export type SocialReportReason =
  | "spam"
  | "harassment"
  | "scam_or_impersonation"
  | "inappropriate"
  | "other";

export type SocialReport = {
  id: string;
  reporterUserId: string;
  targetType: "collector_profile" | "showcase" | "favorite_rep";
  targetId: string;
  reason: SocialReportReason;
  details: string;
  createdAt: string;
};

export type PublicCollectorProfile = {
  userId: string;
  handle: string;
  displayName: string;
  tagline: string;
  photoUrl: string | null;
  showcaseUrl: string;
  followerCount: number;
  followingCount: number;
  publicPieceCount: number;
  isFollowedByViewer: boolean;
  isBlockedByViewer: boolean;
};
```

- [ ] **Step 2: Add fixture data**

Add fixture favorite reps:

```ts
export const sparkleFinderFavoriteReps = [
  {
    id: "favorite-rep-kelli-jo",
    userId: "user-silver-sparkle-mama",
    repId: "rep-kelli-jo",
    repDisplayName: "Kelli Jo",
    repSiteUrl: "/reps/kelli-jo",
    repBoardUrl: "/boards/kelli-jo",
    notes: "Great ring lives and easy Saturday rewatch.",
    notifyNextShow: false,
    createdAt: "2026-06-17T12:00:00.000Z",
    updatedAt: "2026-06-17T12:00:00.000Z",
  },
  {
    id: "favorite-rep-lindsey",
    userId: "user-silver-sparkle-mama",
    repId: "rep-lindsey",
    repDisplayName: "Lindsey",
    repSiteUrl: "/reps/lindsey",
    repBoardUrl: "/boards/lindsey",
    notes: "",
    notifyNextShow: true,
    createdAt: "2026-06-17T12:10:00.000Z",
    updatedAt: "2026-06-17T12:10:00.000Z",
  },
] satisfies FavoriteRep[];
```

Add fixture follows, blocks, and reports using the new types. Keep at least one public followed collector and one blocked relationship for tests.

- [ ] **Step 3: Run type-focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/favorite-reps-service.test.ts tests/sparkle-finder/collector-social-service.test.ts
```

Expected: FAIL until services exist.

---

## Task 3: Build Favorite Reps Pure Service

**Files:**

- Create: `lib/sparkle-finder/favorite-reps-service.ts`
- Test: `tests/sparkle-finder/favorite-reps-service.test.ts`

- [ ] **Step 1: Write service tests**

Cover:

```ts
it("returns favorite rep cards with next show and board links");
it("keeps free favorite reps compact");
it("enables Silver enhanced notes and filters");
it("sorts favorite reps by next show first, then display name");
it("does not expose favorite reps across users");
```

- [ ] **Step 2: Implement service helpers**

Create:

```ts
export function getFavoriteRepCardsForUser(input: {
  userId: string;
  hasSilverAccess: boolean;
}): FavoriteRepCard[];

export function getFavoriteRepIdsForUser(userId: string): Set<string>;

export function isRepFavoritedByUser(input: {
  userId: string;
  repId: string;
}): boolean;

export function sortFavoriteRepCards(cards: FavoriteRepCard[]): FavoriteRepCard[];
```

Rules:

- Fixture-backed initially.
- Preserve read-only rep/show/board data ownership.
- If `hasSilverAccess` is false, return cards with `isSilverEnhanced: false` and empty private notes in public contexts.
- If `hasSilverAccess` is true, include notes and notify metadata.

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/favorite-reps-service.test.ts
```

Expected: PASS.

---

## Task 4: Build Favorite Reps Action Validation

**Files:**

- Create: `lib/sparkle-finder/favorite-reps-actions.ts`
- Create: `tests/sparkle-finder/favorite-reps-actions.test.ts`

- [ ] **Step 1: Write action tests**

Cover:

```ts
it("allows logged-in users to favorite a rep");
it("allows users to remove only their own favorite rep");
it("limits free users to a small favorite rep count if a cap is configured");
it("allows Silver users to save rep notes");
it("prevents free users from saving Silver rep notes");
it("trims notes to 500 characters");
it("rejects empty rep ids");
```

- [ ] **Step 2: Implement pure helpers**

Create:

```ts
export const FREE_FAVORITE_REP_LIMIT = 5;
export const FAVORITE_REP_NOTE_MAX_LENGTH = 500;

export function canFavoriteRep(input: {
  userId: string | null;
  currentFavoriteCount: number;
  hasSilverAccess: boolean;
}): { allowed: boolean; reason?: "sign_in_required" | "free_limit_reached" };

export function canEditFavoriteRepNotes(input: {
  userId: string | null;
  hasSilverAccess: boolean;
  favoriteOwnerUserId: string;
}): boolean;

export function normalizeFavoriteRepNote(value: unknown): string;

export function normalizeRepId(value: unknown): string;
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/favorite-reps-actions.test.ts
```

Expected: PASS.

---

## Task 5: Add Favorite Reps Migration File

**Files:**

- Create: `supabase/migrations/20260617_sparkle_finder_social_favorites.sql`
- Test: `tests/sparkle-finder/favorite-reps-actions.test.ts`

- [ ] **Step 1: Create migration file without applying it**

Include the table definitions and RLS policies from the Data Model section.

- [ ] **Step 2: Add policy comments**

Each policy should have a short SQL comment explaining the intended access boundary:

```sql
comment on table public.sparkle_finder_favorite_reps is
  'Customer-scoped favorite reps for Sparkle Finder. Rep data remains owned by Sparkle Suite/Finder read models.';
```

- [ ] **Step 3: Do not apply migration**

Do not run:

```bash
supabase db push
supabase migration up
```

Expected: migration exists for review only.

---

## Task 6: Add Favorite Reps Server Actions

**Files:**

- Create: `app/(hub)/favorites/actions.ts`
- Test: `tests/sparkle-finder/favorite-reps-actions.test.ts`

- [ ] **Step 1: Add server action tests or mocked operation tests**

Cover:

```ts
it("inserts a favorite rep for the authenticated user");
it("deletes only the authenticated user's favorite rep");
it("updates notes only for Silver users");
it("returns a friendly error when Supabase is unavailable");
```

- [ ] **Step 2: Implement actions**

Create:

```ts
export type FavoriteRepActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function favoriteRepAction(
  previousState: FavoriteRepActionState,
  formData: FormData,
): Promise<FavoriteRepActionState>;

export async function unfavoriteRepAction(formData: FormData): Promise<void>;

export async function saveFavoriteRepNotesAction(
  previousState: FavoriteRepActionState,
  formData: FormData,
): Promise<FavoriteRepActionState>;
```

Validation:

- Must use Sparkle Finder auth.
- Must verify current customer account.
- Must not use Sparkle Suite auth.
- Must enforce Silver for notes.
- Must revalidate `/favorites`, `/silver`, and any relevant rep/calendar/board path.

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/favorite-reps-actions.test.ts
```

Expected: PASS.

---

## Task 7: Build Favorite Rep UI Components

**Files:**

- Create: `components/favorites/FavoriteRepHeartButton.tsx`
- Create: `components/favorites/FavoriteRepsPanel.tsx`
- Create: `components/favorites/FavoriteRepsDashboard.tsx`
- Create: `components/favorites/FavoriteRepNotesForm.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Add render tests**

Assert:

```text
Favorite Reps
Next show
Trade board
Rep notes
```

Assert absent:

```text
Buy
Sell
Trade with collector
Marketplace
```

- [ ] **Step 2: Implement heart button**

Requirements:

- Uses a heart icon, not a text-only control.
- Has accessible labels:
  - `Add rep to favorites`
  - `Remove rep from favorites`
- Shows pending state.
- Does not resize the containing card when clicked.
- For signed-out contexts, links/prompts to sign in.

- [ ] **Step 3: Implement compact panel**

Free and Silver users see:

- Rep name.
- Next show if available.
- Site link.
- Trade board link.

Silver users additionally see:

- Note preview.
- `Ask Nic-Nac` shortcut.
- Reminder-ready indicator if `notifyNextShow` is true.

- [ ] **Step 4: Implement dashboard**

Use restrained product UI, not a marketing hero:

- Header: `Favorite Reps`
- Dense card/list rows.
- Favorite-reps filter/search.
- Next-show sort.
- Notes drawer or inline form.
- Empty state with a button to browse reps.

- [ ] **Step 5: Run route tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

---

## Task 8: Wire Favorite Hearts Into Existing Rep Surfaces

**Files:**

- Modify: `app/(hub)/reps/page.tsx` or current rep directory route
- Modify: `app/(hub)/calendar/page.tsx` or current calendar route
- Modify: `app/(hub)/boards/page.tsx` or current board route
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Identify actual route/component files**

Use:

```bash
rg -n "Rep|rep|calendar|board|dance|live" app components lib tests
```

Expected: locate the actual current route/component names before editing.

- [ ] **Step 2: Add heart buttons to rep cards**

Each rep card should include `FavoriteRepHeartButton` near the rep name or top-right action cluster.

- [ ] **Step 3: Add heart buttons to calendar rows**

Each live/show row should let the user favorite the show owner rep without leaving the calendar.

- [ ] **Step 4: Add favorite filter where useful**

Calendar and board pages should support a filter named:

```text
Favorite reps
```

Only show results owned by favorited reps when selected.

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/favorite-reps-service.test.ts
```

Expected: PASS.

---

## Task 9: Build Favorites Page

**Files:**

- Create: `app/(hub)/favorites/page.tsx`
- Modify: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Add route tests**

Assert `/favorites` renders:

```text
Favorites
Favorite Reps
Next show
Trade board
```

For Silver fixture users, assert:

```text
Rep notes
Ask Nic-Nac
```

- [ ] **Step 2: Implement page**

Rules:

- Requires logged-in customer.
- Free users get compact favorite reps and Silver upgrade cue for notes/reminders.
- Silver users get the full dashboard.
- No public marketing hero.
- No nested cards.

- [ ] **Step 3: Add nav item**

Add `Favorites` to signed-in nav. Keep nav compact; if the existing nav is already crowded, use a menu/dropdown rather than a long horizontal row.

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

---

## Task 10: Build Collector Social Pure Service

**Files:**

- Create: `lib/sparkle-finder/collector-social-service.ts`
- Test: `tests/sparkle-finder/collector-social-service.test.ts`

- [ ] **Step 1: Write service tests**

Cover:

```ts
it("searches public collector profiles by handle");
it("searches public collector profiles by display name");
it("hides private profiles");
it("hides blocked relationships");
it("returns follow status for the viewer");
it("returns follower and following counts");
it("does not expose private collection notes");
```

- [ ] **Step 2: Implement service helpers**

Create:

```ts
export function searchPublicCollectorProfiles(input: {
  query: string;
  viewerUserId: string | null;
  limit?: number;
}): PublicCollectorProfile[];

export function getPublicCollectorProfile(input: {
  handle: string;
  viewerUserId: string | null;
}): PublicCollectorProfile | undefined;

export function getCollectorFollowSummary(input: {
  userId: string;
  viewerUserId: string | null;
}): {
  followerCount: number;
  followingCount: number;
  isFollowedByViewer: boolean;
};
```

Rules:

- Public only.
- Respect blocked relationships in both directions.
- Never include private notes or private collection item fields.

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/collector-social-service.test.ts
```

Expected: PASS.

---

## Task 11: Build Collector Social Action Validation

**Files:**

- Create: `lib/sparkle-finder/collector-social-actions.ts`
- Create: `tests/sparkle-finder/collector-social-actions.test.ts`

- [ ] **Step 1: Write action tests**

Cover:

```ts
it("allows authenticated users to follow public collectors");
it("prevents users from following themselves");
it("makes duplicate follows idempotent");
it("allows users to unfollow only their own follow row");
it("prevents following a blocked collector");
it("allows users to block another collector");
it("removes follow rows when a block is created");
it("allows authenticated users to report profiles");
it("limits report details to 700 characters");
```

- [ ] **Step 2: Implement pure helpers**

Create:

```ts
export const SOCIAL_REPORT_DETAILS_MAX_LENGTH = 700;

export function canFollowCollector(input: {
  viewerUserId: string | null;
  targetUserId: string;
  isTargetPublic: boolean;
  isBlockedRelationship: boolean;
}): { allowed: boolean; reason?: "sign_in_required" | "self_follow" | "private_profile" | "blocked" };

export function canBlockCollector(input: {
  viewerUserId: string | null;
  targetUserId: string;
}): boolean;

export function normalizeSocialReportReason(value: unknown): SocialReportReason;

export function normalizeSocialReportDetails(value: unknown): string;
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/collector-social-actions.test.ts
```

Expected: PASS.

---

## Task 12: Add Collector Server Actions

**Files:**

- Create: `app/(hub)/collectors/actions.ts`
- Test: `tests/sparkle-finder/collector-social-actions.test.ts`

- [ ] **Step 1: Implement server actions**

Create:

```ts
export type CollectorSocialActionState = {
  status: "idle" | "success" | "error";
  message: string;
};

export async function followCollectorAction(formData: FormData): Promise<void>;

export async function unfollowCollectorAction(formData: FormData): Promise<void>;

export async function blockCollectorAction(
  previousState: CollectorSocialActionState,
  formData: FormData,
): Promise<CollectorSocialActionState>;

export async function reportCollectorAction(
  previousState: CollectorSocialActionState,
  formData: FormData,
): Promise<CollectorSocialActionState>;
```

Validation:

- Must use Sparkle Finder auth.
- Must reject self-follow and self-block.
- Must verify target profile is public for follow.
- Must remove or ignore follow rows after block.
- Must not expose report rows publicly.
- Must revalidate `/collectors`, `/showcase/[handle]`, and profile-related routes.

- [ ] **Step 2: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/collector-social-actions.test.ts
```

Expected: PASS.

---

## Task 13: Build Collector Discovery UI

**Files:**

- Create: `components/social/CollectorSearch.tsx`
- Create: `components/social/CollectorFollowButton.tsx`
- Create: `components/social/CollectorSocialPanel.tsx`
- Create: `components/social/SocialSafetyControls.tsx`
- Create: `app/(hub)/collectors/page.tsx`
- Modify: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Add route tests**

Assert `/collectors` renders:

```text
Collectors
Sparkle Showcase
Follow
Public Showcases
```

Assert absent:

```text
Friend request
DM
Marketplace
Trade
```

- [ ] **Step 2: Implement collector search**

Search by:

- handle
- display name

Show:

- avatar/photo if available
- display name
- handle
- tagline
- public piece count
- follower count
- `View Showcase`
- `Follow`/`Following`

- [ ] **Step 3: Implement safety controls**

Controls:

- `Report`
- `Block`

Rules:

- Use confirmation for block.
- Report form requires reason.
- Keep copy calm and not punitive.

- [ ] **Step 4: Add nav item**

Add `Collectors` to signed-in nav or a compact logged-in menu.

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/collector-social-service.test.ts
```

Expected: PASS.

---

## Task 14: Add Follow And Safety Controls To Public Showcases

**Files:**

- Modify: `app/showcase/[handle]/page.tsx`
- Modify: `components/showcase/SparkleShowcaseProfile.tsx`
- Modify: `tests/sparkle-finder/showcase-routes.test.ts`
- Test: `tests/sparkle-finder/collector-social-actions.test.ts`

- [ ] **Step 1: Add route tests**

Assert public Showcase pages show:

```text
Follow
Report
Sparkle Showcase
```

Assert owner/self views do not show a self-follow button.

- [ ] **Step 2: Wire follow button**

Use `CollectorFollowButton` in the profile masthead.

- [ ] **Step 3: Wire safety controls**

Use `SocialSafetyControls` in a secondary area of the profile masthead or overflow menu.

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-routes.test.ts tests/sparkle-finder/collector-social-actions.test.ts
```

Expected: PASS.

---

## Task 15: Integrate With Silver Workspace And Nic-Nac

**Files:**

- Modify: `app/(hub)/silver/page.tsx`
- Modify: `components/nic-nac/FinderNicNacWorkspace.tsx`
- Modify: `lib/sparkle-finder/nic-nac/tools/index.ts`
- Modify: `lib/sparkle-finder/nic-nac/tools/find-reps.ts`
- Modify: `lib/sparkle-finder/nic-nac/tools/save-favorite-rep.ts`
- Test: `tests/sparkle-finder/finder-nic-nac-tools.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Add Nic-Nac intent tests**

Add phrases:

```text
Who are my favorite reps?
Show me Lindsey's next live.
Remember Kelli Jo as one of my favorite reps.
Which of my favorite reps has this piece?
Find collectors with public Showcases like mine.
```

Expected intents:

- `rep_discovery`
- `memory`
- `availability`
- `social`

- [ ] **Step 2: Add quick prompts**

Add Silver prompts:

```text
Show my favorite reps
Find my favorite reps' next lives
Help me find collectors with similar Showcases
Remember this rep as a favorite
```

- [ ] **Step 3: Update tools**

Rules:

- `find-reps` should prefer or flag favorite reps when relevant.
- `save-favorite-rep` should persist through the favorite reps action/service path.
- Tools must enforce Silver for note/memory writes.
- Read-only rep lookup can remain available where the logged-in hub already permits it.

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/finder-nic-nac-tools.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

---

## Task 16: Legal, Privacy, And Copy Guardrails

**Files:**

- Modify: `lib/sparkle-finder/legal-content.ts`
- Modify: `lib/sparkle-finder/copy-guardrails.ts`
- Modify: `tests/sparkle-finder/copy-guardrails.test.ts`
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Update legal content**

Add plain-English coverage for:

- Favorite reps.
- Public profiles and public Sparkle Showcases.
- Follows/followers.
- Blocking.
- Reports and moderation review.
- Public sharing links.
- No DMs.
- No customer-to-customer trading, marketplace, escrow, payment, fulfillment, or dispute handling.

- [ ] **Step 2: Update guardrail helper**

Block social/trading drift in visible app copy:

```text
trade with this collector
buy from this member
sell your jewelry
message seller
customer marketplace
escrow
friend request
DM me
```

- [ ] **Step 3: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/copy-guardrails.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

---

## Task 17: Visual QA And Responsive Polish

**Files:**

- Inspect: `app/(hub)/favorites/page.tsx`
- Inspect: `app/(hub)/collectors/page.tsx`
- Inspect: `app/(hub)/silver/page.tsx`
- Inspect: `app/showcase/[handle]/page.tsx`
- Test: browser/Playwright screenshots

- [ ] **Step 1: Start local preview only when Louis has approved implementation**

Use the existing local preview pattern, usually:

```bash
npm run dev
```

Expected: local preview at `http://127.0.0.1:4310/` or the repo's configured port.

- [ ] **Step 2: Desktop visual pass**

Check:

- `/favorites`
- `/collectors`
- `/silver`
- `/showcase/sparkle-mama`
- rep directory
- calendar
- board list

Verify:

- No nested card stacks.
- No card text overflow.
- Heart buttons are stable-size icon buttons.
- Favorite filter controls do not shift layout.
- Social controls feel secondary, not loud.
- Public Showcase first viewport still centers the collector's jewelry, not social chrome.

- [ ] **Step 3: Mobile visual pass**

Check at 390px width:

- Favorites dashboard rows wrap cleanly.
- Collector search cards do not overflow.
- Follow/report/block controls remain tappable.
- Nav remains usable.
- No visible text overlap.

- [ ] **Step 4: Fix visual bugs**

Fix any overflow, wrapping, density, focus, or spacing issue before final verification.

---

## Task 18: Smoke Tests

**Files:**

- Create: `tests/smoke/sparkle-finder-social-favorites.spec.ts`
- Modify: `scripts/smoke-sparkle-finder.ts`
- Modify: `verification/sparkle-finder/smoke-report.md`

- [ ] **Step 1: Add Playwright smoke**

Smoke should verify:

- `/favorites` loads for fixture/authenticated preview.
- Favorite Reps panel renders.
- Heart button is visible on rep cards.
- Favorite reps filter is visible on calendar/board surfaces where implemented.
- `/collectors` loads.
- Search returns a public collector.
- Public Showcase has `Follow` and `Report`.
- No banned marketplace/trading text appears in visible body text.
- Mobile `/favorites` and `/collectors` have no obvious overflow.

- [ ] **Step 2: Add smoke runner entry**

Include the new spec in the Sparkle Finder smoke runner.

- [ ] **Step 3: Run local smoke**

Run:

```bash
npm run smoke:sparkle-finder
```

Expected: PASS, with API-dependent checks skipped only when required env vars are absent.

---

## Task 19: Pressure Tests

**Files:**

- Test: `tests/sparkle-finder/favorite-reps-actions.test.ts`
- Test: `tests/sparkle-finder/collector-social-actions.test.ts`
- Test: `tests/sparkle-finder/collector-social-service.test.ts`
- Test: `tests/smoke/sparkle-finder-social-favorites.spec.ts`

- [ ] **Step 1: Permission pressure**

Verify:

- User A cannot edit User B favorite reps.
- User A cannot delete User B follows.
- User cannot follow self.
- User cannot block self.
- Blocked relationship hides profiles from search results.
- Report rows are not publicly selectable.

- [ ] **Step 2: Entitlement pressure**

Verify:

- Free users can favorite reps up to the free cap.
- Free users cannot save rep notes.
- Silver users can save rep notes.
- Silver users see full Favorites dashboard.
- Free users see upgrade cue without losing basic favorites.

- [ ] **Step 3: Copy pressure**

Run guardrail tests and scan visible route markup for:

```text
buy
sell
marketplace
trade with collector
DM
friend request
```

Expected: no user-facing violations outside legal disclaimers.

- [ ] **Step 4: Data pressure**

Use tests to simulate:

- 0 favorite reps.
- 1 favorite rep.
- 25 favorite reps.
- No upcoming shows.
- Missing board URL.
- Private Showcase.
- Blocked followed collector.

Expected: empty states and partial-data states remain useful.

---

## Task 20: Final Verification And Handoff

**Files:**

- Inspect: `git diff --stat`
- Inspect: `git diff --check`
- Run: focused tests, full tests, build, smoke

- [ ] **Step 1: Check diff scope**

Run:

```bash
git diff --stat
git diff --check
```

Expected:

- No whitespace errors.
- No unrelated edits.
- `supabase/.temp/` untouched.
- Migration created but not applied.
- No deployment changes.

- [ ] **Step 2: Run focused unit tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/favorite-reps-service.test.ts tests/sparkle-finder/favorite-reps-actions.test.ts tests/sparkle-finder/collector-social-service.test.ts tests/sparkle-finder/collector-social-actions.test.ts tests/sparkle-finder/routes.test.ts tests/sparkle-finder/copy-guardrails.test.ts
```

Expected: PASS.

- [ ] **Step 3: Run full test suite**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 5: Run smoke**

Run:

```bash
npm run smoke:sparkle-finder
```

Expected: PASS, with documented skips only for unavailable external env/API paths.

- [ ] **Step 6: Prepare handoff**

Include:

- Routes added.
- Favorite rep behavior.
- Free vs Silver behavior.
- Collector follow behavior.
- Blocking/reporting behavior.
- Nic-Nac integration.
- Tests run.
- Build result.
- Smoke result.
- Migration file created but not applied.
- Any remaining Supabase, deploy, commit, or push step requiring Louis approval.

---

## Sub-Agent Execution Strategy

Use `superpowers:subagent-driven-development` after Louis approves this plan.

Recommended sub-agent split:

1. **Favorite Reps Foundation Agent**
   - Tasks 2-6.
   - Owns social types, fixtures, favorite reps service/actions, migration favorite-rep portion, and tests.

2. **Favorite Reps UI Agent**
   - Tasks 7-9.
   - Owns heart buttons, Favorites page, nav, rep/calendar/board integration, and route tests.

3. **Collector Social Foundation Agent**
   - Tasks 10-12.
   - Owns collector discovery service/actions, follow/block/report validation, migration social portion, and tests.

4. **Collector Social UI Agent**
   - Tasks 13-14.
   - Owns collector discovery UI, public Showcase follow/safety controls, nav, and route tests.

5. **Nic-Nac And Copy Guardrails Agent**
   - Tasks 15-16.
   - Owns Nic-Nac routing/tool updates, legal/copy guardrails, and tests.

6. **Verification Agent**
   - Tasks 17-20.
   - Owns visual QA, smoke tests, pressure tests, build, diff check, and handoff.

Review gates:

- After Agent 1: favorite reps domain model passes.
- After Agent 2: favorite reps UI is visible and stable.
- After Agent 3: collector follows/block/report domain passes.
- After Agent 4: public social UI is visible and safe.
- After Agent 5: Nic-Nac and copy safety are aligned.
- After Agent 6: complete smoke/pressure/build handoff.

---

## Self-Review

Spec coverage:

- Favorite reps with hearts: Tasks 3-9.
- Free vs Silver membership split: Tasks 4, 7, 9, 19.
- Favorite reps dashboard: Tasks 7 and 9.
- Show times and trade boards: Tasks 3, 7, 8, 9.
- Rep notes and Silver convenience: Tasks 4, 6, 7, 9.
- Public profile/search/discovery: Tasks 10 and 13.
- Follow instead of mutual friends: Tasks 10-14.
- Block/report before deeper social: Tasks 11-14.
- Nic-Nac favorite rep memory/tooling: Task 15.
- No trading/marketplace/DMs: Guardrails, legal, route assertions, smoke, and pressure tests in Tasks 1, 16, 18, and 19.
- Smoke and pressure testing: Tasks 18 and 19.
- Sub-agent strategy: dedicated section included.

Placeholder scan:

- No `TBD`, `TODO`, or "implement later" placeholders.
- Every task has concrete files, behavior, commands, and expected outcomes.

Type consistency:

- `FavoriteRep`, `FavoriteRepCard`, `PublicCollectorProfile`, `CollectorFollow`, `CollectorBlock`, `SocialReport`, and `SocialReportReason` are defined before use.
- Action state names use `FavoriteRepActionState` and `CollectorSocialActionState` consistently.

## Execution Options

Plan complete and saved to:

```text
docs/superpowers/plans/2026-06-17-sparkle-finder-social-favorites.md
```

Two execution options after Louis approves:

1. **Subagent-Driven (recommended)** - dispatch a fresh subagent per slice, review between slices, fast iteration.
2. **Inline Execution** - execute tasks in this session using executing-plans, with checkpoints after each major feature area.

