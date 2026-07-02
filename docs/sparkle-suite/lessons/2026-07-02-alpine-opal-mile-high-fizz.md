# Alpine Opal and Mile High Fizz Standard Site Model Lesson

**Date:** July 2, 2026

**Affected area:** Sparkle Suite public-site skins, Amethyst customer templates, Site Settings persistence, Supabase appearance preset constraints, and customer-facing migration copy.

## Decision

Mile High Fizz's visual direction is now a reusable Sparkle Suite skin named **Alpine Opal** (`alpine_opal`, `AO-01`). It is available to all reps.

Mile High Fizz itself should use the normal switchable customer-site model: shared Home, Trade, and Join templates with active skin tokens. It should not remain locked to a bespoke one-off fork unless Louis explicitly asks for a custom exception later.

## What Changed

- Alpine Opal was added as a first-class supported appearance preset.
- Mile High Fizz defaults to Alpine Opal but can switch to any supported skin.
- The persisted Mile High Fizz `site_settings` row was migrated to `appearance_preset='alpine_opal'`.
- Lindsey's team copy was corrected: `Diamond Peak Society` is Lindsey's team, and `The Virtuous Fizzers` is the team Lindsey belongs to.
- The Mile High Fizz Trade Board is intentionally empty until Lindsey adds actual pieces.

## Lessons

### Persisted Settings Beat Code Defaults

Existing customer sites usually already have a saved `site_settings` row. Updating static tenant/profile defaults does not change the live customer site if a persisted `appearance_preset` remains in the database.

Required proof for a customer default change:

1. Apply any needed Supabase migration or data update.
2. Read back the exact `site_settings` row for the customer slug.
3. Verify the public template payload emits the expected preset.
4. Verify the stable demo route renders the expected skin.

### Skin QA Must Use the Active Stable Route

Local screenshots and default-skin tests are not enough. Alpine Opal caught a real issue only after reviewing the stable `/milehighfizz/trade` route: hero subcopy was white on a light Alpine background.

Use skin foreground/background tokens for customer-template copy instead of hard-coded color assumptions.

### Check Constraints Should Normalize First

When expanding an enum-like database check constraint, normalize legacy unsupported/null values before adding the new allowed set. The Alpine Opal migration initially failed remotely because old rows still carried unsupported `amethyst` values.

### Customer Copy Should Sound Like the Rep Site

Do not leak implementation phrases such as "standard Sparkle Suite item-for-item swap" into public rep-site copy. Use plain shopper-facing language that fits the rep's brand and current content.

### Render Plain Public Labels

Decorative JSX named entities can render literally in static customer templates if not validated in the browser output. Prefer plain ASCII public labels or verify the rendered output before shipping.

## Related Checkpoints

- `34f2f5b fix: add Alpine Opal skin for Mile High Fizz`
- `c8f8d92 fix: apply Alpine Opal demo migration`
- Stable demo: `https://sparkle-suite-demo.vercel.app`
- Deployment: `dpl_EJYJE6nHpMLgtrXWcgPbNVGRegSh`
