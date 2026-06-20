# Sparkle Finder Decisions

## 2026-06-20 - Active Workspace

Decision: Sparkle Finder's active Codex workspace is `C:\Users\louis\sparkle-finder-repo`.

The former binder/Open Brain folder at `C:\Users\louis\sparkle-finder` is no longer the active workspace. Durable binder content has been copied into the implementation repo so code, docs, vault memory, plans, handoffs, and skills live under one root.

Reason: Codex kept opening the lightweight binder as the workspace while the implementation repo lived elsewhere, making normal repo work look outside the sandbox and causing repeated approval prompts.

## Standing Product Auth Boundary

Each customer-facing product should keep its own auth boundary by default. Sparkle Finder customer auth should not be routed through Neon Rabbit HQ, Sparkle Suite, or another product unless Louis explicitly approves that architecture for the specific product.

