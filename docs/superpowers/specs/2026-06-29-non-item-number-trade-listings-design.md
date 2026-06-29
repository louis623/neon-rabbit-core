# Non-Item-Number Trade Listings Design

Date: June 29, 2026

## Goal

Let Sparkle Suite reps add physical pieces already sitting on their trade boards to the same customer-facing Trade Board even when they no longer have the item number, without polluting the shared jewelry database.

The customer should experience these as ordinary Trade Board listings. The difference is only visible in the rep/Nic-Nac workflow and rep-side request details.

## Product Decisions

- Customer-facing language must not use "legacy", "miscellaneous", "grab bag", "unknown", "undocumented", or "Board Pieces".
- Customer-facing listings remain in the normal Trade Board grid, search, filters, request sheet, and request lifecycle.
- Rep-facing/Nic-Nac language may say "non-item number piece" or "piece without item number".
- New inventory should still use the normal item-number path whenever an item number is available.
- Non-item-number pieces are expected to be added only when the rep does not have the item number/card/details anymore.
- V1 is Nic-Nac only. There is no dashboard manual form.
- V1 is one piece at a time. There is no board-photo cropping, bulk importer, or batch add.
- V1 does not support converting a non-item-number listing into a catalog-backed listing. If the rep later finds the item number, they remove the non-item-number listing and add the piece normally.

## Customer Experience

Customers see one Trade Board.

Non-item-number listings:

- appear in the same grid as item-number listings;
- use the same search box;
- use the same collection, type, and size filters;
- use the same request flow;
- do not show a badge or explanation that the item number is missing.

The public listing title is auto-generated from controlled values:

- exact collection when available, otherwise broad collection family;
- jewelry type;
- size when applicable.

Examples:

- `July Birthday 2026 Ring - Size 7`
- `OG Ring - Size 8`
- `Spring Luxe Earrings`
- `Sterling Necklace`

## Rep And Nic-Nac Flow

The workflow remains one "add a Trade Board piece" flow with two branches.

Shared start:

1. Rep asks Nic-Nac to add a piece to the Trade Board.
2. Nic-Nac asks for either an item number or a clear customer-facing piece photo.

Item-number branch:

1. Rep provides an item number or item-number source.
2. Nic-Nac follows the existing catalog-backed add-listing workflow.
3. The listing writes through `jewelry_designs` as it does today.

Non-item-number branch:

1. Rep says they do not have the item number, or uploads only a customer-facing piece photo with no visible item number.
2. If Nic-Nac does not see an item number in the provided photo, Nic-Nac asks one clarifying question before branching: "I do not see an item number in this photo. Do you want me to add it as a non-item number piece?"
3. Nic-Nac collects required controlled fields:
   - clear item photo;
   - jewelry type;
   - broad collection family;
   - exact collection when known;
   - size when required for the jewelry type.
4. Nic-Nac creates a rep-owned Trade Board listing that does not create or update a shared jewelry database design.

Rep-side request/detail surfaces may show a small clarification such as `(non-item number piece)` so the rep understands why Sparkle Suite has no item-number/catalog match details.

## Controlled Fields

Jewelry type should use the existing controlled type set:

- ring;
- necklace;
- earrings;
- stack;
- bracelet.

Collection should use two levels:

- broad collection family is required;
- exact collection is optional when the rep knows it.

Broad collection examples:

- OG;
- Birthday;
- Sterling;
- Stacks;
- Simply Studs;
- Luxe or special collection family where applicable.

Exact collection examples:

- July Birthday 2026;
- Spring Luxe;
- Atlantis;
- a known exact Bomb Party collection name.

Size is required only for jewelry types that need size, especially rings.

## Data Model

Use the existing `trade_listings` lifecycle as the foundation.

Recommended schema direction:

- make `trade_listings.design_id` nullable;
- add listing-local fields for non-item-number listings;
- add an explicit source/mode field so code can distinguish catalog-backed and non-item-number rows.

Candidate columns:

- `listing_source` with values such as `catalog` and `non_item_number`;
- `manual_type_prefix`;
- `manual_collection_family`;
- `manual_collection_name`;
- `manual_size`;
- `manual_photo_url`;

Do not add a custom title field in v1. The public title should be computed from collection, type, and size. Existing `rep_notes` and `trade_preferences` remain available for rep/internal notes.

Constraints should enforce:

- catalog listings require `design_id`;
- non-item-number listings require local type, broad collection, and photo;
- ring-like non-item-number listings require size;
- non-item-number listings must not write to `jewelry_designs`.

The application can compute a display model that normalizes both listing types into the same public Trade Board card shape.

## Service And API Behavior

Add a dedicated service path for non-item-number listings rather than overloading the existing `addListing` item-number contract too loosely.

Possible service names:

- `addNonItemNumberListing`;
- `addManualTradeListing`;

The existing `addListing` path remains catalog-backed and item-number-first.

Board reads should return a unified listing view:

- catalog-backed listings map from `jewelry_designs`;
- non-item-number listings map from listing-local fields;
- public routes do not expose the source label to customers;
- rep workspace/detail routes may expose `listingSource` for internal clarification.

Trade requests, approvals, denials, removals, recovery, and fulfillment should continue to operate through `trade_requests.listing_id` and `trade_listings.id`.

## Nic-Nac Architecture

Application code owns the branch and workflow truth.

Add workflow state for:

- `catalogMode: item_number | non_item_number`;
- required fields for each mode;
- controlled field validation;
- photo role/quality;
- final mutation eligibility.

The model may:

- understand that the rep does not have an item number;
- ask the clarifying question when no item number is visible;
- suggest extracted type/collection/size from text or image context;
- call the correct app-owned tool when fields are complete.

The model may not:

- create a jewelry database design for a non-item-number listing;
- claim the item was added before tool success;
- invent an item number;
- silently branch to non-item-number mode without confirmation when ambiguity exists.

## Out Of Scope For V1

- Board-photo cropping or detection from one large board photo.
- Batch add.
- Dashboard manual form.
- Customer-facing badges, tabs, or separate sections.
- Custom customer-facing listing names.
- Conversion from non-item-number to catalog-backed listing.
- Shared jewelry database writes for non-item-number listings.
- Sparkle Finder catalog/library intake changes.

## Verification Requirements

Implementation must include:

- schema tests proving `trade_listings` supports both listing modes and enforces required fields;
- service tests for creating, listing, removing, restoring, and requesting non-item-number listings;
- public Trade Board tests proving non-item-number listings appear in the same grid/search/filter flow without customer-facing source language;
- rep-side tests proving request details can show `(non-item number piece)`;
- Nic-Nac workflow tests proving both branches stay in the same add-listing flow and tools remain available;
- hard-fail checks proving Nic-Nac does not write non-item-number pieces to `jewelry_designs`;
- stable demo reviewer-smoke with synthetic data before calling the feature ready for Louis review.

## Open Implementation Notes

- Existing `trade_listings.design_id` is currently `NOT NULL`, so this requires a migration.
- Existing code frequently assumes `listing.design` is present. The implementation should introduce a normalized listing view/type instead of scattering nullable design checks across every UI path.
- Existing trade request and history types also assume catalog design data. They need a clean shared formatter for customer-facing and rep-facing display.
- Keep current item-number behavior unchanged for normal listings.
