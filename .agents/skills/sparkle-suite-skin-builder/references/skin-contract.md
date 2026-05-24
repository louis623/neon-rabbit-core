# Sparkle Suite Skin Contract

## Non-Negotiable Product Model

Every customer site uses the Amethyst template.

- Stored template: `customerSiteTemplate = 'amethyst'`
- Stored visual style: `appearancePreset = '<skin_id>'`

Skins may change only the visual layer:

- colors
- typography
- card surfaces
- border radius and shape language
- background treatment
- hover and motion energy
- sparkle, texture, and decorative intensity
- button and CTA treatment

Skins must not change:

- Homepage section order or slot names
- Trade Board behavior
- Join page behavior
- signup and unsubscribe flows
- Nic-Nac panel behavior
- public links between Homepage, Trade, and Join
- SEO metadata or real rep/customer data mapping
- authorization, provider, payment, SMS, email, SignWell, or calendar behavior

## Skin Branding Cards

Every skin needs a small browsing card for reps. The card is not the live site and must not require Nic-Nac to apply the skin just so the rep can preview it.

Each card should include:

- stable code or ID the rep can give Nic-Nac
- display label
- one-sentence feel description
- palette swatches
- heading/body font labels
- shape/card/hover notes
- a small static visual sample that suggests the skin's homepage and card treatment

Cards should be suitable for a Help, More Info, or Site Settings browsing surface. Nic-Nac can say: "Browse the skin cards, then tell me the code or name you want to try."

Amethyst also needs a card because it is the default skin.

## Required Implementation Surface

When adding a skin, inspect and update as needed:

- `lib/amethyst/appearance-presets.ts`
- `lib/amethyst/homepage-template-data.ts`
- `lib/amethyst/trade-template-data.ts`
- `lib/amethyst/join-template-data.ts`
- `lib/services/types.ts`
- `lib/services/site-settings.ts`
- `lib/nic-nac/tools/update-site-setting.ts`
- `lib/nic-nac/system-prompt.ts`
- `app/nic-nac/components/DashboardPlaceholder.tsx`
- skin-card registry/component files once they exist
- `public/amethyst/homepage.jsx`, `public/amethyst/trade.jsx`, and `public/amethyst/join.jsx` if their local preset maps are still shipped
- `app/api/amethyst/*-template/route.ts` if bootstrap arguments change
- `supabase/migrations/` for database constraints/defaults
- affected tests under `tests/`

## Naming

Use lowercase snake_case for persisted IDs. Examples:

- `amethyst`
- `sparkle_suite_morganite`
- `rose_quartz`

Use clear labels for reps. Examples:

- `Amethyst`
- `Sparkle Suite/Morganite`
- `Rose Quartz`

## Verification Checklist

- Existing default remains Amethyst.
- Unknown template IDs normalize back to Amethyst.
- Unknown skin IDs normalize back to Amethyst.
- New skin can be saved through Site Settings.
- New skin can be saved through Nic-Nac.
- Skin card exists with a stable code and display label.
- Homepage, Trade, and Join use the same skin tokens.
- Browser render preserves live-site buttons, customer Trade Board access, Join page access, signup behavior, and Nic-Nac visibility.
