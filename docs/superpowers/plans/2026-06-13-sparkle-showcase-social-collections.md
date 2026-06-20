# Sparkle Showcase Social Collections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sparkle Finder's customer collection and social layer so customers can find, build, highlight, track, follow, and share their Sparkle Showcase, while finding reps who have wanted pieces.

**Architecture:** Extend the existing Silver collection system into a first-class Sparkle Showcase domain. Keep Sparkle Finder customer auth separate from other products, keep Sparkle Suite jewelry and rep data read-only, and add public showcase routes plus owner-only management actions, follows, comments, and reporting. Do not add customer-to-customer trading, buy/sell, checkout, escrow, fulfillment, or marketplace language.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS, Supabase SSR/RLS, Vitest, Playwright smoke tests.

---

## Product Language

- `Sparkle Showcase`: the customer's full jewelry profile and owned-piece space.
- `The Rarest of Reveals`: the Diamond, Unicorn, and special-find pinnacle section.
- `Showcase Collections`: customer-created groupings inside a Sparkle Showcase.
- `Reveal Spotlight`: a shareable feature view for one specific piece.
- `Bomb Party Collection`: official Bomb Party product metadata only, such as Originals, Birthday Bombs, Stacks, or monthly releases.

UI rule: never shorten `Showcase Collections` to `Collections` when referring to customer-made groupings.

## Current Repo State

Active implementation workbench:

```text
C:\Users\louis\sparkle-finder-repo
```

Current branch:

```text
codex-sparkle-finder-v1
```

Current git status at plan time:

```text
## codex-sparkle-finder-v1...origin/codex-sparkle-finder-v1
?? supabase/.temp/
```

Leave `supabase/.temp/` alone unless Louis explicitly asks to clean generated Supabase CLI state.

## Key Constraints

- Do not commit, push, deploy, or apply Supabase migrations unless Louis explicitly asks.
- Do not touch Sparkle Suite production.
- Do not share or repoint Sparkle Finder auth through another product.
- Sparkle Suite catalog and rep availability remain read-only from Sparkle Finder.
- No customer-to-customer trading in this build.
- Comments must support owner/commenter edit-delete rules plus bad-behavior/spam reporting.
- Follows are in scope.
- Profile activity feed is not in scope for this build.

## Design Brief

Product surface: Sparkle Finder's customer collection/social side.

Visual source: existing Sparkle Finder app and Sparkle Suite-adjacent brand language in `app/globals.css`, `components/layout/SparkleFinderNav.tsx`, and current Silver/library pages.

Interactivity level: full interactivity for local fixture preview and real server-action paths where Supabase is configured.

Primary screens:

- Public Sparkle Showcase at `/showcase/[handle]`.
- Showcase owner workspace at `/silver` or a new `/showcase/manage` route.
- Reveal Spotlight at `/showcase/[handle]/pieces/[pieceId]`.
- Showcase Collection view at `/showcase/[handle]/showcase-collections/[collectionSlug]`.

## File Structure

Create:

- `lib/sparkle-finder/showcase-types.ts`: Sparkle Showcase, Showcase Collection, comment, follow, and report types.
- `lib/sparkle-finder/showcase-service.ts`: fixture and Supabase mapping helpers for public showcase reads.
- `lib/sparkle-finder/showcase-actions.ts`: pure action helpers for local state and permission logic.
- `components/showcase/SparkleShowcaseProfile.tsx`: public profile page composition.
- `components/showcase/RarestReveals.tsx`: `The Rarest of Reveals` section.
- `components/showcase/ShowcaseCollectionRail.tsx`: public Showcase Collections section.
- `components/showcase/ShowcasePieceGrid.tsx`: owned/wishlist/ISO grid with filtering-ready structure.
- `components/showcase/RevealSpotlight.tsx`: single-piece public view.
- `components/showcase/ShowcaseComments.tsx`: comment list, edit/delete/report controls.
- `components/showcase/FollowButton.tsx`: client follow/unfollow control.
- `components/showcase/ShowcaseManager.tsx`: owner-side controls for visibility, showcase status, and Showcase Collections assignment.
- `app/showcase/[handle]/page.tsx`: public Sparkle Showcase route.
- `app/showcase/[handle]/pieces/[pieceId]/page.tsx`: public Reveal Spotlight route.
- `app/showcase/[handle]/showcase-collections/[collectionSlug]/page.tsx`: public Showcase Collection route.
- `app/showcase/actions.ts`: server actions for follow, comments, reports, and owner edits.
- `tests/sparkle-finder/showcase-service.test.ts`: pure service and permission coverage.
- `tests/sparkle-finder/showcase-routes.test.ts`: render tests for public and owner surfaces.
- `tests/sparkle-finder/showcase-actions.test.ts`: server-action and Supabase-operation coverage.
- `tests/smoke/sparkle-finder-showcase.spec.ts`: browser smoke for public showcase, follows, comments, and owner controls.
- `supabase/migrations/20260613_sparkle_showcase_social_collections.sql`: schema/RLS migration, created but not applied.

Modify:

- `lib/sparkle-finder/types.ts`: add or bridge showcase-related public types only if shared with existing code.
- `lib/fixtures/sparkle-finder-fixtures.ts`: add showcase fixture data.
- `lib/sparkle-finder/service.ts`: expose fixture showcase reads or delegate to `showcase-service`.
- `lib/sparkle-finder/customer-state.ts`: extend persisted collection item input only if owner save still flows through the Silver workspace.
- `app/(hub)/silver/page.tsx`: replace collection workspace copy and composition with Sparkle Showcase owner management.
- `app/(hub)/silver/actions.ts`: add owner-side save action for showcase item visibility/story/status if keeping Silver as the management route.
- `components/silver/CollectionManager.tsx`: either retire in favor of `ShowcaseManager` or narrow it to a wrapper around new showcase components.
- `components/layout/SparkleFinderNav.tsx`: add `Showcase` navigation for signed-in users.
- `app/globals.css`: add showcase-specific tokens/classes only where Tailwind utilities are insufficient.
- `tests/sparkle-finder/routes.test.ts`: update existing Silver copy expectations and nav assertions.
- `tests/smoke/sparkle-finder-home.spec.ts`: add route navigation expectations and public showcase smoke links.
- `lib/sparkle-finder/legal-content.ts`: update terms/privacy wording for public profiles, follows, comments, reports, moderation, and public visibility choices.

## Data Model

### Existing Table To Extend

`sparkle_finder_collection_items` currently stores one row per user and jewelry item.

Add fields:

```sql
alter table public.sparkle_finder_collection_items
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  add column if not exists showcase_status text not null default 'owned'
    check (showcase_status in ('owned', 'wishlist', 'iso', 'private_note_only')),
  add column if not exists reveal_story text not null default '',
  add column if not exists personal_photo_url text,
  add column if not exists is_rarest_reveal boolean not null default false;
```

Keep old `state` until the app is fully migrated. In code, map:

- old `owned` -> new `showcase_status: "owned"`
- old `wishlist` -> new `showcase_status: "wishlist"`
- old `private_note_only` -> new `showcase_status: "private_note_only"`

### New Tables

`sparkle_finder_showcase_collections`

- customer-created groupings inside a Sparkle Showcase
- public only when `visibility = 'public'`
- never called just `collections` in UI

`sparkle_finder_showcase_collection_items`

- joins collection items to Showcase Collections
- supports one piece appearing in multiple Showcase Collections

`sparkle_finder_showcase_follows`

- authenticated user follows public showcase owner
- unique pair: `follower_user_id, showcase_user_id`

`sparkle_finder_showcase_comments`

- comments on either a showcase profile or a piece
- author can edit/delete own comment
- showcase owner can delete comments on their showcase
- soft delete via `deleted_at`

`sparkle_finder_showcase_reports`

- reports for comments or profiles/pieces
- reason enum: `spam`, `harassment`, `scam_or_impersonation`, `inappropriate`, `other`
- no automated punishment in MVP; creates reviewable records

## Task 1: Design And Copy Lock

**Files:**
- Modify: `docs/superpowers/plans/2026-06-13-sparkle-showcase-social-collections.md`

- [ ] **Step 1: Confirm design direction with Louis**

Use this brief:

```text
Sparkle Showcase is the customer's shareable jewelry profile. It includes The Rarest of Reveals, Showcase Collections, Reveal Spotlight pages, follows, comments, and rep-discovery paths for wanted pieces. No customer-to-customer trading. Visual style should match the existing Sparkle Finder brand.
```

Expected: Louis confirms or edits the brief before implementation.

- [ ] **Step 2: Generate Product Design concept options if needed**

If Louis wants a visual redesign instead of using the current Sparkle Finder system, use Product Design ideation to generate exactly three options and wait for selection.

Expected: one selected visual target before major UI implementation.

- [ ] **Step 3: Lock route labels**

Use these labels:

```text
Navigation: Showcase
Page title: Sparkle Showcase
Pinnacle section: The Rarest of Reveals
Grouping section: Showcase Collections
Piece page: Reveal Spotlight
Rep matching: Rep leads
Wanted status: ISO
```

Expected: no UI string uses `My Collection`, `Curated Collections`, `Showcase Boards`, customer-to-customer trade, buy/sell, escrow, or marketplace language.

## Task 2: Domain Types And Fixtures

**Files:**
- Create: `lib/sparkle-finder/showcase-types.ts`
- Modify: `lib/fixtures/sparkle-finder-fixtures.ts`
- Modify: `lib/sparkle-finder/service.ts`
- Test: `tests/sparkle-finder/showcase-service.test.ts`

- [ ] **Step 1: Write failing service tests**

Create `tests/sparkle-finder/showcase-service.test.ts` with tests for:

```ts
import { describe, expect, it } from "vitest";
import {
  getPublicSparkleShowcaseByHandle,
  getRevealSpotlight,
  getShowcaseCollectionBySlug,
} from "../../lib/sparkle-finder/showcase-service";

describe("Sparkle Showcase service", () => {
  it("loads a public Sparkle Showcase by handle with public pieces only", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");

    expect(showcase?.profile.displayName).toBe("Sparkle Mama");
    expect(showcase?.pieces.every((piece) => piece.visibility === "public")).toBe(true);
    expect(showcase?.pieces.some((piece) => piece.isRarestReveal)).toBe(true);
  });

  it("keeps private notes and private pieces out of public showcase reads", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");

    expect(JSON.stringify(showcase)).not.toContain("Private note");
    expect(showcase?.pieces.find((piece) => piece.showcaseStatus === "private_note_only")).toBeUndefined();
  });

  it("loads The Rarest of Reveals from Diamond, Unicorn, and customer-highlighted rare pieces", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama");
    const rarest = showcase?.rarestReveals ?? [];

    expect(rarest.length).toBeGreaterThan(0);
    expect(rarest.every((piece) => piece.jewelryItem.bpLabel !== "standard" || piece.isRarestReveal)).toBe(true);
  });

  it("loads one Showcase Collection by slug", () => {
    const collection = getShowcaseCollectionBySlug("sparkle-mama", "never-leaving");

    expect(collection?.title).toBe("Never Leaving");
    expect(collection?.pieces.length).toBeGreaterThan(0);
  });

  it("loads a shareable Reveal Spotlight", () => {
    const spotlight = getRevealSpotlight("sparkle-mama", "jewel-rainbow-crown-ring");

    expect(spotlight?.piece.jewelryItem.name).toBe("Rainbow Crown Ring");
    expect(spotlight?.comments.length).toBeGreaterThan(0);
  });
});
```

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-service.test.ts
```

Expected: FAIL because the showcase service does not exist yet.

- [ ] **Step 2: Add showcase types**

Create `lib/sparkle-finder/showcase-types.ts`:

```ts
import type { CollectionItem, CustomerAccount, JewelryItem, SilverProfile } from "./types";

export type SparkleShowcaseVisibility = "private" | "public";
export type SparkleShowcaseItemStatus = "owned" | "wishlist" | "iso" | "private_note_only";
export type ShowcaseReportReason = "spam" | "harassment" | "scam_or_impersonation" | "inappropriate" | "other";

export type SparkleShowcaseProfile = {
  customer: CustomerAccount;
  profile: SilverProfile;
  handle: string;
  tagline: string;
  followerCount: number;
  followingCount: number;
  isFollowedByViewer: boolean;
};

export type SparkleShowcasePiece = CollectionItem & {
  jewelryItem: JewelryItem;
  visibility: SparkleShowcaseVisibility;
  showcaseStatus: SparkleShowcaseItemStatus;
  revealStory: string;
  personalPhotoUrl?: string | null;
  isRarestReveal: boolean;
};

export type ShowcaseCollection = {
  id: string;
  customerId: string;
  title: string;
  slug: string;
  description: string;
  visibility: SparkleShowcaseVisibility;
  pieceIds: string[];
};

export type ShowcaseCollectionWithPieces = ShowcaseCollection & {
  pieces: SparkleShowcasePiece[];
};

export type ShowcaseComment = {
  id: string;
  authorCustomerId: string;
  authorDisplayName: string;
  targetType: "showcase" | "piece";
  targetId: string;
  body: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type ShowcaseReport = {
  id: string;
  reporterCustomerId: string;
  targetType: "showcase" | "piece" | "comment";
  targetId: string;
  reason: ShowcaseReportReason;
  details: string;
  createdAt: string;
};

export type SparkleShowcase = {
  profile: SparkleShowcaseProfile;
  pieces: SparkleShowcasePiece[];
  rarestReveals: SparkleShowcasePiece[];
  showcaseCollections: ShowcaseCollectionWithPieces[];
  comments: ShowcaseComment[];
};
```

- [ ] **Step 3: Add fixture records**

Modify `lib/fixtures/sparkle-finder-fixtures.ts` to export:

```ts
export const sparkleFinderShowcaseCollections = [
  {
    id: "showcase-collection-never-leaving",
    customerId: "customer-silver-sparkle-mama",
    title: "Never Leaving",
    slug: "never-leaving",
    description: "The pieces that are staying with me.",
    visibility: "public",
    pieceIds: ["collection-owned-rainbow", "collection-owned-heart"],
  },
  {
    id: "showcase-collection-pink-dreams",
    customerId: "customer-silver-sparkle-mama",
    title: "Pink Dreams",
    slug: "pink-dreams",
    description: "Soft pinks, warm stones, and sweet reveal memories.",
    visibility: "public",
    pieceIds: ["collection-highlight-rose", "collection-wishlist-aurora"],
  },
] satisfies ShowcaseCollection[];
```

Also add fixture comments:

```ts
export const sparkleFinderShowcaseComments = [
  {
    id: "showcase-comment-rainbow-1",
    authorCustomerId: "customer-free-marlena",
    authorDisplayName: "Marlena",
    targetType: "piece",
    targetId: "collection-owned-rainbow",
    body: "That reveal was unreal.",
    createdAt: "2026-06-01T12:00:00.000Z",
    updatedAt: "2026-06-01T12:00:00.000Z",
    deletedAt: null,
  },
] satisfies ShowcaseComment[];
```

Expected: fixture data compiles after importing the new types.

- [ ] **Step 4: Implement fixture service reads**

Create `lib/sparkle-finder/showcase-service.ts` with:

```ts
export function getPublicSparkleShowcaseByHandle(handle: string): SparkleShowcase | undefined;
export function getShowcaseCollectionBySlug(handle: string, slug: string): ShowcaseCollectionWithPieces | undefined;
export function getRevealSpotlight(handle: string, jewelryItemId: string): { showcase: SparkleShowcase; piece: SparkleShowcasePiece; comments: ShowcaseComment[] } | undefined;
```

Implementation rules:

- Resolve `sparkle-mama` to `customer-silver-sparkle-mama` for fixture preview.
- Return only pieces where `visibility === "public"` and `showcaseStatus !== "private_note_only"`.
- Put any public Diamond, Unicorn, or `isRarestReveal` piece into `rarestReveals`.
- Join jewelry metadata through `getJewelryItemById`.
- Never expose private notes on public reads.

- [ ] **Step 5: Run service tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-service.test.ts
```

Expected: PASS.

## Task 3: Supabase Schema And RLS Migration

**Files:**
- Create: `supabase/migrations/20260613_sparkle_showcase_social_collections.sql`
- Test: `tests/sparkle-finder/showcase-actions.test.ts`

- [ ] **Step 1: Create migration file**

Create the migration, but do not apply it.

Include:

```sql
alter table public.sparkle_finder_profiles
  add column if not exists showcase_handle text unique,
  add column if not exists showcase_tagline text not null default '',
  add column if not exists photo_url text,
  add column if not exists showcase_visibility text not null default 'private'
    check (showcase_visibility in ('private', 'public'));

alter table public.sparkle_finder_collection_items
  add column if not exists visibility text not null default 'private'
    check (visibility in ('private', 'public')),
  add column if not exists showcase_status text not null default 'owned'
    check (showcase_status in ('owned', 'wishlist', 'iso', 'private_note_only')),
  add column if not exists reveal_story text not null default '',
  add column if not exists personal_photo_url text,
  add column if not exists is_rarest_reveal boolean not null default false;
```

Create the four new tables named in the Data Model section. Add RLS policies:

- Authenticated users can manage their own profile, own showcase collections, own collection item extensions, and own follows.
- Anyone can select public profiles where `showcase_visibility = 'public'`.
- Anyone can select public collection items where owner profile is public and item visibility is public.
- Authenticated commenters can insert comments.
- Comment authors can update/delete their own comments.
- Showcase owners can soft-delete comments on their showcase.
- Authenticated users can insert reports.
- Reports are not publicly selectable.

- [ ] **Step 2: Write action-operation tests**

Create `tests/sparkle-finder/showcase-actions.test.ts` covering:

```ts
it("allows the showcase owner to update piece visibility and story");
it("allows authenticated users to follow and unfollow public showcases");
it("allows a commenter to edit and delete their own comment");
it("allows the showcase owner to delete comments on their showcase");
it("prevents non-owner showcase item edits");
it("creates a report record without exposing report data publicly");
```

Expected initial run: FAIL because actions do not exist.

- [ ] **Step 3: Do not apply migration**

Do not run:

```bash
supabase db push
```

Expected: migration file exists for review only.

## Task 4: Owner-Side Sparkle Showcase Manager

**Files:**
- Create: `components/showcase/ShowcaseManager.tsx`
- Modify: `app/(hub)/silver/page.tsx`
- Modify: `app/(hub)/silver/actions.ts`
- Modify: `components/silver/CollectionManager.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`
- Test: `tests/sparkle-finder/showcase-actions.test.ts`

- [ ] **Step 1: Write route expectation tests**

Add expectations that Silver users see:

```text
Sparkle Showcase
The Rarest of Reveals
Showcase Collections
Reveal Spotlight
Make public
Add to Showcase Collection
Mark as ISO
Find reps with this piece
```

Also assert the route does not contain:

```text
Wishlist & Owned Collection
My Collection
Curated Collections
customer-to-customer
marketplace
```

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL until UI is updated.

- [ ] **Step 2: Implement owner controls**

`ShowcaseManager` should let the customer:

- Mark a piece `owned`, `wishlist`, `iso`, or `private_note_only`.
- Toggle public/private visibility.
- Mark/unmark `The Rarest of Reveals`.
- Edit reveal story.
- See Bomb Party Collection metadata separately from Showcase Collections.
- Add/remove a piece from fixture-backed Showcase Collections in local preview.
- Open the public Reveal Spotlight URL.
- Open rep leads for wishlist/ISO items.

- [ ] **Step 3: Update Silver route copy**

Change owner workspace language from `Sparkle Finder Workspace` to `Sparkle Showcase`.

Expected lead copy:

```text
Build, track, highlight, and share the pieces you own or hope to find.
```

Expected helper copy:

```text
Sparkle Showcase is for discovery and sharing. It does not support customer-to-customer trading.
```

- [ ] **Step 4: Add server action**

In `app/(hub)/silver/actions.ts`, add an action such as:

```ts
export async function saveShowcasePieceAction(
  previousState: SilverSaveActionState,
  formData: FormData,
): Promise<SilverSaveActionState>
```

Validate:

- authenticated user matches account row
- Silver access is active
- jewelry item exists in catalog
- status is one of `owned`, `wishlist`, `iso`, `private_note_only`
- visibility is `private` or `public`
- reveal story is trimmed to 700 characters
- private note is not copied to public reveal story

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/showcase-actions.test.ts
```

Expected: PASS.

## Task 5: Public Sparkle Showcase Route

**Files:**
- Create: `app/showcase/[handle]/page.tsx`
- Create: `components/showcase/SparkleShowcaseProfile.tsx`
- Create: `components/showcase/RarestReveals.tsx`
- Create: `components/showcase/ShowcaseCollectionRail.tsx`
- Create: `components/showcase/ShowcasePieceGrid.tsx`
- Modify: `components/layout/SparkleFinderNav.tsx`
- Test: `tests/sparkle-finder/showcase-routes.test.ts`

- [ ] **Step 1: Write route render tests**

Create `tests/sparkle-finder/showcase-routes.test.ts`:

```ts
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { renderSparkleShowcasePageContent } from "../../app/showcase/[handle]/page";
import { getPublicSparkleShowcaseByHandle } from "../../lib/sparkle-finder/showcase-service";

describe("Sparkle Showcase public routes", () => {
  it("renders a public Sparkle Showcase with rarest reveals and showcase collections", () => {
    const showcase = getPublicSparkleShowcaseByHandle("sparkle-mama")!;
    const markup = renderToStaticMarkup(renderSparkleShowcasePageContent(showcase));

    expect(markup).toContain("Sparkle Mama");
    expect(markup).toContain("Sparkle Showcase");
    expect(markup).toContain("The Rarest of Reveals");
    expect(markup).toContain("Showcase Collections");
    expect(markup).toContain("Reveal Spotlight");
    expect(markup).toContain("Rainbow Crown Ring");
    expect(markup).not.toContain("Private note");
    expect(markup).not.toContain("Customer-to-customer");
  });
});
```

Expected: FAIL until route/component exist.

- [ ] **Step 2: Implement public route**

`app/showcase/[handle]/page.tsx` should:

- load showcase by handle
- call `notFound()` when missing/private
- render public nav/footer
- export `renderSparkleShowcasePageContent(showcase)` for tests

- [ ] **Step 3: Implement public profile layout**

First viewport:

- profile masthead with display name, handle, tagline, state if public, counts, follow button, share link
- `The Rarest of Reveals` preview immediately visible

Below:

- Showcase Collections row
- full public piece grid
- comment area
- independence copy kept small and clear

- [ ] **Step 4: Add navigation**

Add signed-in nav item:

```text
Showcase
```

Link to:

```text
/silver
```

until the owner management route is split.

- [ ] **Step 5: Run route tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-routes.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

## Task 6: Reveal Spotlight And Showcase Collection Routes

**Files:**
- Create: `app/showcase/[handle]/pieces/[pieceId]/page.tsx`
- Create: `app/showcase/[handle]/showcase-collections/[collectionSlug]/page.tsx`
- Create: `components/showcase/RevealSpotlight.tsx`
- Test: `tests/sparkle-finder/showcase-routes.test.ts`

- [ ] **Step 1: Add failing tests**

Add tests that:

- Reveal Spotlight shows piece image/name, Bomb Party Collection metadata, Diamond/Unicorn label, reveal story, comments, and rep leads.
- Showcase Collection route shows the customer-created grouping title and pieces.
- Both routes hide private notes and private pieces.

- [ ] **Step 2: Implement Reveal Spotlight**

Content blocks:

- item image
- `Reveal Spotlight`
- piece name
- Bomb Party Collection metadata
- status chip: `Owned`, `Wishlist`, `ISO`, or `Private`
- `The Rarest of Reveals` chip when applicable
- reveal story
- rep lead panel for wishlist/ISO and exact availability
- comments

- [ ] **Step 3: Implement Showcase Collection page**

Use heading:

```text
{collection.title}
```

Use sublabel:

```text
Showcase Collection
```

Never use plain `Collection` as the customer-created grouping label.

- [ ] **Step 4: Run route tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-routes.test.ts
```

Expected: PASS.

## Task 7: Follows

**Files:**
- Create: `components/showcase/FollowButton.tsx`
- Modify: `app/showcase/actions.ts`
- Modify: `lib/sparkle-finder/showcase-actions.ts`
- Test: `tests/sparkle-finder/showcase-actions.test.ts`

- [ ] **Step 1: Add failing follow tests**

Expected behaviors:

- anonymous users are prompted to sign in
- authenticated users can follow public showcases
- users cannot follow themselves
- duplicate follows are idempotent
- unfollow removes only the current user's follow row

- [ ] **Step 2: Implement pure follow helper**

Create helpers:

```ts
export function canFollowShowcase(viewerUserId: string | null, showcaseUserId: string): boolean;
export function getFollowButtonLabel(isFollowing: boolean): "Follow" | "Following";
```

- [ ] **Step 3: Implement server actions**

In `app/showcase/actions.ts`:

```ts
export async function followShowcaseAction(formData: FormData): Promise<void>;
export async function unfollowShowcaseAction(formData: FormData): Promise<void>;
```

Use Supabase auth user, verify target showcase is public, then insert/delete.

- [ ] **Step 4: Implement client button**

`FollowButton` should:

- show `Follow` or `Following`
- use pending/loading state
- expose clear disabled state for anonymous/self profile cases
- submit to server action for real accounts
- update local fixture state in preview if no server action is provided

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-actions.test.ts tests/sparkle-finder/showcase-routes.test.ts
```

Expected: PASS.

## Task 8: Comments, Edit/Delete, And Reports

**Files:**
- Create: `components/showcase/ShowcaseComments.tsx`
- Modify: `app/showcase/actions.ts`
- Modify: `lib/sparkle-finder/showcase-actions.ts`
- Test: `tests/sparkle-finder/showcase-actions.test.ts`
- Test: `tests/sparkle-finder/showcase-routes.test.ts`

- [ ] **Step 1: Add failing comment permission tests**

Expected behaviors:

- authenticated users can create comments on public showcases and public pieces
- comment author can edit own comment
- comment author can delete own comment
- showcase owner can delete comments on their own showcase
- non-author and non-owner cannot edit/delete
- deleted comments do not render publicly
- reports can be created for spam/bad behavior

- [ ] **Step 2: Implement pure permission helpers**

Create helpers:

```ts
export function canEditComment(viewerUserId: string | null, commentAuthorId: string): boolean;
export function canDeleteComment(viewerUserId: string | null, commentAuthorId: string, showcaseOwnerId: string): boolean;
export function normalizeCommentBody(value: unknown): string;
export function normalizeReportReason(value: unknown): ShowcaseReportReason;
```

Rules:

- comment body min length 1 after trim
- comment body max length 500
- report details max length 700
- deletion is soft delete

- [ ] **Step 3: Implement server actions**

In `app/showcase/actions.ts`, add:

```ts
export async function createShowcaseCommentAction(previousState: CommentActionState, formData: FormData): Promise<CommentActionState>;
export async function editShowcaseCommentAction(previousState: CommentActionState, formData: FormData): Promise<CommentActionState>;
export async function deleteShowcaseCommentAction(formData: FormData): Promise<void>;
export async function reportShowcaseTargetAction(previousState: ReportActionState, formData: FormData): Promise<ReportActionState>;
```

Revalidate:

- `/showcase/[handle]`
- `/showcase/[handle]/pieces/[pieceId]` when target type is piece

- [ ] **Step 4: Implement comment UI**

`ShowcaseComments` should show:

- comment composer for signed-in users
- sign-in prompt for anonymous users
- edit and delete controls for comment author
- delete control for showcase owner
- report control for authenticated viewers
- report reason select
- success/error status messages

- [ ] **Step 5: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-actions.test.ts tests/sparkle-finder/showcase-routes.test.ts
```

Expected: PASS.

## Task 9: Rep Discovery For Wanted Pieces

**Files:**
- Modify: `components/showcase/RevealSpotlight.tsx`
- Modify: `components/showcase/ShowcasePieceGrid.tsx`
- Modify: `lib/sparkle-finder/showcase-service.ts`
- Test: `tests/sparkle-finder/showcase-service.test.ts`
- Test: `tests/sparkle-finder/showcase-routes.test.ts`

- [ ] **Step 1: Add tests for rep leads**

Expected:

- wishlist/ISO pieces show `Find reps with this piece`
- exact rep availability links go to Sparkle Suite rep/customer site when API-backed
- fixture availability uses local rep board paths
- owned pieces may show availability, but the CTA language is less urgent

- [ ] **Step 2: Add service match helper**

Expose:

```ts
export function getShowcasePieceRepLeads(piece: SparkleShowcasePiece): RepBoardMatch[];
```

Use existing `matchJewelryItemToRepBoardListings` and API availability helpers where available.

- [ ] **Step 3: Implement UI**

CTA language:

```text
Find reps with this piece
Rep leads
Exact item lead
Same Bomb Party Collection and type
```

Avoid:

```text
Buy
Sell
Trade with customer
Marketplace
```

- [ ] **Step 4: Run tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-service.test.ts tests/sparkle-finder/showcase-routes.test.ts
```

Expected: PASS.

## Task 10: Legal, Copy Guardrails, And Navigation Polish

**Files:**
- Modify: `lib/sparkle-finder/legal-content.ts`
- Modify: `lib/sparkle-finder/copy-guardrails.ts`
- Modify: `tests/sparkle-finder/copy-guardrails.test.ts`
- Modify: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Update legal docs**

Terms/privacy should mention:

- public Sparkle Showcase visibility choices
- follows
- comments
- reports
- moderation/removal
- public sharing links
- no customer-to-customer trading, marketplace, escrow, payment, fulfillment, or dispute handling

- [ ] **Step 2: Update guardrails**

Add copy guardrails for:

```text
customer-to-customer trade
buy from another customer
sell your jewelry
marketplace
escrow
```

Allow guarded phrases in legal no-marketplace disclaimers only if the existing guardrail helper supports contextual exceptions.

- [ ] **Step 3: Run copy tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/copy-guardrails.test.ts tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

## Task 11: Browser Smoke And Responsive QA

**Files:**
- Create: `tests/smoke/sparkle-finder-showcase.spec.ts`
- Modify: `scripts/smoke-sparkle-finder.ts`
- Test: `tests/smoke/sparkle-finder-showcase.spec.ts`

- [ ] **Step 1: Add Playwright smoke**

Smoke should verify:

- `/showcase/sparkle-mama` renders on desktop and mobile
- `The Rarest of Reveals` appears before full grid
- Showcase Collections render
- Reveal Spotlight link opens
- comment controls render according to viewer state
- follow button renders
- no text overlap on mobile
- no guardrail copy violations in visible body text

- [ ] **Step 2: Run focused unit tests**

Run:

```bash
npm run test
```

Expected: PASS.

- [ ] **Step 3: Run build**

Run:

```bash
npm run build
```

Expected: PASS.

- [ ] **Step 4: Run local smoke**

Run:

```bash
npm run smoke:sparkle-finder
```

Expected: PASS, with API-dependent checks skipped unless env vars are configured.

## Task 12: Final Review

**Files:**
- Inspect: `git diff --stat`
- Inspect: `git diff --check`
- Inspect: changed files from all prior tasks

- [ ] **Step 1: Check diff scope**

Run:

```bash
git diff --stat
git diff --check
```

Expected:

- no whitespace errors
- no unrelated edits
- no deployment changes
- no migration applied
- no commit created unless Louis asks

- [ ] **Step 2: Run final focused verification**

Run:

```bash
npm exec vitest run tests/sparkle-finder/showcase-service.test.ts tests/sparkle-finder/showcase-actions.test.ts tests/sparkle-finder/showcase-routes.test.ts
npm run test
npm run build
```

Expected: PASS.

- [ ] **Step 3: Prepare handoff**

Handoff should include:

- routes added
- social controls added
- moderation/reporting behavior
- tests run
- migration file created but not applied
- any production env or Supabase steps Louis still needs to approve

## One-Session Execution Strategy

Recommended execution order:

1. Types, fixtures, and pure showcase service.
2. Public route render tests and public UI.
3. Owner-side Sparkle Showcase manager.
4. Migration file and Supabase action tests.
5. Follows.
6. Comments, edit/delete, and reports.
7. Rep discovery panels for wishlist/ISO pieces.
8. Legal/copy guardrails.
9. Playwright smoke and responsive pass.

Stop points if the session needs to pause:

- After Task 2: safe model/service foundation only.
- After Task 5: public read-only Sparkle Showcase working.
- After Task 8: social core working.
- After Task 11: full build verified locally.

## Self-Review

Spec coverage:

- Find/build/highlight/track/share collections: covered by Tasks 2, 4, 5, and 6.
- Find reps with wanted pieces: covered by Task 9.
- Follows: covered by Task 7.
- Comments with edit/delete/report: covered by Task 8.
- No customer-to-customer trading: covered by constraints, guardrails, legal, and route tests.
- Naming conventions: covered by Product Language and route tests.
- Full-session plan: covered by One-Session Execution Strategy and stop points.

Placeholder scan:

- No `TBD`, `TODO`, or "implement later" placeholders.

Type consistency:

- `SparkleShowcase`, `SparkleShowcasePiece`, `ShowcaseCollection`, `ShowcaseComment`, and `ShowcaseReport` are defined before use.

## Execution Options

Plan complete and saved to:

```text
docs/superpowers/plans/2026-06-13-sparkle-showcase-social-collections.md
```

Two execution options:

1. Subagent-Driven recommended: dispatch a fresh worker per task and review between tasks.
2. Inline Execution: execute tasks in this session with checkpoints.

For Louis's requested one-session build, Inline Execution is the most straightforward unless parallel subagents are explicitly desired.
