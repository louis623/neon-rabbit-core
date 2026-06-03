# Sparkle Suite Required Nic-Nac Setup Design

Date: 2026-06-02

## Purpose

This note captures Louis's current V1 direction for Sparkle Suite post-payment onboarding. It supersedes the idea that a newly signed-up rep should land in a normal setup checklist dashboard.

The core problem: the current first-run workspace is confusing. A new rep sees a dashboard, sidebar sections, checkout language, setup steps, account billing, help resources, and Nic-Nac all at once. That does not feel like an easy self-serve path, and it does not match Sparkle Suite's promise of a polished customer experience.

The new direction: after checkout, a rep should land in a simple required Nic-Nac setup flow. Nic-Nac should guide them through the essentials in conversation, save progress as they go, teach them how Sparkle Suite works, and unlock the full dashboard only after the customer site is polished enough to represent Sparkle Suite well.

## Product Principle

Sparkle Suite should protect the brand even when a rep is busy, uncertain, or tempted to skip setup. The first-run experience should not rely on the rep understanding dashboards, settings pages, or internal feature names.

Nic-Nac is the easy button:

- Ask one thing at a time.
- Offer choices when helpful.
- Let the rep free-talk when writing is hard.
- Turn rough answers into polished public-site copy.
- Save progress continuously.
- Teach Sparkle Suite features in the same conversational pattern they will use after setup.

The full dashboard is not the starting point. The full dashboard is unlocked after required setup.

## Approved V1 Flow

1. Tiny account creation.
2. Stripe checkout.
3. Required Nic-Nac setup.
4. Full dashboard unlock.

Tiny account creation should happen before checkout so the checkout/setup session can be recovered. This also gives the rep a login identity before payment and supports abandoned checkout recovery.

Stripe checkout should happen before the required setup experience. Once the rep has paid, Sparkle Suite should guide them carefully through setup rather than asking them to complete a long pre-payment form.

The previous long signup/intake-style form should not be the main self-serve path. Most setup details can be collected after payment by Nic-Nac.

## Authentication Direction

Google sign-in should be supported and preferred when practical. It makes Sparkle Suite feel more familiar and legitimate, reduces password friction, and makes setup resumption easier.

Email/password should remain available as a fallback.

Returning reps should sign in and automatically return to the required Nic-Nac setup flow if setup is not complete.

## Required Setup Experience

After successful checkout, the rep lands in a simple setup home. The primary experience is a Nic-Nac chat conversation, not a dashboard or card grid.

Nic-Nac should open with a clear message such as:

> Welcome to Sparkle Suite. Before I open the full dashboard, I am going to help finish the essentials so your customer site looks polished from day one. I will save your progress as we go.

The setup should feel like the way reps will work with Nic-Nac after setup. Do not create a separate wizard pattern that teaches a different interaction model.

## Minimum Unlock Standard

The full dashboard unlocks when Nic-Nac determines the customer site is good-looking and launchable enough for Sparkle Suite standards.

The goal is not to force perfection. The goal is to prevent a dirty, incomplete, or confusing customer site from going live and reflecting poorly on the rep or Sparkle Suite.

Required essentials:

- Business/display name.
- Shop link.
- Primary live/social link.
- Site look or skin choice.
- Customer-facing welcome line or tagline.
- About page direction, even if the final page remains editable later.
- Basic show schedule answer, including an acceptable "I do not have a regular schedule yet" option.
- Customer site orientation.
- Live Queue orientation.
- Trade Board orientation.
- Final preview approval.

Nic-Nac can generate polished defaults or options when the rep does not know what to write. For example, the rep can free-talk about themselves and their business, then Nic-Nac can turn that into several About page narrative options for the rep to choose from.

## About Page Handling

The About page should not become a blocker because the rep cannot write polished copy from scratch.

Nic-Nac should support an easy conversation:

1. Ask the rep a few plain-English questions about their business, style, customers, and story.
2. Let the rep answer casually.
3. Generate two or three polished About page options.
4. Let the rep choose one, revise one, or keep it as a temporary polished default.

An About page may be marked as "to be refined later" only if Nic-Nac has created a respectable placeholder that still feels intentional and brand-safe.

## Trade Board Handling

First-run setup should not require the rep to populate the Trade Board.

Nic-Nac should teach the rep what the Trade Board is and how customers will use it. He should explain that, when the rep is ready to add trade items or dancers, they can come back and ask Nic-Nac for help.

Trade Board education should include:

- If an item already exists in the master jewelry library, the rep may be able to add it from there.
- If the item is not already in the library, the rep will need good photos.
- The light box is provided so reps can take clean, consistent jewelry photos.
- Once the light box arrives, the rep can return to Nic-Nac and say something like, "Help me add trade items."

## Light Box Fulfillment

Sparkle Suite needs to send a light box to each rep after they make the first payment. Louis already knows the item he wants to send and plans to create an Amazon Prime account for the business to order the boxes.

V1 fulfillment process:

1. Stripe checkout collects or confirms the shipping address.
2. After first payment succeeds, Sparkle Suite creates an internal fulfillment task: `Order light box`.
3. The target is to order the light box within 24 hours of account start/payment.
4. Louis is notified promptly so he can order the light box through Amazon.
5. The rep is told the light box will be ordered through Amazon Prime and should arrive fairly quickly, but Sparkle Suite cannot guarantee the exact Amazon delivery date.

The rep should not be blocked from completing core setup while waiting for the light box. The light box is necessary for adding Trade Board items that are not already available in the master jewelry library, but it is not necessary for completing the first polished customer-site setup.

## Louis Notifications

For V1, when a paid rep needs operational attention, Louis should be notified immediately.

Priority notification events:

- Payment succeeds and a light box needs to be ordered.
- Required setup hits an error Nic-Nac cannot fix.
- A paid rep is blocked before setup completion.

Preferred low-friction alert path: Telegram, because it can produce a cell-phone pop-up and can later evolve into an operations/issue-agent workflow.

The alert should include enough context to troubleshoot or act quickly:

- Rep name.
- Rep email.
- Rep/account ID.
- Payment or checkout timestamp when relevant.
- Shipping address for light box tasks.
- Current setup step for setup errors.
- Error type/message.
- Last saved setup context or attempted action.

An internal Sparkle Suite dashboard task can also be useful later, but the immediate notification should not rely only on someone checking a dashboard.

## Setup Error Policy

If Nic-Nac can fix or retry an issue, he should do that calmly and keep the rep in the setup flow.

If Nic-Nac cannot fix the issue, he should not dump the rep into the full dashboard or ask them to solve a technical problem. He should say something like:

> I hit a setup issue I do not want you to have to solve. I have notified Sparkle Suite support, and we will help get this finished.

Behind the scenes, Louis should be notified immediately.

For V1, there is no "maintenance agent" or autonomous issue agent requirement. The system should simply notify Louis with enough context to begin troubleshooting.

## Setup Persistence And Recovery

Required setup must be resumable.

If the rep closes the browser, loses internet, leaves to find a shop/social link, or signs out, they should not start over.

Expected behavior:

- Every completed setup step is saved as structured onboarding state.
- Important in-progress answers should be saved when submitted.
- Chat history can support the experience, but structured onboarding state is the source of truth.
- Returning to Sparkle Suite before setup completion should route the rep back to the required Nic-Nac setup flow.
- Nic-Nac should resume naturally: "Welcome back. We were working on your shop and live links. Ready to keep going?"

There should be no timer pressure. Nic-Nac should explicitly allow the rep to leave and return when they need to gather links or information.

## Full Dashboard Unlock

The full dashboard stays unavailable until required setup is complete.

This is a brand-protection decision, not a punishment. If a rep is unwilling to take the time to complete the guided setup, they may not be a good fit for Sparkle Suite's promise of a polished customer experience.

Once setup is complete:

- The full workspace/dashboard opens.
- Nic-Nac remains available for ongoing tasks.
- The rep can return to Nic-Nac later for Trade Board population, site updates, show scheduling, and support.

## Team Management Add-On

Team management is out of scope for V1 self-serve checkout.

The current direction:

- Do not offer team management during initial checkout.
- Keep the initial signup focused on Sparkle Suite core.
- Team management can appear as a locked or coming-soon workspace area.
- Once the core product and rep signup flow are working well, team management can become an in-workspace add-on.
- Activating it later can trigger a separate Stripe add-on charge and its own Nic-Nac setup path.

This avoids selling an unfinished add-on and keeps first paid signup simple.

## Visual And Brand Direction

The required setup screen should feel like Sparkle Suite, not a generic admin dashboard.

Use the production Sparkle Suite brand direction:

- Warm, polished, plain-English, soft, feminine without being sugary.
- `Playfair Display` for headings.
- `DM Sans` for body and UI.
- Warm blush and cream surfaces.
- Espresso/plum ink: `#402924` and dark panel `#36221d`.
- Accent pink: `#ee2c9b`, with primary gradient `#ff4cae` to `#d81b87`.
- Calm, premium, simple, cared-for.

Avoid:

- Dashboard sprawl during first-run.
- Multiple cards and sections competing for attention.
- Internal product language before the rep understands it.
- Making Nic-Nac the only product story on public pages. In setup, Nic-Nac can lead because he is the guide.

## Current Dashboard Concern

The current setup checklist dashboard is not the right first-run experience. Styling it more heavily does not solve the core problem.

It asks a newly paid rep to understand too much at once:

- Setup checklist.
- Account billing.
- Site settings.
- Help and resources.
- Checkout states.
- Nic-Nac.
- Trade Board.
- Dashboard navigation.

The next implementation should replace the first-run dashboard view with required Nic-Nac setup. The full dashboard can remain as the post-setup destination.

## Implementation Implications

This document is a direction/spec note, not the full implementation plan.

Likely implementation areas:

- Replace the current post-checkout first-run dashboard entry with a `required-setup` state.
- Add structured onboarding state for setup steps, saved answers, completion, and unlock.
- Add checkout shipping-address capture/handling for light box fulfillment.
- Add a light box fulfillment task after successful first payment.
- Add immediate Louis alerting, likely Telegram first.
- Add Google sign-in support or prepare auth flow to support it.
- Update Nic-Nac setup prompts/tools to collect, save, generate, and confirm setup answers.
- Keep Team Management locked/deferred.

## Open Decisions For The Implementation Plan

- Exact schema for structured setup state.
- Exact Stripe checkout configuration for shipping address collection.
- Exact Telegram bot/chat setup and fallback notification path.
- Whether to create an internal fulfillment task table now or reuse an existing action/task system.
- Exact wording of the first Nic-Nac setup conversation.
- Exact standard Nic-Nac uses to mark the site "good-looking enough" to unlock the dashboard.
- How Google sign-in will be rolled into the existing Supabase auth flow.

## Done When

- A new rep can create a tiny account, complete Stripe checkout, and enter required Nic-Nac setup.
- Returning before setup completion resumes the same setup state.
- The full dashboard is locked until required setup is complete.
- Nic-Nac can collect and save the essentials for a polished customer site.
- Nic-Nac can generate About page options from casual rep input.
- Trade Board is taught during setup but not populated during first-run unless the rep returns later for that task.
- Successful first payment creates a light box ordering task and notifies Louis.
- Setup errors Nic-Nac cannot fix notify Louis immediately.
- Team management is not part of initial checkout.
