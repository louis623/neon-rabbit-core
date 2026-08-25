# Louis Product Candidate Review Packet

Created: 2026-05-31
Status: required before exact products move to ready, live, or app data

This packet is the gate between a topic/category idea and an exact affiliate product recommendation. Use it after identifying a specific candidate listing and before Louis approval, public use, app data, or `ready` status.

This is a candidate-review packet, not final product selection. Passing packet review means the candidate can move forward for Louis approval and program readiness; it does not make the product live by itself.

## Non-Negotiable Rule

No exact product moves to `ready`, `live`, approved picks, app data, public guide links, or shop placements until Louis explicitly approves it in this packet.

## When To Use This Packet

Use this packet after a content topic exists and a specific candidate listing has been identified. One packet equals one exact candidate product or listing.

Do not use this packet to approve a broad product category. Category approval can support planning, but exact product/listing approval is required before a recommendation can become `ready`, `live`, approved pick, app data, public guide link, or shop placement.

## Candidate Snapshot

| Field | Notes |
|---|---|
| Candidate packet ID | `YYYY-MM-DD-lane-category-short-name` |
| Review owner | Name of person preparing candidate for Louis. |
| Lane | `collector` or `rep`. |
| Guide/topic fit | Link to the relevant topic doc in `content-guides/`. |
| Product category | Category only until Louis review starts. |
| Exact product name | Fill only when ready for Louis review. Do not add to public docs before approval. |
| Retailer/program | Record the program being considered. |
| Affiliate program status | For live links, must be `approved` or explicitly documented as `otherwise eligible` in `program-tracker.md`. `research`, `applied`, `rejected`, and `paused` do not satisfy live readiness. |
| Terms URL recorded? | Required before live link. Yes/no, with location in `program-tracker.md`. |
| Disclosure requirement recorded? | Required before live link. Yes/no, with location in `program-tracker.md`. |
| Intended placement | Guide, shop page, homepage strip, or other placement. |

## Program Readiness Rule

Before any live link, the affiliate program must be one of:

- `approved`
- explicitly documented as `otherwise eligible` in `program-tracker.md`, with a short note explaining why links may be used before or without normal approval

The following statuses do not satisfy live readiness:

- `research`
- `applied`
- `rejected`
- `paused`

Terms URL and disclosure requirements must also be recorded in `program-tracker.md` before any live link. If program status, terms, or disclosure requirements are unclear, the candidate stays in `needs program approval`, `needs disclosure`, `research`, or `paused` instead of moving to `ready` or `live`.

## Required Checks Before Louis Review

All checks must be completed before asking Louis to approve.

| Gate | Required Evidence | Pass / Fail / Pause | Notes |
|---|---|---|---|
| Fit | Plain-English reason this helps collectors or reps. |  |  |
| Quality | Review current listing details, materials/specs, recurring complaints, and visible quality signals. |  |  |
| Review pattern | Check recent negative reviews, repeated complaints, suspicious patterns, and mismatch between listing promise and user reports. |  |  |
| Seller/brand credibility | Check seller/company profile, support posture, listing consistency, and whether the brand feels credible enough for Sparkle Finder. |  |  |
| Return friction | Check return window, restocking/shipping friction, marketplace restrictions, personalized/custom item limits, and support path. |  |  |
| Availability stability | Check whether the product appears stable enough for a guide and whether seller or variant churn could create confusion. |  |  |
| Claims risk | Identify any unsupported claims Sparkle Finder must not repeat. |  |  |
| Program/content rules | Confirm whether images, ratings, prices, review snippets, logos, and product data can be used. |  |  |
| Disclosure placement | Draft the disclosure that will appear near the recommendation. |  |  |
| Trust copy | Draft issue-reporting copy near the recommendation. |  |  |

## Review Result Mapping

Use the same meaning for every gate:

- `Pass`: the gate is clean enough to proceed to Louis approval and program readiness review. It does not mean the product is ready/live.
- `Fail`: the candidate stays out of recommendations and should be rejected for this placement unless a materially different listing is reviewed.
- `Pause`: the candidate maps to product status `paused` or a research hold until the specific concern is resolved.

If any required gate is `Fail` or unresolved `Pause`, the candidate cannot move to `ready`, `live`, approved picks, app data, public guide links, or shop placements.

## Automatic Pause Triggers

Mark the candidate `paused` and do not send it to ready/live/app data if any of these are unresolved:

- repeated complaints about core function or quality
- suspicious review patterns
- unclear seller identity or weak support path
- difficult or unclear return process
- misleading listing claims
- fragile availability or confusing variants
- off-brand presentation
- compliance uncertainty around images, prices, ratings, reviews, or disclosures
- any concern Louis wants resolved before approval

## Disclosure Draft

Use this section to draft placement-specific disclosure before Louis approves.

```text
This guide may include affiliate links, which can earn Sparkle Finder a commission at no extra cost to you.
```

If the candidate uses Amazon links, the page must also clearly and prominently include:

```text
As an Amazon Associate I earn from qualifying purchases.
```

## Trust / Issue-Reporting Draft

```text
We are picky about affiliate recommendations. If a product or company gives you trouble, please let us know so we can review the recommendation.
```

Compact version:

```text
Affiliate pick. Tell us if this product or company gives you trouble.
```

## Louis Approval

Louis must complete this section.

| Approval Field | Response |
|---|---|
| Approved exact product? | yes / no / needs changes |
| Approved retailer/program? | yes / no / needs changes |
| Approved public placement? | yes / no / needs changes |
| Approved disclosure copy? | yes / no / needs changes |
| Approved trust/issue copy? | yes / no / needs changes |
| Conditions or changes required |  |
| Approval date |  |

## After Approval

Only after Louis approval:

1. Update `product-picks.md` with the approved candidate status.
2. Confirm the program status and disclosure notes in `program-tracker.md`.
3. Confirm the program is `approved` or explicitly documented as `otherwise eligible`, with terms URL and disclosure requirements recorded, before any live link.
4. Convert the product into app data only if app work is in scope for the current task.
5. Keep prices, ratings, copied reviews, and retailer images out unless the program terms explicitly allow the exact use.
6. Record future product/company problems in `weekly-log.md` and pause the pick when appropriate.
