# Nic-Nac Surface Inventory

## Shared Visual Identity

- Current canonical Nic-Nac mark: pink circular badge with a white `N`.
- Shared implementation: `app/_components/nic-nac-mark.tsx`.
- Workspace adapter: `app/nic-nac/components/NicNacGlyph.tsx` wraps the shared mark to preserve existing workspace imports.
- Public landing adapter: `app/_components/sparkle-suite-public-nic-nac.tsx` imports the shared mark directly.
- Future customer-site and Sparkle Finder Nic-Nac surfaces must use the shared mark and must keep surface-specific policy boundaries from `lib/nic-nac/surface-policy.ts`.

## Public Landing

- Entry route: `app/api/public/nic-nac/route.ts`
- Prompt files: `lib/sparkle-suite/public-nic-nac-prompt.ts`
- Knowledge files: `lib/sparkle-suite/public-nic-nac-knowledge.ts` as a public adapter over shared source `lib/nic-nac/knowledge`
- Guardrails: `lib/sparkle-suite/public-nic-nac-guardrails.ts`
- Tools/provider actions: Anthropic text generation only; public preflight/postflight blocks provider actions
- Allowed scope: public Sparkle Suite sales, setup, product-fit, pricing basics, public TradeBoard/LiveQ/calendar/update explanations
- Blocked scope: private workspace data, implementation details, internal/admin workflows, custom pricing exceptions, provider actions, non-public roadmap

## Rep Workspace

- Entry route: `app/api/nic-nac/route.ts`
- Prompt files: `lib/nic-nac/prompt-builder.ts`
- Knowledge files: `lib/nic-nac/prompt-builder.ts` composes shared source `lib/nic-nac/knowledge`; `lib/nic-nac/system-prompt.ts` is legacy/static reference only
- Guardrails: prompt-level workspace rules, authenticated context from `lib/nic-nac/auth.ts`, tool routing from `lib/nic-nac/tools`
- Tools/provider actions: authenticated rep-scoped workspace tools only when active for the turn; HITL applies to destructive or irreversible actions
- Allowed scope: authenticated rep workspace actions on the current rep's board, trade requests, fulfillment queue, calendar, customer audience, customer site settings, current-show memory, and approved one-off notifications
- Blocked scope: cross-rep data, prompt extraction, secret extraction, unsupported provider actions, bulk campaigns, invented tool results, unapproved billing/provider changes

## Customer Site

- Entry route: none found for a customer-facing Nic-Nac assistant in this workspace
- Prompt files: none found
- Knowledge files: customer-site templates and copy exist under `lib/amethyst/*` and `public/amethyst/*`, but no Nic-Nac prompt surface was found
- Guardrails: customer-facing routes rely on their own route/service checks; no customer-site Nic-Nac guardrail layer found
- Tools/provider actions: no customer-site Nic-Nac tools found
- Allowed scope: when added, customer-safe support and public show/trade/request guidance only
- Blocked scope: rep admin workflows, private workspace data, cross-customer data, provider actions, private rep notes

## Sparkle Finder

- Entry route: no active Sparkle Finder Nic-Nac route found
- Prompt files: no active Sparkle Finder Nic-Nac prompt found
- Knowledge files: no active Sparkle Finder Nic-Nac knowledge file found
- Guardrails: no active Sparkle Finder Nic-Nac guardrail layer found
- Tools/provider actions: none found
- Allowed scope: when added, finder-safe guidance, public Sparkle Suite language, shared Nic-Nac personality
- Blocked scope: Sparkle Suite private workspace, rep admin workflows, provider actions, private customer/rep data

## Sparkle Finder Integration Note

No active Nic-Nac route/prompt surface was found in this workspace. When Sparkle Finder adds Nic-Nac, it must import shared knowledge from `lib/nic-nac/knowledge` and use the `sparkle_finder` policy from `lib/nic-nac/surface-policy`.

## Duplicated Facts To Extract

- Bomb Party rep audience: duplicated between public knowledge and workspace prompts
- TradeBoard / dance floor: public knowledge has the most current customer-safe rules; workspace prompts have operational trade-board tool rules
- dancers: public knowledge already defines dancers as rep-listed trade-eligible jewelry; workspace prompt needs the same lingo
- LiveQ: public knowledge defines public data boundaries; workspace LiveQ is not exposed as a direct Nic-Nac tool in the main route
- affiliation: public landing safety content and workspace static prompt both contain non-affiliation language
- setup/onboarding: public knowledge and landing content both describe setup support
- email/SMS consent: public knowledge describes opt-in boundaries; workspace prompt describes one-off notification limits and provider gates
- pricing: public knowledge reads current public pricing from landing content
- Nic-Nac personality: shared source lives in `lib/nic-nac/knowledge/personality.ts`; public landing and workspace prompts consume it through `buildNicNacCoreKnowledgeText()`. Legacy static prompt reference has matching wording only as a fallback/reference.
