# Sparkle Suite Control Center Intake Design - 2026-05-19

## Context

Sparkle Suite should have its own Control Center inside `neon-rabbit-core`.
It should not depend on Neon Rabbit HQ. Build the Control Center in pipeline
order, one launch-path slice at a time, starting with client intake.

The existing internal prelaunch intake review page already contains useful
operator work:

- waitlist and intake submission review
- fit/prequalification signals
- Scout run visibility
- Scribe transcript/handoff readiness
- launch gate readiness
- explicit guardrails that prevent live SMS, payment, and SignWell actions

The first slice should reframe that work into the beginning of the real
Sparkle Suite operating pipeline instead of creating a parallel system.

## First Slice

Create a Sparkle Suite Control Center intake surface at:

- `/control-center`
- `/control-center/intake`

The first route should land on intake because intake is the first operating
chapter. The old internal route can remain available for compatibility while
we migrate language and workflow.

## User-Facing Shape

The intake Control Center should answer these questions quickly:

- Who is in the intake queue?
- What state is each lead in?
- What is the next human action?
- What gates are still blocked before start work?
- What is already proven by Scout, Scribe, Stripe, SignWell, or smoke tests?

For this first slice, show the following pipeline language:

- New intake
- Needs review
- Meeting ready
- Start work ready
- Payment pending
- Agreement pending
- Build ready

These labels are allowed to be derived from the existing intake and handoff
statuses at first. Do not add a second source of truth until an action requires
new persisted state.

## Boundaries

This slice must not:

- send SMS
- attach the Telnyx number
- send a live SignWell agreement
- create a live Stripe checkout or charge
- run paid Nic-Nac provider work
- modify the Chrome extension live queue content script
- touch Neon Rabbit HQ

The Start Work area can explain the intended action path, but provider actions
remain guarded until their individual test slices are implemented and approved.

## Implementation Notes

- Reuse `sparkle_suite_intake_submissions` and the existing prelaunch intake
  review loaders.
- Keep operator authentication on the Control Center routes.
- Preserve the existing internal intake route while adding the new route.
- Keep links lane-aware under `/control-center/intake` when rendered as the
  Control Center.
- Update focused tests around rendering, lane links, and operator access.

## Next Slice After This

After the intake surface is verified, the next testable slice is the Start Work
flow:

1. prepare a customer-facing payment link/session in Stripe test mode
2. itemize the Sparkle Suite build fee and monthly subscription
3. keep SignWell sandbox/draft agreement preparation separate but visible
4. smoke test the sequence from one intake profile

