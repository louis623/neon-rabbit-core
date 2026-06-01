# Silver Membership And Rep Identity Decision

Created: 2026-05-31

## Decision

Sparkle Finder should use one account per person. New users start with Silver access by default for a 45-day trial. If they do not upgrade by the end of the trial, their account downgrades to Free access.

Silver Membership remains the paid customer membership tier:

- working price: `$4.99/month`
- monthly only
- cancel any time
- no annual plan
- trial length: 45 days
- trial begins when the user creates the account
- trial should be visible in the account experience
- pre-downgrade notifications should be sent before trial expiration

## Access States

Use entitlement/access states rather than separate account types:

- `silver_trial`: new account during the 45-day trial
- `silver_paid`: active paid Silver subscription
- `silver_rep_included`: active Sparkle Suite rep with included Silver access
- `free`: account without active Silver access

The application should ask whether the account currently has Silver access, regardless of why that access exists.

## Phone Privacy And Consent

Phone numbers may be collected for account identity, recovery, verification, trial abuse prevention, and security notices.

Phone numbers must not be treated as permission to send marketing texts. Marketing SMS consent must be a separate, optional, affirmative opt-in. Promotional email consent should also be separate and optional.

Signup and account settings should distinguish these consent states:

- account/security email: required when needed to operate the account
- account/security SMS: allowed only for verification, recovery, fraud prevention, or security notices
- promotional email: optional opt-in
- promotional SMS: optional opt-in, off by default

Sparkle Finder should not sell customer personal information. Public/privacy copy should say plainly that phone numbers are used for account identity, recovery, fraud prevention, and optional alerts, not sold to third parties.

Keep phone-number handling lean:

- collect only what the account model needs
- show why the phone number is requested near the field
- store verification and consent timestamps
- allow users to update their phone number
- avoid SMS alerts until email alerts and consent flows are proven
- keep a data-retention/deletion plan for closed accounts

Reference guidance:

- FTC guidance emphasizes collecting only needed personal information, keeping it only while needed, protecting it, and disposing of it safely.
- FCC/TCPA rules make marketing texts consent-sensitive, so account verification/recovery consent and promotional SMS consent should remain separate.

## Sparkle Suite Rep Access

Active Sparkle Suite reps receive Silver access without paying the customer Silver subscription. This may be implemented as a Silver Membership Billing Credit, comped subscription, or equivalent entitlement.

The billing credit is only for Silver access. It should not be the mechanism that connects rep data to Sparkle Finder.

Rep data should flow from Sparkle Suite into Sparkle Finder automatically:

- rep profile basics
- show schedules
- dance floors / rep trade boards
- relevant business links
- other approved discovery data

Sparkle Suite should be upfront with reps that active rep discovery data may appear on Sparkle Finder so customers can find shows and potential trade-board items.

## Unified Rep And Customer Identity

Do not create separate customer and rep accounts for the same person.

A rep profile should grant everything a normal Silver customer can access, plus visible rep identity. Reps are collectors too; they often buy, collect, trade, and attend other reps' shows. Sparkle Finder should reflect that reality instead of separating "collector" and "rep" into disconnected identities.

The product may visibly identify active reps with a badge, diamond marker, or similar profile treatment.

## Free Downgrade

When a 45-day Silver trial ends without paid or rep-included Silver access, the account becomes Free.

The downgrade should follow the already locked Free-versus-Silver feature split. Free users keep their account, but Silver-only actions become unavailable until they subscribe or qualify through active Sparkle Suite rep access.

## Notes

Customer-to-customer trading and buy/sell marketplace behavior remain parked. Sparkle Finder remains a discovery hub, not a jewelry marketplace.
