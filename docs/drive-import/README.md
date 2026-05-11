# Drive Import

This folder contains Markdown files imported from `H:\My Drive\Neon Rabbit` so Codex and other repo-local agents can read them without depending on that mounted Drive path.

The Google Drive copy remains the backup and historical source. This repo copy is the working import for local agent access.

Start with `MASTER_INDEX.md` when you want the shortest path to the most important planning and context docs.

## Layout

- `archive/`: historical files from `H:\My Drive\Neon Rabbit\Archive`
- `neon-rabbit/`: Neon Rabbit platform plans, HQ docs, memory docs, and operations docs
- `rabbit-hole/`: Rabbit Hole plans and research
- `sparkle-suite/`: Sparkle Suite build plans, specs, design kits, research, and knowledge-base docs
- `skills/`: skill-related Markdown docs imported from Drive
- `tooling/`: CLI cheat sheets and similar reference docs
- `vac/`: VA claim tracking and evidence docs
- `misc/`: anything that does not fit the current routing rules

## Refresh

Run:

```powershell
npm run docs:import-neon-rabbit -- "H:\My Drive\Neon Rabbit"
```

The importer rewrites the repo-side copies and updates `manifest.json` with the source and destination map.
