# Neon Rabbit — Google Drive Folder Structure
**Version:** 1.0 | **Created:** April 5, 2026 | **Status:** LOCKED

---
**📍 WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/SOPs/`
**🔍 HOW CLAUDE ACCESSES IT:** Google Drive connector — searched on demand, not pre-loaded
**📁 UPLOAD TO PROJECT:** No — occasional reference only, not needed every session
**🔄 UPDATE TRIGGER:** Any time a new top-level folder is added, a folder is renamed, or the access rules for any folder change

---

## Purpose

This document defines the official Google Drive folder structure for Neon Rabbit Digital Services. It governs where files are stored, who (or what) can access them, and how Claude retrieves them.

**The core rule:** Every file has exactly one home. Nothing lives in two places except Project Files, which live in Google Drive as the master copy AND are uploaded to the Claude project.

---

## Folder Map

```
/Neon Rabbit/                          ← Google Drive root
├── Project Files/                     ← Claude pre-loads these every session
├── SOPs/                              ← Claude searches on demand
├── Client Files/                      ← Claude searches on demand
│   ├── Kara — Sprinkled in Diamonds/
│   ├── Bri — Glowtique/
│   ├── Bling Kitchen/
│   └── Pipeline/                      ← Prospective clients
└── Human Only/                        ← Claude enters only if explicitly asked
    ├── Legal & Business/
    ├── Finances/
    ├── Personal Notes/
    └── Job Search/
```

---

## Folder Definitions & Access Rules

### 📁 Project Files
**Purpose:** Source of truth for all Markdown files uploaded to the Claude project.
**Claude access:** These files are uploaded to the Claude project via the Google Drive connector and pre-loaded every session automatically.
**File format:** Markdown (.md) only.
**Slot limit:** 5 files maximum in the Claude project at any time.
**Workflow:** Claude generates file → download → save here → upload to Claude project via `+` → Google Drive.

**Current authorized project files:**
| File | Status |
|---|---|
| `NR_Document_System_SOP.md` | Live |
| `NR_Dashboard_Architecture.md` | Pending — create when dashboard is locked |
| `Sparkle_Suite_System_Spec.md` | Pending — create next |
| `Rabbit_Hole_Architecture.md` | Pending — create when Phase 2 is locked |
| `NR_Standing_Rules.md` | Pending — create next |

---

### 📁 SOPs
**Purpose:** Occasional process and reference documents Claude retrieves on demand.
**Claude access:** Google Drive connector — Claude searches for these when specifically relevant to a session topic.
**File format:** Markdown preferred. No Word docs unless being held for human sharing.
**Examples:** Client onboarding SOP, SEO/GEO checklist, Claude Code SOP, this file.

**Subfolder:**
- `Archive/` — deprecated or superseded SOPs. Never delete, just move here.

---

### 📁 Client Files
**Purpose:** Per-client reference documents not yet migrated to Supabase.
**Claude access:** Google Drive connector — searched when working on a specific client.
**File format:** Markdown for notes and status docs. PDF/Word acceptable for client-facing deliverables.
**One subfolder per client.** When a client is fully onboarded and their data lives in Supabase, their Drive folder becomes an archive only.

**Current subfolders:**
- `Kara — Sprinkled in Diamonds/`
- `Bri — Glowtique/`
- `Bling Kitchen/`
- `Pipeline/` — prospective clients not yet onboarded

---

### 📁 Human Only
**Purpose:** Documents meant for human reading and management only. Claude does not browse this folder unless explicitly asked to in a session.
**Claude access:** On explicit request only — Louis must ask Claude to look here.
**File format:** Any — Word, PDF, spreadsheets all acceptable here.

**Subfolders:**
- `Legal & Business/` — business license, operating agreements, client contracts, SignWell documents
- `Finances/` — tax docs, bank statements, Stripe exports, anything financial and personal
- `Personal Notes/` — anything not related to Neon Rabbit operations
- `Job Search/` — resume versions, job applications, target company lists, interview notes

---

## Access Summary

| Folder | Claude sees it? | How? |
|---|---|---|
| Project Files | Every session | Pre-loaded via Claude project |
| SOPs | When relevant | Drive connector search |
| Client Files | When relevant | Drive connector search |
| Human Only | Only if asked | Explicit request per session |

---

## File Naming Convention

All files stored in Google Drive should follow this format:

```
[Project/Scope]_[Description]_[Type].md

Examples:
NR_Document_System_SOP.md
Sparkle_Suite_System_Spec.md
Bri_Glowtique_Onboarding_Notes.md
NR_Standing_Rules.md
```

No spaces in filenames. Use underscores. Keep names descriptive but concise.

---

## Updating This Document

Update this file when:
- A new top-level folder is added to `/Neon Rabbit/`
- A folder is renamed or its access rule changes
- A new client subfolder is created under `Client Files/`
- The Claude project file roster changes

Do NOT update this file for:
- Adding individual files to existing folders (that's just normal filing)
- Changes still being planned or discussed

---

*This is a reference SOP — it defines structure, not content. Update the structure, not the files inside it.*
