# Customer-Site Skin Precedence Lesson

**Date:** June 15, 2026

**Affected area:** Sparkle Suite workspace Site Settings, customer-facing Amethyst/live-preview routes, and required setup state.

## Symptom

Louis selected a customer-facing site skin in the Sparkle Suite workspace and saved it. The workspace/settings path appeared to accept the change, but the live preview and actual customer-facing route kept rendering Amethyst.

This was especially frustrating because earlier smoke checks did not prove the exact behavior Louis was testing: saving a skin in the deployed demo workspace and then refreshing the deployed customer-facing site/live preview.

## Root Cause

`loadAmethystPreviewTemplateData` applied required-setup draft answers over saved `site_settings` even after the rep setup session had reached `dashboard_unlocked`.

For Louis's Fizz Fest, saved Site Settings had `appearance_preset='amber'`, but stale setup answers still had `site_skin.selectedLook='AM-01'`. The public template pipeline trusted the stale setup answer and emitted `preset:"amethyst"`, so the rendered customer site stayed on Amethyst no matter what the workspace saved.

## Fix

Saved Site Settings own the customer-facing site after setup is unlocked. Required setup draft answers should only influence the preview/template while setup is still active, such as `required_setup` or `setup_blocked`.

Related implementation checkpoint:

- `0b1563c fix: honor saved customer site skin after setup`

## Required Verification Next Time

For any future bug where workspace settings do not appear on a live customer site, do all of this before saying it is fixed:

1. Save through the actual deployed workspace path or `/api/nic-nac/site-settings`.
2. Read back the persisted `site_settings` value.
3. Inspect `self_serve_setup_sessions` for stale answers that could override settings.
4. Verify the public template endpoint for the same rep/slug emits the selected preset, such as `black_diamond`, `amber`, or the target skin.
5. Verify the customer slug route and trade route use the rep-scoped template source.
6. Verify the rendered page on `https://sparkle-suite-demo.vercel.app/<slug>` and the corresponding live-preview route after refresh.
7. Capture a screenshot or DOM/body-class proof from the stable demo route.

Do not call it fixed from API-only, template-only, or local-only checks.

## Preventive Rule

Regression tests must cover an unlocked dashboard with stale setup answers and a different saved Site Settings skin. The expected result is that the saved Site Settings skin wins.

## Stable Review Target

Louis reviews Sparkle Suite demo behavior at:

- `https://sparkle-suite-demo.vercel.app/`

A raw Vercel preview URL is not enough for Louis's review unless he explicitly asks for it.
