# Proper Shell Reset Reviewer Smoke

Use this when reviewing the Nic-Nac rep workspace shell reset and Trade Board surface simplification.

## Target

- Stable demo URL: `https://sparkle-suite-demo.vercel.app`
- Preferred entry: `https://sparkle-suite-demo.vercel.app/start`
- Session type: reviewer smoke synthetic workspace session only

## Reviewer Flow

1. Open `https://sparkle-suite-demo.vercel.app/start`.
2. Use `Reviewer smoke mode`.
3. Choose `Open workspace preview`.
4. Open the `Trade Board` section if it is not already active.

## What to Verify

### Workspace shell

- The workspace uses top tabs instead of a left-side navigation rail.
- Tabs feel like app navigation, with rounded touch-friendly targets.
- The shell reads cleanly on mobile width and does not feel like a shrunken desktop dashboard.

### Trade Board first view

- The first reading order is:
  1. `Today's trade work`
  2. `Quick add`
  3. `Browse board`
  4. queue sections below that when they exist
- `View customer board` remains available.
- The main working surfaces are light and readable.
- Espresso reads as an accent, not the dominant working surface.

### Trade Board behavior

- `Quick add by item number` still accepts input and shows the primary action clearly.
- `Browse board` starts quiet instead of dumping a full spreadsheet-like grid immediately.
- `Filters` can be opened and closed intentionally.
- Search, filter labels, and reset behavior remain available.
- Request inbox, swap cleanup, and fulfillment sections still appear when seeded reviewer data includes them.

## Mobile Check

Use a narrow viewport around `390px` wide and verify:

- tabs remain tappable
- section headers do not collide
- summary cards stack cleanly
- quick add stays obvious
- browse controls do not overflow awkwardly

## Verification Evidence

Before handoff, pair this reviewer path with:

- focused Vitest coverage for workspace shell and Trade Board surface
- `npm run build`
- stable demo alias confirmation on `https://sparkle-suite-demo.vercel.app`

## Notes

- Do not use Louis's personal account for this review.
- Do not treat a raw Vercel preview URL as the final review target unless Louis explicitly asks for one.
