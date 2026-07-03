# Mobile-First Homepage Overhaul Design

## Goal

Make Sparkle Finder feel immediately understandable on a phone.

The product promise is:

```text
Find the pieces you love. Build your collection with Sparkle Finder.
```

The signed-in homepage should not feel like a command center, admin hub, or map of product features. It should feel like a simple app home that helps a customer find pieces, grow a collection, and ask Nic-Nac only when help is useful.

## Approved Direction

Use the visual companion recommendation:

1. Open to option A, the Simple Home Dashboard.
2. Use option B as the collection layer customers flow into from Home.
3. Use option C as the guided find flow behind the primary Find a Piece action.

This is not a full rebuild. It is a focused homepage and navigation overhaul that keeps current data, routes, collection stats, Bling Vault, library, and Nic-Nac capabilities.

## Brand And Theme Direction

Louis approved changing the look toward the Sparkle Suite Amethyst customer-facing site skin.

This supersedes the earlier "not Amethyst" Sparkle Finder brand direction for the simplified app-style redesign. The implementation should use Amethyst as a visual skin direction, not as customer-facing copy.

Expected feel:

- richer amethyst/plum/purple gemstone palette,
- polished customer-site warmth from Sparkle Suite,
- mobile-app clarity,
- high contrast for phone use,
- less blush-heavy dashboard styling,
- fewer bordered utility cards,
- simpler typography hierarchy.

Do not turn the UI into a one-note purple screen. Keep enough warm paper, white space, and accent contrast for readability and touch clarity.

## Homepage Information Architecture

The authenticated homepage should answer three questions:

1. What can I do here?
2. What is happening with my collection?
3. How do I find the next piece?

Recommended homepage order on mobile:

1. App header with Sparkle Finder identity and Account access.
2. Hero promise: "Find the pieces you love. Build your collection with Sparkle Finder."
3. Primary action: Find a Piece.
4. Secondary actions: My Collection and Browse Library.
5. Compact collection status: Owned, Wishlist, Diamonds, Unicorns, Found by Sparkle Finder.
6. Collection preview / Hero Piece.
7. Wishlist check prompt.
8. Bling Vault preview.

Desktop should expand the same flow. It should not introduce a separate desktop-only navigation concept.

## Navigation

Reduce the app navigation to the destinations customers can immediately understand.

Recommended top-level nav:

- Home
- Library
- Find
- Account

Optional, if needed after testing:

- Collection

Move these out of the primary nav:

- Live Shows
- Rep Boards
- Favorites
- Collectors
- Showcase
- Showcase Studio

Those surfaces can still exist, but they should appear contextually:

- Live shows and rep boards appear when a piece has leads.
- Favorites appears from rep/profile surfaces.
- Collectors appears from public Showcase discovery surfaces.
- Showcase Studio appears when a piece is missing from the library or the customer is managing their collection.

## Naming Rules

Use customer goals, not internal nouns.

Replace:

- "Nic-Nac Home" with "Find a Piece" or "Ask Nic-Nac for Help".
- "Command Center" with "Home".
- "Showcase" in primary nav with "My Collection" or remove from primary nav.
- "Bling Vault Mosaic" with "Your Collection" or "Bling Vault" depending on context.
- "Open Showcase Studio" with "Add a Missing Piece" when shown to customers.

Keep "Nic-Nac" as the helper's name, not a place.

## Simple Home Dashboard

The opening signed-in screen should be sparse.

It should include:

- one headline,
- one sentence of support copy,
- one primary button,
- two secondary buttons,
- one compact status area,
- and one visible next-step prompt.

Recommended copy:

```text
Find the pieces you love.
Build your collection with Sparkle Finder.
```

Primary action:

```text
Find a Piece
```

Secondary actions:

```text
My Collection
Browse Library
```

Avoid explanatory paragraphs above the fold.

## Collection Layer

The collection layer should preserve the approved Bling Vault direction but simplify how it is introduced.

Use:

- a Hero Piece preview,
- collection counts,
- a small Wishlist row,
- then the lazy-loading Bling Vault.

The customer should feel "this is my collection," not "this is a management panel."

The full management surface can remain on the existing Silver/Profile route for now, but the homepage should not expose every management tool.

## Guided Find Flow

The Find a Piece action should open or navigate to a simple guided find experience.

First-step options:

- I know the name.
- I know the collection.
- I have a photo or label.
- Check my Wishlist.
- Ask Nic-Nac.

The first implementation may route these options to existing Library search, item detail, Wishlist lead checks, or Nic-Nac. It does not need a new AI/file intake workflow in this pass.

## Nic-Nac Role

Nic-Nac should be a helper layer.

Nic-Nac should appear when:

- the customer is stuck,
- a Wishlist item needs lead checking,
- the customer wants help identifying or finding a piece,
- the app needs a friendly fallback.

Nic-Nac should not be the homepage concept, primary navigation label, or first thing the customer has to understand.

## Mobile-App Posture

Design the web app as if it will also become a mobile app soon.

Sparkle Finder must remain a first-class website that customers can open, log into, and use through the browser. The App Store and Google Play direction is an additional distribution path, not a replacement for the Sparkle Finder website.

Requirements:

- Thumb-friendly primary actions.
- Browser-safe responsive layout.
- Bottom-nav-friendly route set.
- Minimal above-the-fold copy.
- No dense command grids.
- Stable tile dimensions to protect scroll performance.
- Lazy loading for collection content.
- Clear empty states for new users.

The first production pass should keep web routes and server-rendered data. It should adopt a mobile-app mental model while preserving normal website access, deep links, auth redirects, and responsive desktop/tablet behavior.

## Out Of Scope

Do not add:

- shop behavior,
- paid links,
- marketplace features,
- customer-to-customer trading,
- new auth architecture,
- new payment behavior,
- full Studio file intake,
- or a complete app rebuild.

## Testing And QA

Add or update tests to cover:

- homepage no longer renders "Nic-Nac Home",
- authenticated nav exposes the simplified destinations,
- homepage renders the new promise copy,
- primary Find a Piece action is visible above the collection layer,
- collection stats remain Owned, Wishlist, Diamonds, Unicorns, and Found by Sparkle Finder,
- Bling Vault / collection content still lazy-loads safely,
- mobile smoke view has no overlapping text or oversized command grids.

Manual visual QA should check at least:

- 390px mobile,
- 430px mobile,
- 768px tablet,
- 1440px desktop.

## Implementation Notes

Likely code areas:

- `components/layout/SparkleFinderNav.tsx`
- `components/home/AuthenticatedHomePage.tsx`
- `components/home/FinderCommandCenter.tsx`
- `components/home/HomepageBlingVault.tsx`
- `components/home/HeroPieceSpotlight.tsx`
- `components/home/WishlistRail.tsx`
- homepage route/render tests
- homepage smoke tests

The safest implementation path is to replace `FinderCommandCenter` with a simpler app-home component and keep the existing Bling Vault components underneath it.
