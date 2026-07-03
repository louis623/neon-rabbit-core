# Reps Main Tab Design

## Goal

Add a simple `Reps` destination to Sparkle Finder so customers can browse Sparkle Suite reps without getting lost.

The feature should answer one customer question:

```text
Which Sparkle Suite reps can I follow, and when is their next show?
```

This is a customer browsing directory, not a rep management area. Reps continue to manage their Sparkle Suite profile, shows, boards, and business settings inside Sparkle Suite.

## Approved Direction

Use option 1 from the placement discussion:

- Add `Reps` as a main app navigation item.
- Keep the page simple and mobile-first.
- Do not hide the rep directory behind Nic-Nac or the Find flow.

Recommended app navigation:

```text
Home
Library
Find
Reps
Account
```

On mobile web, `Reps` should appear in the existing menu now and should map cleanly to a future bottom-tab app shell.

## Product Scope

The first version should provide a complete customer-facing list of Sparkle Suite reps that are eligible for Sparkle Finder discovery.

Each listed rep should show:

- small profile photo or safe fallback avatar,
- rep display name,
- business name when available,
- rep state/location when available,
- current show status such as `Live now`, `Live today`, `Next show Friday`, or `No show scheduled`,
- next show date/time in customer-friendly wording,
- favorite/save rep control for signed-in customers,
- public customer-facing rep site link when available,
- public customer-facing board link when available.

Keep the page focused on browsing. Do not add rep onboarding, claim flows, account editing, shop behavior, paid links, marketplace behavior, or customer-to-customer trading.

## Information Architecture

Create a `/reps` route as the main directory.

Page structure:

1. Header: `Sparkle Suite Reps`
2. Short support copy: `Browse reps, check show times, and save your favorites.`
3. Search/filter control.
4. Compact status chips:
   - `Live now`
   - `Live today`
   - `Upcoming`
   - `Favorites`
5. Mobile-first rep list.
6. Empty state when no reps match the current filter.

The page should not open with a large marketing hero. It should feel like an app list: fast, clear, and useful on a phone.

## Rep Card Design

Use compact list cards rather than large profile cards.

Each card should include:

- a 40-48px circular avatar,
- primary line: rep display name,
- secondary line: business name or state/location,
- status line: next show timing,
- small actions row.

Recommended actions:

- `View Rep`
- `Board`
- favorite heart icon

If a rep has no upcoming show, show `No show scheduled` instead of hiding the rep.

If a rep does not have a board link, hide the `Board` action for that card.

If a rep is currently live or live today, that status should be visually obvious but not loud. Use the Amethyst skin accents already introduced in the homepage redesign.

## Data Model And Source

Sparkle Suite should remain the source of truth for the complete rep list.

Sparkle Finder already has local rep primitives:

- `RepSummary`
- `LiveShow`
- `RepBoardListing`
- favorite-rep persistence
- read-only availability/live-show discovery tools

The implementation should use the existing local fixture path where tests need deterministic data, but production should read from a safe Sparkle Suite/Finder discovery feed that returns only customer-safe fields.

Minimum customer-safe rep payload:

```ts
type FinderRepDirectoryCard = {
  repId: string;
  displayName: string;
  businessName: string | null;
  avatarUrl: string | null;
  state: string | null;
  customerSiteUrl: string | null;
  repBoardUrl: string | null;
  nextShow: {
    id: string;
    title: string;
    startsAt: string;
    status: "scheduled" | "live" | "completed";
    customerShowUrl: string | null;
  } | null;
};
```

Do not expose private rep identifiers, private Sparkle Suite settings, internal board tooling URLs, admin links, customer contact details, private notes, or mutation endpoints.

## Data Flow

The `/reps` page should:

1. Load the customer-safe rep directory data.
2. Normalize show timing into customer-friendly labels.
3. Sort live and soonest upcoming shows first.
4. Keep reps without upcoming shows visible after active/upcoming reps.
5. Merge signed-in favorite state when the customer is authenticated.
6. Render the same basic list for free and Silver customers, with Silver-only enhancements only if they already exist in current favorite-rep behavior.

Suggested default sort:

1. `Live now`
2. `Live today`
3. Soonest upcoming show
4. Reps with no scheduled show, alphabetically

Search should match rep display name, business name, and state/location.

## Relationship To Existing Features

This feature should reuse and clarify existing rep behavior.

Existing surfaces that should continue working:

- `/rep-boards`
- `/live-shows`
- `/favorites`
- item detail availability leads
- Nic-Nac availability and favorite-rep tools
- linked-rep account claim/context

The new `Reps` page should not remove those routes. It becomes the customer-friendly doorway for browsing reps, while existing routes can remain contextual or support deeper flows.

Nic-Nac may offer help on the page, such as `Ask Nic-Nac which favorite reps are live next`, but Nic-Nac should not be required to browse the directory.

## Navigation Behavior

Update the app nav to include `Reps`.

Desktop nav:

```text
Home | Library | Find | Reps | Account
```

Mobile menu:

```text
Home
Library
Find
Reps
Account
Log Out
```

The public anonymous nav remains focused on sign-in for this design. A public anonymous rep directory is out of scope for this spec.

## Access Rules

Preferred first implementation:

- signed-in Sparkle Finder customers can open `/reps`,
- anonymous users who open `/reps` should be routed through the existing auth gate if the app currently gates customer pages,
- free and Silver users can browse the directory,
- signed-in users can favorite reps according to existing favorite-rep rules,
- no customer can edit rep data from Sparkle Finder.

If the current app architecture already allows public preview pages for reps, the implementation may keep a preview-safe anonymous version, but it must not expose private rep data.

## Error And Empty States

If the directory feed fails:

```text
Rep list is unavailable right now.
```

Show a retry link or direct customers to `Ask Nic-Nac for Help` only if that route can answer without relying on the same failing data source.

If no reps match search:

```text
No reps match that search.
```

If there are no upcoming shows:

```text
No show scheduled.
```

Do not show scary or vague messages. The page should feel calm even when data is missing.

## Visual Direction

Use the current Amethyst skin direction:

- warm paper background,
- amethyst/plum headings,
- rose/amethyst accents for live status,
- white list cards,
- small circular avatars,
- restrained borders and shadows.

Avoid oversized cards, command-center panels, dense dashboards, or marketing copy.

Mobile priorities:

- search and filters reachable near the top,
- tap targets at least 44px tall,
- no horizontal scrolling,
- stable row heights where possible,
- fast list rendering.

## Testing And QA

Add or update tests to cover:

- app nav includes `Reps`,
- `/reps` route renders a simple rep directory,
- rep cards show avatar, rep name, state/location, and next show timing,
- reps with no upcoming show remain visible,
- live or live-today reps sort above later shows,
- signed-in favorite-rep controls still render,
- existing `/rep-boards`, `/live-shows`, `/favorites`, and item availability tests still pass,
- anonymous access behavior matches the chosen route gate.

Smoke test:

- `/`
- `/library`
- `/reps`
- `/auth/sign-in`
- existing Sparkle Finder smoke suite

Pressure test:

- 390px mobile view with long rep names,
- 430px mobile view,
- 768px tablet,
- 1440px desktop,
- a large rep list sample to check scroll performance,
- missing avatar,
- missing board link,
- no upcoming show.

## Out Of Scope

Do not add:

- rep profile editing in Sparkle Finder,
- Sparkle Suite admin tools,
- show creation or show editing,
- board mutation,
- checkout,
- paid links,
- marketplace behavior,
- customer-to-customer trading,
- customer-facing forms beyond existing profile/account/billing patterns,
- a complex onboarding wizard.

## Implementation Notes

Likely code areas:

- `components/layout/SparkleFinderNav.tsx`
- `app/(hub)/reps/page.tsx`
- a new compact rep directory component under `components/reps/`
- `lib/sparkle-finder/service.ts` or a dedicated rep-directory read adapter
- existing favorite-rep components/actions if the card supports saving
- `tests/sparkle-finder/routes.test.ts`
- Sparkle Finder smoke tests

If production data needs a new Sparkle Suite endpoint, keep it read-only and customer-safe. Finder should consume the endpoint; it should not own rep management data.
