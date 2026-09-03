# Rep onboarding package reference

Use this reference only when a request includes more than the public starter guide. It is a component checklist, not permission to perform every item.

## Minimal intake and discovery

| Need | Verify before use | If missing |
| --- | --- | --- |
| Identity | One exact lead or account | Ask Louis to resolve the match. |
| Public guide | First name, confirmed schedule, approved public details | Omit unknown details. |
| Pricing | Active pricing source plus any approved offer | Do not publish a price. |
| Account prep | Explicit request, confirmed account state, and customer/demo classification | Do not create a duplicate or leave classification implicit. |
| Welcome email | Verified mailbox, recipient, approved scope | Prepare no draft until confirmed. |
| Live Queue | Canonical Store listing; private code only if account flow provides one | Leave code instructions out until ready. |
| Light box | Fulfillment status, not the raw address | Ask for address confirmation in private. |

## Suggested package order

1. Read-only discovery: verify identity, waitlist/intake details, existing account, feature readiness, price, and fulfillment status.
2. Prepare the requested account shell and non-sensitive settings using only confirmed intake values. Persist real onboarding as `customer`, reserve `demo` for deliberate reviewer/test accounts, and verify the resulting Control Center database placement. For a live walkthrough, also verify the intended Workspace subscription/trial row, Sparkle Suite public-site slug, site settings, and reachable Home, Dance Floor, and Join routes; `dashboard_unlocked` alone is not readiness evidence.
3. Create or update the public guide from the tokenized template. Keep it educational: welcome, overview, self-paced checklist, tools, Nic-Nac, help, Live Queue, Coming soon, fulfillment, and transparent pricing.
4. Build and publish the guide only after explicit authorization; validate the actual public URL.
5. Prepare the unsent welcome-email draft. Include the guide link high in the message, sign-in instructions, and the official Live Queue Store link if relevant. Add private credentials, payment links, or meeting links only with their specific approval.
6. Publish a credential-free Message Center welcome only after exact-recipient preview and final approval.
7. Verify each external result and report what remains intentionally unsent, unconfigured, or dependent on Louis/rep action.

## Account classification gate

- A newly approved real rep is a `customer` from account creation onward; setup progress, subscription state, and public-site readiness do not change that classification.
- Demo, reviewer, smoke, and sample accounts must opt into `demo` explicitly.
- Before closeout, read the durable classification and confirm a real rep appears under **Customer Database**, not **Demo Database**.

## Operator launch ledger

This is internal operational continuity, not the rep's self-serve checklist and
not evidence that the rep has made an attestation. When the Control Center
implements it, show it as a nested, collapsible section in the expanded
Customer Database profile. Persist status and safe evidence per step so a later
operator can resume without reverse-engineering a session.

| Check | Required evidence | Optional/blocked handling |
| --- | --- | --- |
| Identity and placement | Exact rep resolved; `customer` classification; Customer Database placement | Stop on ambiguous identity. |
| Workspace access | Intended trial/entitlement plus no unintended checkout path | Never create Stripe objects as a workaround. |
| Public-site foundation | Slug, Site Settings, business basics, and customer social handles present | Leave unknown rep details blank and name the gap. |
| Public-route proof | Live Home, Dance Floor, and Join each resolve to the rep’s own copy | Check direct routes too; hidden navigation does not excuse stale demo content. |
| Show and Live Queue readiness | Configured platform social links, Calendar behavior, and Live Queue setup or handoff | Mark `waiting_on_rep` or `blocked` rather than inferring completion. |
| Communication | Welcome draft/sent state with its separate authorization | A draft is not a sent message. |
| Optional custom domain | Registrar authority, Vercel attachment, minimal DNS change, identity-guarded mapping, live root/Trade/Join, favicon, and social card | Use `not_applicable` unless requested; never change unrelated DNS, aliases, forwarding, contacts, or billing. |
| Closeout | Live URLs, evidence summary, and remaining owner/rep action | Keep credentials and raw private data out of the ledger. |

Suggested statuses are `not_started`, `in_progress`, `waiting_on_rep`,
`blocked`, `complete`, and `not_applicable`. A timestamp and short safe evidence
summary belong to every changed item. The legacy `onboarding_status` and a
dashboard-unlocked flag must not be repurposed as the launch ledger.

## Starter-guide content map

- **Welcome and meeting:** a precise date/time with time-zone abbreviation; meeting link only when explicitly approved.
- **First-week checklist:** Workspace, customer-site customization, Live Queue self-setup, live calendar, and Dance Floor. Local checkbox state is a guide only.
- **Tools:** customer-facing site, Live Queue, Dance Floor, live event calendar, Nic-Nac, and Help & Resources. Keep each claim factual and distinct.
- **Coming soon:** move features that are not ready, including Email updates and SMS updates when applicable, into clearly labeled cards.
- **Light box:** encourage confirmation of the best shipping address without disclosing it.
- **Pricing:** exact promo amount and number of months, then exact monthly amount after the promotion.

## Communication patterns

### Draft email

Start with the public guide invitation: it is optional reading before the meeting. Then cover where to sign in, the rep’s username, any approved temporary password, the approved meeting link, the official Live Queue Store listing and any separately approved private code, pricing, and what is coming soon. Keep every public destination as an HTML hyperlink.

### Message Center welcome

Use a short title such as `Welcome to Sparkle Suite, {{REP_FIRST_NAME}}` and a credential-free body: welcome the rep, say their starter guide is ready whenever they want to read it, reassure them nothing needs to be finished before the meeting, and offer help. Add the public guide as the action link.

## Never bundle without separate approval

- sending the Gmail draft;
- publishing the Message Center message;
- putting a meeting link on the public guide;
- transmitting a password, Live Queue code, address, payment link, or other sensitive value;
- creating a checkout, charge, subscription, or Stripe product;
- changing DNS, production configuration, or the Live Queue extension;
- enabling a roadmap/coming-soon feature.
