# Sparkle Finder Open Items

- Future Codex sessions should be opened from `C:\Users\louis\sparkle-finder-repo` with Workspace write enabled.
- Keep new durable project memory in repo-local `vault/`.
- Keep new implementation plans, handoffs, decisions, research, and deployment notes in repo-local `docs/`.
- Add repo-local `.agents/skills` entries when Sparkle Finder-specific skills are created.
- Sparkle Finder Vercel now has `OPENAI_API_KEY` for production and preview plus explicit Nic-Nac model env vars. Deployed linked-rep Nic-Nac stream smoke passed with a real temporary authenticated Finder account.
- Secret Rep ID claiming is deployed and smoked: Finder migration applied, shared claim token configured in Suite/Finder Vercel production/preview, service-role table grants fixed, deployed browser claim smoke passed, and temporary smoke data was cleaned up.
- Latest collector profile stats deployment: `dpl_GX6Dzj8DAM61ERf59JHbFTRwUKcf`, aliased at `https://sparkle-finder-dev.vercel.app`, with migration `20260702235634_collection_acquisition_source.sql` applied and remotely verified. Homepage stats are now `Owned`, `Wishlist`, `Diamonds`, `Unicorns`, and `Found by Sparkle Finder`; the Finder-assisted count is sourced from owned items with `sparkle_finder_lead` or `nic_nac_request`.
- Supabase migration history cleanup is complete: remote history matches local migration versions, the short `20260613` migration was normalized to `20260613000000`, `supabase/.temp` is ignored, and `supabase db push --yes` now reports `Remote database is up to date.`
- Continue shared Nic-Nac integration after the model adapter, linked-rep surface prompt, automatic safe Finder-memory preload, linked Suite memory bridge, product-context tool policy, mission guardrails, deployed Secret Rep ID claim UI/storage, configured OpenAI Vercel env, deployed linked-rep smoke, durable Finder Nic-Nac telemetry migration, deployed telemetry build, secured deployed telemetry runtime smoke, baseline AI/memory disclosure copy, availability/live-show read tool parity, collection/Showcase/Studio/profile read-status parity, and collection/Showcase/profile owner save tools: Finder still needs full Studio file-intake workflow exposure through app-owned uploaded file state, attorney/final policy review, broader marketing/onboarding positioning, and eventually an authenticated deployed Nic-Nac save smoke when local smoke credentials are available.
- Latest collection/Showcase/profile owner save-tools deployment: `dpl_2ykVW81bq6FhEzoNAyad8nQDDhHP`, aliased at `https://sparkle-finder-dev.vercel.app`, with Vercel `READY`, public `/`, `/library`, and `/auth/sign-in` returning `200`, and the secured telemetry smoke route returning `401` without a bearer token.
- Latest lint-health cleanup deployment: `dpl_2ysBkLzjEXBUSzas94nmbMpA3i5s`, aliased at `https://sparkle-finder-dev.vercel.app`, with `npm run lint`, strict `npx eslint . --max-warnings=0`, full tests, local production build, and Vercel production build passing.
- Latest collection/Showcase/Studio/profile read-status parity deployment: `dpl_9rdCEsULSz7DUEFFw59aJBbKARfM`, aliased at `https://sparkle-finder-dev.vercel.app`, with Vercel `READY`, public `/`, `/library`, and `/auth/sign-in` returning `200`, and the secured telemetry smoke route returning `401` without a bearer token.
- Deployed Finder Nic-Nac telemetry smoke completed June 22:
  - Migration applied and verified: `supabase/migrations/20260622173000_finder_nic_nac_conversation_telemetry.sql`.
  - Deployed build: `dpl_8tjDSHhUZ2cfvrJtQM61yAXAtNZa` aliased at `https://sparkle-finder-dev.vercel.app`.
  - Runtime smoke command: `npm run smoke:finder-telemetry-runtime`.
  - Result: row counts `{"conversations":2,"messages":4,"runs":2}`, all checks true, cleanup `ok:true`, and residual counts `0`.
  - Security check: `/api/internal/finder/nic-nac-telemetry-smoke` returns `401` without the bearer token.
