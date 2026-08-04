# Customer List and Contact Preferences Design

**Status:** Proposed — ready for implementation approval  
**Date:** August 4, 2026  
**Scope:** Rep-scoped contact management, customer-site alert signup and preferences, and Nic-Nac contact actions. This release does **not** send email or SMS from Sparkle Suite.

## Decision summary

Sparkle Suite will add a **Customer List**: a rep-owned, searchable contact
table available from Tools, with a compact workspace shortcut considered after
the Tools experience is settled. It is the single source of truth for customer
contact details, preferences, alert consents, and contact history for one
rep/workspace.

Contacts can enter the list through:

1. A customer-facing email-alert or SMS-alert form.
2. Direct editing by the authorized rep in Customer List.
3. Nic-Nac, using application-owned contact tools.

The list supports safe CSV export so a rep can use their own email or phone
provider until Sparkle Suite's native sending capability exists.

## Customer experience

### Customer List workspace tool

The Tools menu gets a **Customer List** entry. The first release includes a
table, responsive record drawer, search, sort, filters, and a CSV export of
the visible/selected contacts.

Columns:

- Name
- Email
- Mobile phone
- Email-alert status
- SMS-alert status
- Birthday (month and day; year is not collected by default)
- Favorite gem or stone
- Favorite material
- Favorite cut
- Address summary
- Tags
- Last updated

Each record includes optional editable profile fields: full address, birthday,
favorite gem/stone, favorite material (for example gold or silver), favorite
cut, favorite collection, tags, and private rep notes. Empty values are normal;
the system must never portray optional enrichment as incomplete setup.

The address and birthday remain optional. To minimize signup friction, address
is available for customer self-entry in the preferences form but is not a
featured requirement of an alert-signup flow.

### Customer-facing signup and preferences

Customer sites offer separate email-alert and SMS-alert signup paths. A person
may sign up for either, both, or neither. No preference field is required.

After the selected contact channel and its explicit consent are provided, the
form offers an optional **Tell us what you love** area:

- Birthday (month and day), with nearby plain-language copy: "Optional — we
  only use this for birthday promotions and gift ideas."
- Favorite gem or stone
- Favorite material
- Favorite cut
- Favorite collection
- Address, if the customer chooses to share it

The optional area can be collapsed on smaller screens. Skipping every field
must be a successful, first-class path. The customer-facing implementation
should use the rep's customer-site skin and avoid hiding the consent copy.

The exact email/SMS consent language, opt-out language, retention policy, and
any required jurisdiction-specific behavior require final product/legal review
before release. This plan intentionally treats consent evidence as required
application data, not as editable profile text.

## Data and privacy design

Create rep-scoped durable records rather than a spreadsheet-shaped blob:

- `customer_contacts`: rep/workspace identity; canonical name, normalized
  email and phone, optional profile and preference fields, tags, notes, source,
  and timestamps.
- `customer_contact_consents`: one immutable/evolving consent record per
  channel and event, including channel, status, source, policy/copy version,
  capture time, and opt-out/revocation events.
- `customer_contact_audit_events`: append-only audit record of profile edits,
  merges, exports, Nic-Nac tool attempts/results, and the actor/source.

Normalize email and phone before matching. Deduplicate only inside the owning
rep/workspace; no contact, consent, search result, or export may cross rep
boundaries. A contact can have an email consent without SMS consent, or the
reverse.

Profile fields are editable by the rep. Consent status is derived from its
history and cannot be changed by an ordinary cell edit or a Nic-Nac assertion.
If a future rep-assisted consent workflow is added, it must capture the
approved evidence and make its source clear.

CSV export is an audited action. Exports can be filtered by channel eligibility
(such as active email subscribers, active SMS subscribers, or birthdays this
month), but an export never itself sends a message.

## Nic-Nac contact capability

Nic-Nac gains a new application-owned workflow family, `customer_contact`,
with explicit allowed tools such as:

- `search_customer_contacts`
- `create_customer_contact`
- `prepare_customer_contact_update`
- `apply_customer_contact_update`
- `list_customer_contacts`

Application code owns identity matching, rep scope, writable fields, consent
invariants, confirmation state, mutation, audit logging, and database
verification. Nic-Nac owns natural-language extraction, a friendly summary,
and the next question. This follows the established stateful-agent architecture
rather than adding a prompt-only shortcut.

Examples:

- "Add Sarah Johnson; her number is … and she loves silver."
- "Amanda's birthday is October 12."
- "Show me customers who like opal and have birthdays this month."

For a new contact, Nic-Nac collects only the details the rep actually knows.
For an update, it searches first. It asks the rep to choose when identity is
ambiguous, and gives a concise confirmation before creating, merging, or
overwriting a non-empty phone number, email, address, birthday, or preference.
Simple additions to a clearly identified contact may use a reviewable
one-turn confirmation pattern. Nic-Nac must never claim success before a tool
result and database verification.

Nic-Nac cannot create or alter an email/SMS opt-in merely because a rep says a
contact wants alerts. It may explain the correct customer self-signup path and
record non-consent profile data. A later consent-capture workflow, if approved,
must generate a durable, auditable consent event.

## Implementation sequence

1. **Discovery and contract design**
   - Inventory current customer-site email/SMS signup endpoints, profile data,
     rep identity conventions, RLS policies, and any existing unsubscribe
     behavior.
   - Produce final field dictionary, consent-copy/versioning contract, and
     retention/export policy for approval before migration.

2. **Database and access layer**
   - Add the three rep-scoped tables, normalized unique-match indexes, RLS,
     audit triggers/helpers, and migration tests.
   - Backfill existing alert signups only after mapping their available consent
     evidence; do not manufacture enrichment or consent facts.

3. **Customer-site intake**
   - Implement accessible email/SMS signup and optional preferences.
   - Record consent events atomically with the contact upsert.
   - Support safe duplicate matching without overwriting a customer's existing
     optional preferences silently.

4. **Customer List tool**
   - Build the Tools entry, table, filters, record drawer/editor, and audited
     CSV export.
   - Keep the first release customer-management-only: no native campaign or
     phone/email send controls.

5. **Nic-Nac workflow and tools**
   - Add durable `customer_contact` controller state, tool contracts, policy,
     mutation validation, audit events, and observability.
   - Add deterministic controller/tool tests and model-in-loop replays for
     creation, match ambiguity, safe update, overwrite confirmation, and
     forbidden consent changes.

6. **Verification and rollout**
   - Test RLS isolation, consent history, form accessibility, mobile form
     behavior, imports/deduplication, editing, export filtering, and Nic-Nac
     replay/database assertions.
   - Run focused tests and the production build. After release, use the safe
     reviewer path on `https://www.yoursparklesuite.com`; the current
     reviewer-token limitation must be recorded if it still blocks the
     authenticated click-through. Never substitute Louis's personal account.

## Release acceptance criteria

- Reps can find and edit only their own Customer List records.
- Customer site forms create/update the correct rep-scoped contact and capture
  selected-channel consent separately.
- Every enrichment field is optional, including birthday and the four stated
  preferences; birthday purpose copy is visible.
- CSV exports accurately honor filters and are audited.
- Nic-Nac can create and update contacts with database-verified results, asks
  for disambiguation/confirmation when needed, and cannot fabricate or modify
  channel consent.
- No email or SMS is sent by this feature.
- The deployed `www` and apex production domains resolve to the exact verified
  branch-tip deployment, and the relevant live path is smoke-tested using safe
  reviewer data when configuration permits.

## Decisions needed before implementation

1. Confirm **Customer List** as the product label (recommended) versus
   `Client List`.
2. Approve the final channel-consent and privacy copy after appropriate review.
3. Decide whether optional address entry belongs in the initial public form or
   only in the profile/preferences path; the data model supports both.
4. Confirm whether the optional customer-facing preferences form should be a
   separate, reusable profile-update link after initial signup.
