# BlingKitchen Recipes Need Nic-Nac Ownership

Date: 2026-06-19

## Lesson

When a migrated rep site includes content the rep will keep changing, that content needs a real Sparkle Suite editing path after the initial migration. For BlingKitchen, recipes are not just static Readdy cards. They are Heather's ongoing site content and should be editable by Nic-Nac and the dashboard.

## What This Changes

- Recipes should be stored as public-site data, not only as hardcoded fallback arrays.
- The public Pantry page should load database recipes first.
- The Ready.ai/Readdy migrated recipes can remain as a BlingKitchen-only fallback so the page is never empty before seeding.
- Nic-Nac should be able to list, create, update, remove, reorder, hide/show, and update recipe images/copy.
- Heather should have a straightforward dashboard Recipes section for the same work.

## Recipe Fields To Preserve

- title
- slug
- category
- prep time
- servings
- description
- ingredients
- steps
- note or tip
- TikTok URL
- card image and modal/detail image
- image alt text and crop/focal settings
- display order
- visibility

## Implementation Notes

The June 19 BlingKitchen work added a DB-backed recipe path, media upload support, Nic-Nac tools, dashboard Recipes workspace UI, a public Pantry DB-first loader, and a seed script. Closeout was completed in `ccd4456 feat: migrate BlingKitchen public site`, with recipes seeded, the branch pushed, and stable demo pointed to `https://sparkle-suite-5w9d59ald-louis-2849s-projects.vercel.app`.

## Related Files

- `C:\Users\louis\sparkle-suite\docs\superpowers\plans\2026-06-19-bling-kitchen-nic-nac-recipes.md`
- `C:\Users\louis\sparkle-suite-repo\supabase\migrations\20260619140000_ss_public_site_recipes.sql`
- `C:\Users\louis\sparkle-suite-repo\app\api\nic-nac\site-recipes\route.ts`
- `C:\Users\louis\sparkle-suite-repo\lib\nic-nac\tools\site-recipes.ts`
