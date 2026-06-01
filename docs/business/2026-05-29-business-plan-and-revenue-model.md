# Sparkle Suite Customer Hub Business Plan And Revenue Model

Created: 2026-05-29

## Executive Summary

Sparkle Finder is a secured discovery hub for Bomb Party customers and collectors inside the Sparkle Suite ecosystem. New accounts start with a 45-day Silver trial and then continue as paid Silver or downgrade to Free access. V1 is not a customer-to-customer trading marketplace. Its first job is to drive customer traffic back to Sparkle Suite reps by making rep live schedules, rep trade boards/dance floors, and the master jewelry library easier to discover in one place.

The business model is intentionally light at launch:

- Customer accounts create network value and lead data.
- Silver Membership monetizes Nic-Nac-assisted piece hunting for customers who want faster answers.
- Paid Sparkle Suite reps receive Silver for free as a membership perk through a Silver Membership Billing Credit or equivalent entitlement.
- Affiliate/shop links monetize collector gear and live-streaming gear without turning the hub into a marketplace.
- Careful AdSense placements add background revenue without making the brand feel cheap.

The core strategic value is rep acquisition and retention. Reps should want Sparkle Suite because joining gives them a presence on a shared customer discovery network, not just their own standalone site.

## Product Positioning

### Customer Promise

Find Sparkle Suite reps, live shows, trade boards, and jewelry pieces in one place.

### Rep Promise

Sparkle Suite gives your business another discovery path. Your site, live calendar, and board still belong to you, but the customer hub can send more collectors your way.

### Brand Fit

Use the existing Sparkle Suite brand system:

- warm
- polished
- plain-English
- soft, feminine without being sugary
- premium without fake luxury
- practical support over AI spectacle

Working name and mark:

- `Sparkle Finder by Sparkle Suite`
- `SF` circular seal inspired by the Sparkle Suite `S` seal
- main Sparkle Suite brand system, not the Amethyst skin/template

## V1 Product Scope

### Logged-In Hub

All new customer accounts begin with a 45-day Silver trial. After that trial, customers either continue as paid Silver members, qualify for included Silver through an active Sparkle Suite rep account, or downgrade to Free access.

Free customer account holders can:

- browse Sparkle Suite rep directory
- browse master Sparkle Suite rep live calendar
- browse aggregated rep trade boards/dance floors
- browse the master jewelry library
- use normal manual search and filters
- open rep sites and rep trade boards
- see rep next-show context where available
- browse affiliate/shop recommendations

Public visitors can see the landing/teaser page, but the useful hub areas require login.

### Silver Membership

Silver is the first paid customer membership tier. It replaces the earlier `Plus` language.

Terms:

- monthly only
- no annual plan
- cancel any time
- remains active until the end of the paid month
- target price: under $5/month
- working price: `$4.99/month`
- 45-day trial for new accounts
- paid Sparkle Suite reps receive Silver for free while their rep account is active
- rep-included Silver should be represented as a Silver Membership Billing Credit or equivalent entitlement

Silver features:

- Nic-Nac Collector Assist
- `Nic-Nac, find this for me` button on jewelry detail pages
- customer profile
- customer collection built from master jewelry library records
- collection showcase/highlight areas
- saved collection items and collector notes
- Nic-Nac search across rep boards/dance floors
- exact matches first, close matches second
- matching reps and next-show context
- saved searches/watchlist
- email alerts when watched pieces appear
- saved reps/shows if included in v1
- generous monthly Nic-Nac search access, with internal usage controls

Silver should not be described as unlimited AI access.

Silver access states:

- `silver_trial`: new account during the 45-day trial
- `silver_paid`: active paid Silver subscription
- `silver_rep_included`: active Sparkle Suite rep with included Silver access
- `free`: account without active Silver access

The app should calculate whether a user currently has Silver access from these states instead of treating Free and Silver as separate account systems.

### Sparkle Suite Rep Identity

Sparkle Suite reps should use one account/profile experience, not separate customer and rep accounts. A rep profile gives the rep normal Silver access plus visible rep identity, such as a badge or diamond marker.

Rep data should connect to Sparkle Finder automatically from Sparkle Suite, not through a Silver billing-credit code. The billing credit only handles the rep's included Silver access.

Sparkle Suite should be upfront that active rep discovery data may appear on Sparkle Finder:

- rep profile basics
- show schedules
- dance floors / rep trade boards
- relevant business links

### Phone Privacy And Consent

Customer phone numbers may be used for account identity, recovery, verification, trial abuse prevention, and security notices. They should not be used as implied marketing permission.

Required consent split:

- account/security email: required when needed to operate the account
- account/security SMS: limited to verification, recovery, fraud prevention, and security notices
- promotional email: optional opt-in
- promotional SMS: optional opt-in, off by default

Sparkle Finder should not sell customer personal information. Signup and privacy copy should say plainly why a phone number is requested and how it is used.

Implementation notes:

- store verification timestamps
- store separate promotional email and SMS consent timestamps
- keep SMS alerts out of launch until consent and cost controls are proven
- give users a way to update their phone number and communication preferences
- define retention/deletion rules for closed accounts

Privacy/security sources to keep in view:

- FTC privacy/security guidance: `https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business`
- FTC Start with Security: `https://www.ftc.gov/business-guidance/resources/start-security-guide-business`
- FCC text message/TCPA guidance: `https://docs.fcc.gov/public/attachments/FCC-22-72A1.pdf`

### Parked Features

These are intentionally out of v1:

- customer-to-customer trading
- buy/sell marketplace
- customer message board
- customer-submitted jewelry records
- open-ended Nic-Nac chat
- Gold and Diamond memberships
- sponsored rep placement
- rep signup sales from the hub

## Revenue Streams

### 1. Silver Membership

Primary direct customer revenue.

Model:

```text
paid_silver_members * monthly_price
```

Recommended starting price:

```text
$4.99/month
```

Why this price:

- under the $5 hesitation line
- easy "less than a cup of coffee" positioning
- appropriate for convenience/search assistance
- enough room for payment fees and bounded AI usage

Payment cost estimate at `$4.99`:

```text
Stripe card processing: 2.9% + $0.30
Stripe Billing fee: 0.7%

gross price:                 $4.99
card percent estimate:       $0.14
fixed card fee:              $0.30
Billing fee estimate:        $0.03
estimated net before AI:     $4.51
```

Sources:

- Stripe card pricing: `https://stripe.com/us/pricing`
- Stripe Billing pricing: `https://stripe.com/billing/pricing`

### 2. Affiliate/Shop Revenue

Secondary revenue with low operational burden.

Product categories:

- light boxes
- jewelry organizers
- display stands
- ring trays
- travel cases
- shipping supplies
- phone tripods
- lights
- microphones
- webcams/cameras
- live-streaming accessories
- label printers
- storage systems
- future Sparkle Suite branded products

Why this fits:

- collectors need storage and display gear
- reps need live-streaming gear
- it does not require Sparkle Suite to handle jewelry payments or disputes
- every small affiliate path helps while keeping the core product simple

Rules:

- disclose affiliate relationships
- keep shop optional
- do not make it look like a jewelry marketplace

### 3. AdSense

Small background revenue source.

Use cautiously:

- low density
- avoid cheapening the brand
- avoid ads in high-trust onboarding moments
- prefer lower-page or non-primary utility placements

Google AdSense Help says publishers keep about 68% of revenue for display ads bought through Google Ads on AdSense. Actual earnings depend on traffic, ad demand, geography, placement, and content.

Source:

- Google AdSense revenue share: `https://support.google.com/adsense/answer/180195`

### 4. Rep Acquisition And Retention Value

Indirect but strategically important.

The customer hub should increase Sparkle Suite rep value because paid reps can say:

- my site is included in the customer discovery network
- my live shows appear in the master calendar
- my dance floor / trade board can be discovered through the hub
- customers hunting pieces may get routed toward me
- I get included Silver access as a paid rep

This can support:

- more rep signups
- lower rep churn
- stronger sales pitch
- future higher-tier rep features

Do not model this as direct v1 revenue until there is real rep funnel data.

## Cost Model

### Fixed / Semi-Fixed Costs

Likely cost buckets:

- hosting/deployment
- Supabase/Postgres usage
- file/image storage if screenshots or product photos are surfaced
- analytics
- email provider
- domain and operational tooling

Most of these likely overlap with existing Sparkle Suite infrastructure if the customer hub reads through Sparkle Suite core data.

### Variable Costs

Variable costs:

- Stripe payment fees on Silver subscriptions
- OpenAI/Nic-Nac usage
- email alert sends
- SMS only if added later with explicit consent
- image/search processing only if added later

Nic-Nac usage should stay tool-driven and bounded. OpenAI's public API pricing page lists `gpt-5-mini` at `$0.25 / 1M input tokens` and `$2.00 / 1M output tokens` as of this plan date, but production should treat model prices as configurable because API pricing changes.

Source:

- OpenAI API pricing: `https://openai.com/api/pricing`

### Silver Unit Economics

Working unit model:

```text
silver_price = $4.99
estimated_payment_fees = $0.48
estimated_net_before_ai = $4.51
target_average_ai_budget = $0.50 or less per paid Silver member/month
target_contribution_after_ai = about $4.01 per paid Silver member/month
```

Guardrails:

- cap monthly Nic-Nac searches internally
- use cached/search-indexed data where possible
- use smaller models for routine search and summarization
- use email alerts before SMS
- do not offer unlimited wording

## Scenario Revenue Model

These scenarios are planning estimates, not forecasts.

Assumptions:

- Silver price: `$4.99/month`
- estimated net before AI per paid Silver member: `$4.51`
- target AI budget: `$0.50/member/month`
- estimated Silver contribution after payment fees and AI: `$4.01/member/month`
- AdSense revenue shown as pageviews * estimated RPM / 1000
- affiliate revenue shown as estimated monthly net commission

| Scenario | Free Accounts | Paid Silver | Silver Contribution | Pageviews | Ad RPM | AdSense | Affiliate | Est. Monthly Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| Pilot | 250 | 25 | $100 | 10,000 | $1.50 | $15 | $50 | $165 |
| Early | 1,000 | 100 | $401 | 40,000 | $2.00 | $80 | $150 | $631 |
| Growth | 5,000 | 500 | $2,005 | 250,000 | $2.50 | $625 | $750 | $3,380 |
| Upside | 10,000 | 1,500 | $6,015 | 700,000 | $3.00 | $2,100 | $2,000 | $10,115 |

## Conversion Targets

### Customer Account Conversion

Primary conversion:

```text
public visitor -> 45-day Silver trial account
```

Early target:

- 10-25% of interested visitors create an account if the landing page clearly explains that calendars/boards/library require login and the first 45 days include Silver access.

### Silver Conversion

Primary conversion:

```text
silver trial customer -> paid Silver member
```

Early target:

- 5-10% of active trial customers convert to paid Silver if `Nic-Nac, find this for me` is visible at high-intent moments and the trial value is clear before downgrade.

High-intent moments:

- jewelry detail page
- no obvious manual match found
- master jewelry library filtered to diamond/unicorn labels
- rep board item detail
- creating or expanding a personal collection
- after repeated searches

### Rep Value Conversion

Primary conversion:

```text
rep prospect -> paid Sparkle Suite rep
```

Hub-driven proof points to track:

- hub clicks to rep sites
- hub clicks to rep trade boards
- hub calendar clicks
- top searched collections/pieces
- Silver searches routed to reps
- customer account growth

## Go-To-Market

### Customer Launch Angle

Suggested plain-English message:

```text
One login for Sparkle Suite live shows, rep boards, and jewelry discovery.
```

Support copy:

```text
Browse Sparkle Suite reps, see who's going live, explore rep boards, and use the jewelry library to find pieces you love.
```

Silver copy:

```text
Browse for free. Let Nic-Nac hunt for you with Silver.
```

### Rep Launch Angle

Suggested message:

```text
Sparkle Suite helps customers find your shows and boards through the shared customer hub.
```

Support copy:

```text
Your site stays yours. The customer hub gives collectors another path to discover your lives, your board, and your Sparkle Suite presence.
```

## Risks And Mitigations

### Risk: Ads Cheapen The Brand

Mitigation:

- keep AdSense low-density
- do not put ads in hero/onboarding/account trust areas
- review ad categories and placement

### Risk: Nic-Nac Costs Run High

Mitigation:

- monthly internal caps
- tool-driven search
- cached results
- no unlimited wording
- monitor cost per paid member

### Risk: Customers Expect Trading

Mitigation:

- v1 copy should avoid customer-to-customer trade promises
- focus on rep boards/dance floors and jewelry discovery
- keep trading in roadmap language only if needed

### Risk: Reps Feel The Hub Competes With Their Sites

Mitigation:

- every rep card links back to the rep's Sparkle Suite site
- every board item points back to rep-owned board flow
- frame hub as discovery, not replacement

### Risk: Bomb Party Affiliation Confusion

Mitigation:

- use plain unaffiliated language
- do not use Bomb Party logos/trade dress
- use BP product labels only as descriptive third-party data where appropriate

## Metrics To Track

Customer metrics:

- public visitor to free signup conversion
- active logged-in customers
- rep calendar views
- rep board views
- library searches
- master jewelry library diamond/unicorn filter views
- affiliate clicks
- Silver profile creations
- Silver collection items saved
- Silver trial starts
- 45-day trial to paid Silver conversions
- trial expirations to Free downgrade
- Silver paid conversions
- Nic-Nac searches per Silver member
- cost per Nic-Nac search

Rep value metrics:

- clicks to rep sites
- clicks to rep trade boards
- clicks to next-show links
- reps receiving traffic from hub
- top searched pieces not currently listed
- top rep boards by customer view

Business metrics:

- Silver monthly recurring revenue
- Silver churn
- Silver gross margin after payment and AI costs
- AdSense monthly revenue
- affiliate monthly revenue
- hub-assisted rep signup attribution when available

## Recommendation

Launch the business model in this order:

1. Secured discovery hub with new accounts starting in a 45-day Silver trial.
2. Rep calendar, rep directory, rep board aggregation, and master jewelry library.
3. Affiliate/shop layer with collector and live-streaming gear.
4. Silver Membership at `$4.99/month`, monthly only, with the 45-day trial and downgrade path.
5. Included Silver access for paid Sparkle Suite reps through a Silver Membership Billing Credit or equivalent entitlement.
7. Add more tiers only after there is clear usage data.

Do not launch customer-to-customer trading, buy/sell, Gold, Diamond, or sponsored rep placements until the discovery hub has real usage data.
