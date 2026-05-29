# Monetization Concepts

Intent update: 2026-05-29

Buy/sell and customer-to-customer trading are out of the first customer-side version. The first version is a secured free customer discovery hub that drives traffic to Sparkle Suite reps.

## Current V1 Monetization Direction

V1 stays free for customers and monetizes lightly:

- careful Google AdSense placements
- affiliate links for jewelry collector products
- affiliate links for live-streaming gear and tools reps may want
- possible Sparkle Suite branded products later
- optional Silver Membership if customer-facing Nic-Nac search assist is included or staged soon after launch

V1 should not include:

- annual memberships
- customer-to-customer trade fees
- buy/sell marketplace fees
- sponsored rep placement
- future rep signup sales from the hub

## 1. Rep Subscription Value Expansion

Fold customer-side access into the rep subscription as a value multiplier.

How it works:

- reps pay for Sparkle Suite
- customer profiles, wishlists, and matching drive leads back to reps
- reps can see aggregated demand signals, such as pieces customers are hunting for

Why it fits:

- preserves rep-first business model
- avoids charging collectors too early
- strengthens rep retention

Watch-outs:

- customer side needs clear value to reps, not just customer entertainment

## 2. Silver Membership

Decision update as of 2026-05-29: rename `Plus` to `Silver Membership`.

Silver is the first paid customer membership tier. Future tiers may use `Gold` and `Diamond`, but those are not part of v1.

Silver should be monthly only:

- cancel any time
- membership remains active until the end of the paid month
- no annual billing
- no yearly refund complexity

Pricing leaning:

- keep it under $5/month if possible
- recommended candidate: `$4.99/month`
- positioning: less than a cup of coffee per month

Sparkle Suite rep perk:

- paid Sparkle Suite reps receive free Silver access while their rep account is paid and active
- this gives reps a reason to use the customer hub and understand what customers experience

Possible Silver features:

- Nic-Nac Collector Assist
- `Nic-Nac, find this for me` button on jewelry detail pages
- guided search across rep trade boards / dance floors
- exact matches first, close matches second
- rep and next-show context returned from the search
- saved searches/watchlist
- email alerts when watched pieces appear
- saved reps/shows
- future richer profile features if customer profiles return

Why it fits:

- monetizes power collectors without blocking casual users
- does not require payment processing between customers
- monetizes convenience and speed rather than gating the hub itself
- keeps normal browsing/search useful for Free users
- creates a low-friction paid product around Nic-Nac's strongest customer value

Watch-outs:

- avoid making core trust/safety features premium-only
- avoid unlimited AI wording
- bound usage internally so AI cost stays predictable
- make cancellation/end-of-month access terms clear

### Free Account

Free accounts should be useful enough to grow the network:

- create a basic customer profile
- browse the master jewelry library
- add existing library pieces to collection
- add existing library pieces to wishlist
- receive limited rep-first matching or browse matches manually
- follow reps or collections, if that becomes part of the model
- browse the master Sparkle Suite rep live calendar
- use normal manual search and filters

Free accounts should not be able to:

- add new jewelry records to the master database
- upload uncataloged piece photos for database inclusion
- use higher-risk trade features unless explicitly allowed later

### Silver Account

Silver accounts become the paid convenience tier:

- includes customer-facing Nic-Nac search assist
- can use `find this for me` from library item pages
- can follow reps and save shows
- can receive alerts when wishlist pieces match a rep board or upcoming show context
- may receive better matching/alerts

### Accepted Product Recommendation

Do not make the master live event calendar fully paid-only. The calendar should help route customer attention back to reps, so hiding it completely would work against the rep-first discovery strategy.

Recommended split:

- Free: browse upcoming Sparkle Suite rep lives, rep boards, and the library manually.
- Silver: use Nic-Nac to hunt faster, save/follow, receive alerts, and connect wishlist/library items to rep board/show context.

Silver should be priced low enough that customers do not overthink it.

## 3. Nic-Nac Matching and Alert Subscription

Charge for high-value discovery rather than trades.

Possible paid features:

- rep-first wishlist match alerts
- instant alert when a wishlist piece appears
- saved searches
- "near-match" alerts
- rep inventory alert when a wanted piece appears on a rep board
- weekly collector digest

Why it fits:

- matching is a natural engine in this product
- rep-first matching sends customer attention back to the active Sparkle Suite rep network
- customers hunting specific pieces may pay for better discovery
- no need to touch trade payments

Watch-outs:

- SMS alerts require consent and messaging cost controls
- email alerts are safer to launch first
- usage should be capped or metered internally

## 4. Rep Lead/Intent Insights

Sell aggregated customer demand intelligence to reps as part of a higher tier or add-on.

Possible insights:

- top wished-for collections
- top wished-for jewelry types
- pieces customers are trying to trade away
- pieces customers want but no rep currently has listed
- collection trends by region/state

Why it fits:

- turns customer behavior into rep business intelligence
- helps reps decide what inventory to reveal, hold, or source

Watch-outs:

- privacy rules need to be clear; use aggregate insights by default

## 5. Affiliate Revenue

Offer optional links for collection photography gear, collector supplies, and live-streaming gear/tools.

Possible affiliate categories:

- light boxes
- phone tripods
- jewelry display stands
- label printers
- shipping supplies
- storage organizers
- phone tripods
- lights
- microphones
- webcams/cameras
- streaming accessories
- rep shipping/labeling tools

Why it fits:

- aligns with the photo-quality workflow
- low operational burden
- helps customers improve listings without Sparkle Suite shipping gear
- gives reps useful gear paths if they use the customer hub too
- every incremental affiliate path helps without making Sparkle Suite a marketplace

Watch-outs:

- keep affiliate recommendations honest and optional
- disclose affiliate relationships

## 6. Parked Trade Safety Silver

Keep basic trading free, but offer optional paid trust/safety upgrades later.

Possible paid add-ons:

- enhanced identity verification
- premium trade badge
- printable trade checklist
- shipping workflow helpers
- insurance/tracking reminders
- higher visibility for verified trade listings

Why it fits:

- monetizes safety without forcing every casual collector into a heavy process

Watch-outs:

- do not create a false guarantee if Sparkle Suite is not mediating or insuring trades

## 7. Sponsored Rep Discovery

Let reps pay for better placement when customers are searching the master library or looking for pieces.

Possible placements:

- "Reps with active boards"
- "Featured Sparkle Suite reps"
- "Rep has similar pieces"
- "Follow this rep for this collection"

Why it fits:

- customer-side browsing can route attention back to rep businesses
- does not require customer buy/sell payments

Watch-outs:

- sponsored placement must be labeled
- relevance should still matter so search quality does not degrade

## 8. Future Marketplace Fee

Do not start here. If buy/sell ever becomes part of the product, marketplace fees are possible, but they bring heavier payment, tax, dispute, and seller verification obligations.

Why it is deferred:

- first version intentionally excludes buying and selling
- marketplaces can trigger seller onboarding, risk monitoring, disputes, and tax reporting work
- trust must exist before money enters the system

Research note:

- Stripe Connect can support marketplace-style payments, payouts, onboarding, platform fees, and tax/reporting support, but using it would move Sparkle Suite into a more complex marketplace operating model.
