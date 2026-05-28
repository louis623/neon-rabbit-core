# Proof of Ownership and Trust

Intent update: 2026-05-28

## Louis's Starting Position

Keep proof of ownership simple. If a customer physically has the piece, that may be good enough at first. Heavy verification could make the product feel like work, and the customer-side platform should stay easy for both Sparkle Suite and customers.

Bad actors should be identifiable through ratings, reporting, reputation, and moderation rather than forcing every honest customer through a difficult proof process.

## Working Trade Rule

Start with the same fairness rules as the rep trade board:

- same collection
- same jewelry type
- year does not matter where the collection identity is equivalent
- no buy/sell in first version
- no cross-category trade-ups in first version

Example: April Birthday earrings can trade for April Birthday earrings. April Birthday earrings should not trade for April Birthday ring in the first version.

## Practical Ownership Levels

### Level 0: Library-only Collection Item

Customer selects a piece from the jewelry library and adds it to their collection or wishlist.

Use for:

- collection showcase
- wishlist
- matching interest
- non-trade browsing

Risk:

- low, because no trade is being initiated.

### Level 1: Self-Attested Trade Item

Customer marks an item as available for trade and confirms they physically have it.

Use for:

- first KISS trade flow
- low-friction testing

Possible copy:

`I confirm I physically have this piece and can ship it if a trade is accepted.`

Risk:

- moderate, because a bad actor can lie.

Mitigation:

- account verification
- report button
- visible trade history
- internal risk flags
- rating after completed trade

### Level 2: Photo-Guided Trade Item

Nic-Nac asks the customer for a clean photo of the item. The customer can also select the matching jewelry library record. Nic-Nac can reject blurry, dark, cropped, or unusable photos.

Use for:

- first public trade board if Level 1 feels too loose
- higher-trust listings
- uncataloged pieces

Risk:

- lower than self-attestation, but still not proof against every scam.

Mitigation:

- photo quality checks
- optional photo of reveal box/label
- visible `photo provided` badge

### Level 3: Verified Trade Item

Customer provides stronger evidence, such as item photo plus box/label photo, timestamp card, short video, or rep-confirmed origin.

Use for:

- future high-trust trading
- repeat disputes
- rare pieces
- diamonds/unicorns if needed

Risk:

- lower, but higher friction.

Mitigation:

- reserve for higher-risk cases, not default first-version behavior.

## KISS Recommendation

Use a two-state first version:

- `In Collection`: customer selected or uploaded the piece.
- `Available to Trade`: customer confirms possession and provides a Nic-Nac-approved photo.

Do not require a box/label photo for every item in the first version. Consider requiring it only for:

- uncataloged pieces
- rare/high-interest pieces
- accounts with low reputation
- accounts with prior reports
- disputes

## Trust Features That Keep The Workflow Lightweight

- verified email before posting trade listings
- optional verified phone for higher trust
- visible completed trade count
- simple post-trade rating
- report user/report listing action
- internal risk flags hidden from public
- ability to pause a suspicious account from posting new trades
- clear rule: no selling, no off-topic advertising, no politics

## Open Workflow Questions

- Does a first-time trader need a photo before posting, or only before a trade is accepted?
- Should trade listings show customer state, region, or shipping-from state?
- Who sees shipping address and when?
- Should both sides upload tracking numbers?
- What happens if one person ships and the other does not?
- Does Sparkle Suite only provide a record/reporting layer, or does it mediate?
