# Sparkle Suite Self-Serve Sales + Nic-Nac Setup Redesign

Date: 2026-05-26

## BLUF

Sparkle Suite should move away from a bespoke intake/build workflow and toward a self-serve sales flow:

1. The rep buys from a sales-focused landing page.
2. They accept the user agreement during checkout.
3. They receive a confirmation email with their site links and setup path.
4. They enter their backend workspace.
5. Nic-Nac guides setup, answers questions, and routes them to help resources.
6. Louis only steps in for escalations.

The landing page sells the product. The backend and help center teach the product.

## Launch Rollout Intent

Post-launch self-service is the target operating model, not the immediate production state. Louis's intended rollout is:

1. Run multiple demos first and harden the product from those sessions.
2. Process waitlist clients when Sparkle Suite is ready for that next group.
3. Move to true post-launch self-service after the waitlist is completed, so a lead can start, pay, and enter the workspace without manual onboarding.

Until Louis explicitly approves deployment or promotion, the post-launch/root landing page remains local-only and production stays on the prelaunch page.

## Target Workflow

### 1. Sales Landing Page

The landing page should focus on conversion and confidence, not training.

Include:

- Clear Sparkle Suite offer and outcomes.
- Customer-site examples or visual skin previews.
- Short embedded TikTok or sales demo clips.
- Pricing/package information if ready.
- Purchase CTA.
- User agreement acceptance as part of checkout.

Do not include:

- Full setup walkthroughs.
- Backend training.
- Detailed how-to videos.
- Language that implies Louis is manually building a custom site for every rep.

### 2. Checkout + User Agreement

Standard purchases should use clickwrap acceptance, not a separate signing flow.

Capture:

- Agreement version.
- Accepted timestamp.
- Rep/account identifier.
- Checkout/session identifier.
- IP address and user agent if available.

SignWell should only remain available for unusual manual contracts if that ever becomes necessary.

### 3. Confirmation Email

After purchase, the confirmation email becomes the handoff into setup.

It should include:

- A warm purchase confirmation.
- A short introduction to Nic-Nac.
- Backend/login link.
- Public site link, if already provisioned.
- Help/how-to hub link.
- Start setup CTA.
- Clear escalation/support path.

The email should set expectations: Nic-Nac will guide setup inside the backend workspace.

### 4. Backend Workspace + Nic-Nac Setup

The backend should become the primary onboarding environment.

Nic-Nac should guide the rep through a first-run checklist:

- Confirm business/profile basics.
- Choose or confirm the customer-site skin.
- Add public links and social profiles.
- Adjust site copy, banner text, and visible public details.
- Add or update shows.
- Set up starter trade board content.
- Learn the calculator.
- Understand the Chrome extension and Live Queue at a high level.
- Review publish/share readiness.

Nic-Nac should be treated as an expert in every rep-facing backend and public-site feature.

### 5. Help + How-To Hub

The help section should be robust, searchable, and easy for Nic-Nac to reference.

Required sections:

- Getting started after purchase.
- Meet Nic-Nac and how to ask for help.
- Backend workspace tour.
- Editing the public site, copy, links, and skin.
- Adding and updating shows.
- Managing trade board content.
- Using the calculator.
- Chrome extension and Live Queue overview.
- Troubleshooting and escalation.

Required video slots:

- Getting started / setup walkthrough.
- How to use Nic-Nac.
- Backend workspace tour.
- Public site editing walkthrough.
- Shows and trade board walkthrough.
- Calculator walkthrough.
- Chrome extension / Live Queue overview.

The Chrome extension video should explain why the extension exists and how it supports Live Queue, without requiring reps to understand implementation details.

The help hub is where full training lives. The landing page can show sales-oriented snippets, but not detailed setup training.

## Intake Redesign

The old intake process should stop being the normal path.

Replace it with:

- Checkout agreement acceptance.
- Account/site provisioning.
- Confirmation email handoff.
- Backend first-run checklist.
- Nic-Nac guided setup.
- Help/how-to resources.
- Escalation form or support path only when needed.

Keep any deeper intake questions inside the backend setup flow where they directly affect the rep's site or workspace.

## Implementation Plan

### Phase 1: Content + Data Contracts

- Define the help/how-to resource taxonomy.
- Add placeholders for all required videos.
- Draft the purchase confirmation email.
- Define the agreement acceptance data shape.
- Define Nic-Nac's first-run setup checklist.

### Phase 2: Landing Page Rebuild

- Rework the landing page around sales, examples, TikTok/demo snippets, pricing, and checkout CTA.
- Remove detailed training/setup content from the landing page.
- Make the product feel self-serve, not bespoke/manual.

### Phase 3: Checkout + Provisioning

- Add agreement acceptance to checkout.
- Store agreement acceptance evidence.
- Ensure checkout can create or connect the rep account/site workspace.
- Send the post-purchase confirmation email.

### Phase 4: Backend Onboarding

- Add the first-run setup checklist.
- Add Nic-Nac prompts/resources for each setup step.
- Make setup resumable so reps can return later.
- Surface escalation only when the rep is blocked.

### Phase 5: Help/How-To Hub

- Build or expand the help section with the required categories.
- Add video embed slots for YouTube walkthroughs.
- Ensure Nic-Nac can retrieve and cite the right help resources.
- Include calculator and Chrome extension / Live Queue overview resources.

### Phase 6: Launch Readiness Testing

- Landing page render and mobile smoke.
- Checkout agreement acceptance tests.
- Confirmation email template tests.
- Help resource tests.
- Nic-Nac help retrieval tests.
- Provider-free onboarding smoke updates.
- Manual review of first-run backend setup.

## Non-Goals

- Do not change Live Queue behavior during this redesign.
- Do not touch `chrome-extension/content.js`.
- Do not touch `supabase/functions/live-queue-sync`.
- Do not make SignWell part of the standard purchase agreement flow.
- Do not preserve bespoke manual intake as the default workflow.

## Open Decisions

- Whether new purchasers get immediate backend access or enter a short pending-approval state.
- Whether the public site URL is available immediately after purchase or after first setup completion.
- Exact YouTube hosting/playlist structure for walkthrough videos.
- Exact checkout-to-account provisioning sequence.
- Whether agreement acceptance lives in an existing table or a new dedicated table.

## Done When

- The landing page sells Sparkle Suite without trying to train the rep.
- Standard user agreement acceptance happens in the checkout flow.
- The confirmation email clearly hands the rep to Nic-Nac and the backend.
- The backend has a first-run setup path.
- The help/how-to hub includes the required categories and video slots.
- Nic-Nac can guide setup and answer feature questions from approved resources.
- Louis is only needed for escalations.
