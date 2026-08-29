---
name: sparkle-suite-rep-welcome-site
description: Create or update a personalized Sparkle Suite welcome and starter-guide site for a rep. Use for first-time rep onboarding pages, including verified pricing, Live Queue guidance, help, and product-roadmap status.
---

# Sparkle Suite Rep Welcome Site

Create a warm, practical welcome site that helps a new rep get oriented. It is an onboarding guide, not a generic sales page or a replacement for the authenticated Sparkle Suite Workspace.

## Before drafting

1. Read the Sparkle Suite master-brand skill and its required brand sources.
2. Inspect the current Workspace labels and `comingSoon` state in the application source. Treat source-visible status as authoritative. A user may explicitly ask to label an additional surface as coming soon; note that choice in the page copy rather than claiming a launch date.
3. Verify each price from the active pricing source before publishing. Always show the specific post-promotion monthly amount; never use “then-current rate” when the amount is known.
4. For any light-box copy, check only whether a fulfillment address/task exists. Do not place an address, password, Live Queue code, email address, auth link, or payment data on the public page.

## Content contract

Use `assets/rep-welcome-site-template.md` as the reusable page blueprint. Keep these sections unless the rep’s actual access makes one inaccurate:

- a welcoming, encouraging hero and scheduled onboarding note;
- a practical first-week checklist;
- concise explanations of customer site, Live Queue, Dance Floor, calendar, Email updates, SMS updates, Nic-Nac, and Help & Resources;
- a Nic-Nac starter-prompt panel that treats Nic-Nac as useful rep support, not the whole product;
- Live Queue instructions that never reveal the sync code;
- a clearly labeled Coming soon section for verified deferred surfaces;
- light-box fulfillment wording that asks for a shipping address only when one is not already collected;
- transparent pricing: introductory price and duration plus the exact amount beginning after the promotion.

## Personalization

Replace only the tokens identified in the template: rep name, schedule, promotion, standard price, shipping-address state, and explicitly approved roadmap items. Do not infer a business name, team affiliation, customer details, shipping address, private URL, or product entitlement.

If a user asks for a different public URL, use a new Sites project. Otherwise update the existing rep’s Sites project in place. Keep this separate from the Sparkle Suite application and do not deploy the main product merely to change a welcome site.

## Publication safety

- Public deployment requires the user to have asked to publish or update the public welcome page.
- Build the site, validate desktop and mobile rendering, check console errors, and exercise at least one page-navigation link.
- Use the Sites source/version/deployment flow. Push the exact source before saving a version.
- Do not send the welcome email, create a checkout, collect the address, or install/configure the Live Queue extension as part of a page update.

## Template maintenance

When a welcome-site improvement is broadly useful, update the template alongside the current rep page. Keep the template factual and tokenized; do not copy a real rep’s private data or credentials into it.
