# Open Questions

Initial pull date: 2026-05-28

## Product Scope

- What exact v1 feature slice ships first inside the secured discovery hub?
- Should customers log in through Sparkle Suite directly, through their rep's site, or both?
- What URL/domain should `Sparkle Finder by Sparkle Suite` use?
- Is this for all Bomb Party customers, only customers attached to Sparkle Suite reps, or invite-only early communities?
- Should Silver Membership launch in v1 or shortly after the free discovery hub?
- What exact customer information does Silver require for customer profile and collection features?

## Identity and Trust

- What does a customer profile require at launch: name, email, phone, handle, location, preferred rep?
- Do customers need verified phone/email before using profile or collection features?
- What report/ban process is needed for bad actors even while trading and posting are parked?
- Should reputation be global, rep-scoped, transaction-scoped, or all three?
- What happens when a user is reported by multiple customers or reps?

## Jewelry Data

- Can Silver customers map owned pieces to existing `jewelry_designs` records?
- If a customer owns an uncataloged piece, who can create the canonical catalog record?
- Should customer-uploaded photos be eligible to upgrade a canonical design photo?
- Does item-number exact matching remain enough once customers participate?
- How do we prevent duplicate, inaccurate, or malicious catalog entries?
- Should only Silver accounts be able to submit uncataloged pieces through Nic-Nac?
- What review process approves a Silver-submitted piece before it becomes part of the master jewelry library?

## Trading

Customer-to-customer trading is parked for v1. These questions are for a later revisit:

- Are customer-to-customer trades item-for-item only at first?
- Do the current same-collection and same-jewelry-type rules apply to customer-to-customer trades?
- How does each side prove shipment?
- Does Sparkle Suite stay out of shipping entirely, or provide label/tracking helpers?
- Does Sparkle Suite mediate disputes, or only provide reporting/audit trails?
- When is a trade considered complete?
- What cancellation windows are allowed?

## Buy/Sell and Money

Buy/sell is parked for v1. These questions are for a later revisit:

- Should customer buy/sell exist at all in the first version?
- If buy/sell exists, is it inquiry-only with payment handled off-platform?
- If money ever flows through Sparkle Suite, what provider, fee model, reporting, tax, and dispute obligations apply?
- Are Sparkle Suite Credits still a candidate idea or too much complexity/liability?
- How would rep revenue share work without making reps responsible for customer disputes?

## Reps and Revenue

- How do reps benefit from customer-side activity?
- Do reps get leads when customers want a piece a rep has listed?
- Can reps browse customer wanted lists to source inventory?
- Do reps moderate communities tied to their customers or teams?
- Silver trial notification scaffold: account email is the first alert channel for 7-day, 3-day, 1-day, day-of-expiration, and downgrade-confirmation notices. No launch SMS trial alerts; SMS waits for explicit consent, provider selection, compliance review, and messaging cost controls.
- Does the customer platform increase the value of rep subscription, create a separate customer revenue stream, or both?
- What exact master live calendar features belong to Free browsing versus Silver follow/save/alert behavior?

## Community and Moderation

Message boards and social posting are parked for v1. These questions are for a later revisit:

- What post types are allowed?
- Are comments enabled at launch?
- Who reviews reports?
- What content is prohibited?
- Do customers get blocked/muted controls?
- Are public collection posts indexed for SEO/GEO, or kept behind login?

## Legal, Compliance, and Brand

- What disclaimers are needed to avoid implying Bomb Party affiliation?
- What customer data retention policy applies to social profiles, trade history, reports, and deleted accounts?
- Does customer-side messaging require new SMS/email consent flows separate from rep-site audience consent?
- Trial expiration alerts should launch by account email first; SMS alerts should remain off until explicit customer consent, cost controls, and final compliance copy exist.
- What privacy controls are required for collection visibility and location/shipping data?
- What consumer protection obligations are triggered by inquiry-only trade facilitation vs processed transactions?
