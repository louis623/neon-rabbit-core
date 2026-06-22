# Sparkle Finder Open Items

- Future Codex sessions should be opened from `C:\Users\louis\sparkle-finder-repo` with Workspace write enabled.
- Keep new durable project memory in repo-local `vault/`.
- Keep new implementation plans, handoffs, decisions, research, and deployment notes in repo-local `docs/`.
- Add repo-local `.agents/skills` entries when Sparkle Finder-specific skills are created.
- Sparkle Finder Vercel now has `OPENAI_API_KEY` for production and preview plus explicit Nic-Nac model env vars. Deployed linked-rep Nic-Nac stream smoke passed with a real temporary authenticated Finder account.
- Secret Rep ID claiming is deployed and smoked: Finder migration applied, shared claim token configured in Suite/Finder Vercel production/preview, service-role table grants fixed, deployed browser claim smoke passed, and temporary smoke data was cleaned up.
- Continue shared Nic-Nac integration after the model adapter, linked-rep surface prompt, automatic safe Finder-memory preload, linked Suite memory bridge, product-context tool policy, mission guardrails, deployed Secret Rep ID claim UI/storage, configured OpenAI Vercel env, deployed linked-rep smoke, durable Finder Nic-Nac telemetry migration, and deployed telemetry build: Finder still needs deeper Finder tool parity and legal/privacy/onboarding disclosure.
- Finish deployed Finder Nic-Nac telemetry smoke:
  - Migration applied and verified: `supabase/migrations/20260622173000_finder_nic_nac_conversation_telemetry.sql`.
  - Deployed build: `dpl_1Q9mZ7WG4eNFWnzhbG7Loco3PbDU` aliased at `https://sparkle-finder-dev.vercel.app`.
  - Pending smoke: `npm run smoke:finder-linked-runtime`.
  - Current blocker: Vercel production env pull exposes key names but returns sensitive values as empty strings, so this terminal cannot run the service-role-backed temporary-user smoke. Run it from an environment that has `NEXT_PUBLIC_SUPABASE_URL` plus a usable Finder `SUPABASE_SERVICE_ROLE_KEY`, or create a secured server-side smoke runner that can use production secrets without exposing them locally.
