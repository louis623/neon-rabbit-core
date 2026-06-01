# Project State

**Last updated:** May 31, 2026

---

## Current Phase

**Phase 1 closing into Phase 2**

---

## Platform

- **Live URL:** yoursparklesuite.com
- **Hosting:** Vercel
- **Framework:** Next.js 16
- **Repo:** louis623/neon-rabbit-core on GitHub

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| Platform (Vercel + Next.js) | Live | Connected to GitHub repo |
| Supabase | Not started | Phase 2 first task |
| GitHub vault | Active | Being set up this session — bridge memory system |
| Open Brain | Planned | Phase 2 — Supabase + pgvector + Discord capture bot |
| Chrome extension | Live (sideload) | Live Reveal Queue exists as sideload band-aid — rebuild as Web Store extension is Phase 2 parallel track |

---

## Current Priority

1. Finish Bri's Glowtique (last two Readdy builds — pending client review and launch)
2. Finish Bling Kitchen (last two Readdy builds — calendar automation next)
3. Phase 2 starts immediately after both are complete

---

## Memory Architecture

| Layer | Status | Description |
|-------|--------|-------------|
| GitHub vault | Active (bridge) | This folder — plain Markdown, readable by any AI |
| Supabase context store | Phase 2 | Postgres-backed structured context |
| Open Brain | Phase 2 | pgvector semantic search + Discord capture bot |
| Obsidian | Phase 2 | Visual interface layered over the same vault files |

---

## Sparkle Suite Cloud Work Direction

Louis wants Sparkle Suite work to use bigger autonomous batch missions without forcing him to manage small pipeline chunks. The laptop is a bottleneck and liability for running several modern web repos at once. The next operating model is:

- one current local repo/session finished safely at a time
- commit and push completed or meaningful checkpoints to GitHub
- inventory the three heavy Sparkle repos after they are pushed
- stand up GitHub Codespaces for heavy build work
- keep the laptop as the review/control surface
- let Vercel serve deployed sites from GitHub and Supabase serve live app data

Priority Codespaces candidates:

| Product/Repo | Current local/GitHub name | Target name | Notes |
|--------------|---------------------------|-------------|-------|
| Sparkle Suite | `neon-rabbit-core` | `sparkle-suite` | Main rep-side platform, workspace, public site, and product logic. |
| Sparkle Finder | `sparkle-suite-customer` | `sparkle-finder` | Customer/collector hub for rep discovery, live calendars, trade browsing, jewelry search, customer profiles, and Silver/Nic-Nac collector features. |
| Sparkle Rep Onboarding | `britt-with-bling-start-strong` | `sparkle-rep-onboarding` | Productized onboarding/resource launchpad for reps; not a replacement for Bomb Party University training. |
| Sparkle Marketing | `sparkle-suite-marketing` | `sparkle-marketing` | Marketing source of truth for Suite and Finder. Can stay local/lightweight unless it becomes build-heavy. |
