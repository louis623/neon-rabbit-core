---
name: sparkle-suite-demo-smoke
description: "Use whenever working on Sparkle Suite repo changes, Vercel demo deploys, stable demo alias updates, logged-in workspace checks, required setup checks, Help & Resources checks, Nic-Nac UI checks, or smoke testing where a clean browser would hit sign-in. Guides Codex to use Chrome reviewer-smoke sessions through the stable Sparkle Suite demo URL without using Louis's personal account."
---

# Sparkle Suite Demo Smoke

## Purpose

Use the stable demo and reviewer-smoke flow to verify the real logged-in Sparkle Suite UI without relying on Louis's Chrome session, personal account, cookies, saved passwords, or manual help.

## Default Review Target

- Stable demo URL: `https://sparkle-suite-demo.vercel.app`
- Use this stable URL for Louis-facing smoke checks unless he explicitly asks for a different preview.
- After deploys or alias changes, confirm the stable alias points to the intended Vercel preview before telling Louis to review.

## Chrome Flow

When logged-in UI matters, use the Chrome plugin if available or explicitly enabled by Louis.

1. Open `https://sparkle-suite-demo.vercel.app/start`.
2. Prefer the built-in `Reviewer smoke mode` controls.
3. Use `Open setup preview` for required setup, Help & Resources from setup, final setup, and Nic-Nac setup checks.
4. Use the dashboard/workspace reviewer path when checking the post-setup Sparkle Suite Workspace.
5. Do not use Louis's personal account.
6. Do not inspect Chrome cookies, local storage, saved passwords, profiles, or session stores.
7. Do not touch Chrome Web Store settings or local live extension code.
8. Leave a useful reviewer tab open as a handoff when Louis should inspect the exact state.

## Account Rule

Do not ask Louis for a password just to smoke test Sparkle Suite. The reviewer-smoke path should create and sign into the synthetic demo account from the app flow itself. If reviewer-smoke controls are missing or disabled, report that as the blocker and do not fall back to Louis's personal account unless he explicitly asks.

## Required Checks

For logged-in smoke verification, check the relevant real UI state, not just source or unauthenticated HTML.

- Required setup: Nic-Nac setup screen loads and Help & Resources is available from setup.
- Help & Resources: workflow sections are scannable/collapsible, with clear expand indicators.
- Workspace: Nic-Nac is integrated as expected for the section under review.
- Stable alias: `sparkle-suite-demo.vercel.app` serves the intended latest preview after alias updates.

## Reporting

In final updates, state:

- whether verification used local, preview, stable demo, or production
- whether Chrome reviewer-smoke was used
- what account/session type was used, without exposing or storing secrets
- any parts not visually verified because authentication or reviewer-smoke was unavailable
