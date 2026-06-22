# Sparkle Finder Project State

Sparkle Finder's active implementation workspace is `C:\Users\louis\sparkle-finder-repo` on branch `codex-sparkle-finder-v1`.

The former lightweight binder at `C:\Users\louis\sparkle-finder` has been folded into this repo for durable docs, plans, handoffs, vault memory, and repo-local skills. This keeps Sparkle Finder code and Open Brain/binder memory under one workspace root and avoids recurring Codex sandbox permission prompts.

Future Codex sessions should open this repo directly with Workspace write enabled.

## Current Live Target

- Dev site: `https://sparkle-finder-dev.vercel.app`
- Production-style repo work should happen from this implementation repo, not the old binder.

## Recent Session Context

- Sparkle Finder silver showcase workflow was simplified for phone-first use.
- Advanced showcase/profile controls were removed from the main customer flow in favor of simple cards, simple panels, and Nic-Nac-led help.
- Nic-Nac lead behavior should use customer-friendly wording, local/customer-facing show times, clear buttons for trade board and show/calendar links, and 48-hour freshness/expiration rules.
- June 22, 2026: Finder `/api/finder/nic-nac` now uses the OpenAI-only Nic-Nac model policy adapter (`human_default`) instead of hardcoded Anthropic Haiku. The route keeps Silver gating and Finder-local tools/prompts, but model selection is no longer embedded in the route. Finder Nic-Nac prompts now receive linked-rep surface context when a Finder account is tied to a Sparkle Suite rep, so Nic-Nac can preserve same-assistant identity while telling reps that Sparkle Suite mutations require opening/logging into Sparkle Suite. The route also automatically preloads bounded safe Finder customer memory into the system prompt, while filtering unsafe memory before it reaches the model. Finder now applies a conservative Nic-Nac mission guard before OpenAI configuration, Supabase memory, tool setup, or model streaming, so clear off-mission requests receive a static redirect stream without burning model credits. Finder Vercel now has `OPENAI_API_KEY` and model env vars, and a deployed linked-rep Nic-Nac stream smoke passed earlier today.
- June 22, 2026 later: Finder Nic-Nac durable telemetry is implemented locally. The route now attempts fail-open persistence of conversations, messages, and run telemetry for mission redirects and model-backed streams. The repo also has a reusable deployed linked-runtime smoke script for Secret Rep ID claim plus linked Nic-Nac/telemetry verification. The migration still needs remote application before deployed telemetry smoke can pass.
