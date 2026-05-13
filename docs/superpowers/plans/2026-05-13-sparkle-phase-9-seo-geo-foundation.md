# Sparkle Suite Phase 9 SEO/GEO Foundation Plan

## Tracker Truth

- Branch: `codex/sparkle-phase-9-seo-geo`
- Source branch checkpoint: `4b2ea01 docs: mark low-attention phase 8 slices complete`
- HQ status: Phase 9 is not started; Phase 8 remaining work is mostly blocked or decision-heavy.
- Worktree baseline: clean except unrelated untracked `docs/sparkle-suite/marketing/`.
- Hard boundaries:
  - Do not touch SMS/Telnyx work.
  - Do not build live payment webhook work or depend on unverified payment gate migrations.
  - Do not enable live SignWell sends or write legal agreement copy.
  - Do not touch `docs/sparkle-suite/marketing/`.

## Best Low-Attention Batch

Phase 9 is the best next construction batch because it has several code-only foundations that can be tested without Louis making provider, legal, or payment decisions.

### Build Now

1. Shared crawl URL registry
   - Create pure helpers for Sparkle public origins, routes, sitemap entries, and robots payloads.
   - Preserve current public output for `https://www.yoursparklesuite.com`.
   - Add test fixtures for alternate custom-domain origins without wiring request-host behavior yet.

2. Static Amethyst metadata baseline
   - Add descriptions, canonical links, Open Graph/Twitter metadata, and robots meta tags to `Homepage.html`, `Trade.html`, and `Join.html`.
   - Use stable canonical paths under the current `/amethyst/*.html` static export.
   - Keep page content and legal copy unchanged.

3. Pure structured-data builders
   - Add tested JSON-LD builders for the Amethyst public pages using fixture data.
   - Keep the first pass pure and fixture-driven; no Supabase/host lookup.
   - Render only generic, already-approved public facts when wiring static pages.

4. Markdown-for-agents content builder
   - Add a pure Markdown generator for a rep/public-site fixture.
   - Include expected content-signal metadata in tests.
   - Park serving `/llms.txt` per hostname until host-to-rep routing exists.

### Parked For Later

- Dynamic sitemap/robots request-host serving needs a real host-to-rep lookup layer and custom-domain routing certainty.
- Rep-specific schema needs reliable rep city/state/area-served profile data.
- `llms.txt` per custom domain should wait for the same host-to-rep layer.
- Localized wrappers for live rep pages wait until the dynamic page composition path is selected.
- Any Bomb Party IDS wording or legal-adjacent changes require approved copy, even though the Join page already has an IDS link test.

## Follow-Up Candidate

After the SEO/GEO foundation batch, the next low-decision non-Phase-9 slice is the `NEEDS_COLLECTION` add-listing recovery gap:

- Let Thumper ask for a collection when an existing design has `collection_id = null`.
- Patch only the missing collection after the rep supplies a collection name.
- Never overwrite an existing collection.
- Keep batch behavior out of scope unless the single-listing path is clean.

## Verification

For each implementation slice:

- Add failing focused tests first.
- Run the focused Vitest files for the changed behavior.
- Run `npx tsc --noEmit --pretty false`.
- Run `npm run build` before claiming a larger Phase 9 batch is complete.
- Commit small, coherent slices as they pass.
