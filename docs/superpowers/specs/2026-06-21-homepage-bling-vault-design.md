# Homepage Bling Vault Design

## Goal

Make the authenticated Sparkle Finder homepage feel like the customer can immediately step into and browse their collection. The section below the existing homepage tools should become a mobile-first collection experience, not another utilitarian dashboard panel.

The approved direction is a hybrid of:

- a rotating Hero Piece spotlight,
- one compact Wishlist rail,
- and a Bling Vault masonry wall for the rest of the collection.

## Product Intent

The customer should scroll down from the homepage tools and feel, "This is my collection." The experience should be visual, personal, and a little special, while still preserving simple actions such as viewing a piece, finding Wishlist leads, and opening the larger Silver collection workflow.

The current "Your Collection" preview panel is too quiet and operational. It should be replaced with a richer homepage collection preview that feels like a signature Sparkle Finder moment.

## Mobile-First Layout

Mobile is the primary design target.

The phone flow should stack vertically:

1. Hero Piece spotlight.
2. Wishlist swipe rail.
3. Bling Vault masonry feed.

The Hero Piece is a full-width visual card with one featured owned/highlighted/new/recent piece. It can rotate through eligible pieces, but should pause or stay stable when the customer interacts with it.

The Wishlist rail is a short horizontal swipe area below the hero. It should show only Wishlist items and simple actions such as View Piece, Ask Nic-Nac, or Search Leads. Do not add multiple rails on mobile.

The Bling Vault is a two-column masonry feed below the Wishlist. It should show the rest of the collection with varied but stable tile heights, status labels, and simple tap-through behavior.

## Tablet And Desktop Layout

Tablet and desktop should expand the same structure instead of using a separate concept.

The Hero Piece can sit as the main visual area on the left, with the Wishlist rail as a side panel on the right. The Bling Vault Mosaic should sit below and flow under the hero/wishlist row, using more columns as space allows.

Desktop may feel more like the earlier Collection Theater plus Bling Vault concept, but the underlying content order and component responsibilities should remain the same as mobile.

## Performance Model

The Bling Vault must be safe for large collections.

Requirements:

- Initial render should include only the hero piece, a small Wishlist slice, and the first small batch of vault items.
- Vault images should lazy-load.
- Additional vault items should load as the customer scrolls near the end of the current batch.
- Tile dimensions should be stable before images finish loading to avoid layout jumping.
- The masonry feed should degrade gracefully if JavaScript is slow or disabled.

The first implementation can use deterministic batches from existing collection data. Deeper virtualization or server pagination can be a later enhancement if real collections grow large enough to require it.

## Component Shape

Introduce a homepage collection feature component rather than expanding `SilverCollectorSpace` further.

Recommended components:

- `HomepageCollectionExperience`: owns the whole authenticated homepage collection section.
- `HeroPieceSpotlight`: renders the rotating or selected feature piece.
- `WishlistRail`: renders one compact Wishlist strip.
- `BlingVaultMosaic`: renders the lazy-loaded masonry wall.
- `BlingVaultTile`: renders each collection piece tile using the existing smart jewelry image frame where possible.

The existing `SilverCollectorSpace` can either be slimmed down to profile/tools only or replaced on the homepage by the new collection experience plus a smaller profile summary. The implementation plan should inspect the current homepage balance before deciding the smallest safe cut.

## Data Rules

Use the authenticated customer collection data already available on the homepage.

Suggested ordering:

- Hero candidates: highlighted owned pieces first, then owned pieces, then newest collection items, then Wishlist fallback.
- Wishlist rail: Wishlist items only, newest or most recently added first.
- Vault mosaic: owned, highlighted, private-note, and Wishlist items not currently featured in the hero or Wishlist rail duplicate slots.

Empty states should be visual and action-oriented:

- No collection yet: show a beautiful starter vault with calls to Browse Library and Add to Wishlist.
- No Wishlist: keep the Wishlist rail compact with a prompt to add pieces from the library.
- No photos: use the existing jewelry frame/placeholder treatment rather than empty boxes.

## Interaction Rules

Keep interactions simple and phone-friendly.

- Hero piece tap opens the piece detail or collection piece detail.
- Wishlist item tap opens the piece; secondary action can invoke Nic-Nac when available.
- Vault tile tap opens the piece.
- Avoid advanced filters on the homepage.
- Provide one clear link to manage the full collection on the Silver page.

## Testing And QA

Add route/render tests for:

- authenticated homepage renders the new collection experience,
- Hero Piece appears before Wishlist and Bling Vault in markup order,
- empty collection state stays useful,
- large fixture collection renders a bounded first batch,
- Bling Vault tiles use stable sizing and lazy images.

Add smoke coverage for:

- mobile homepage shows Hero Piece, Wishlist, and Bling Vault in the intended order,
- desktop homepage expands the same content without overlap,
- no console errors,
- no framework overlay,
- no layout overlap with the footer.

## Open Implementation Notes

The exact hero rotation interval should be conservative. It should not feel like an ad carousel. A slow rotation or manual dot selector may be better than aggressive auto-advance.

The first masonry implementation can use CSS columns or CSS grid with stable tile classes. If visual QA shows awkward ordering or jumps, switch to an explicit grid layout with deterministic tile spans.
