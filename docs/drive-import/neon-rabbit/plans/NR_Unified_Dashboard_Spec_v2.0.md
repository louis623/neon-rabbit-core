# Neon Rabbit — Unified Dashboard Feature Specification

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/SOPs/
🔍 HOW CLAUDE ACCESSES IT: Google Drive connector search
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Neon Rabbit (all projects)
👤 WHO USES IT: Louis, Claude, Claude Code
🔄 UPDATE TRIGGER: Any change to dashboard architecture, automation layers, schema, or build plan

**Version:** 2.0 | **Last Updated:** April 2, 2026 | **Author:** Louis Chapman | **A Neon Rabbit Product**

---

## Product Overview

A phone-first web dashboard deployed on Vercel that gives Louis a real-time view of every project and life obligation in one place. The dashboard is highly automated — it updates itself from Claude sessions via Open Brain, auto-generates a daily brief, and auto-calculates stats. Louis's interaction is limited to glancing at it and occasionally tapping in a quick edit for fine details only he knows.

---

## Core Principles

- **Phone-first:** Designed for Android. Thumb-friendly. Installable as PWA on home screen.
- **One view:** Personal + business combined. No separate apps.
- **Highly automated:** Claude sessions auto-report status to the dashboard via Open Brain. Stats auto-calculate. Daily brief auto-generates. Louis enters data only for fine details or quick decisions.
- **Actionable:** Every project shows its next action with a copy-prompt button.
- **Independent:** Own Vercel URL. Works without Claude open. Phone, tablet, desktop.
- **2028 quality:** Modern dark design, smooth interactions, Neon Rabbit branding.

---

## Automation Architecture

The dashboard's core innovation is that it stays current with near-zero manual effort.

### Layer 1 — Open Brain as Data Bus

Open Brain is the central memory for all Claude sessions. By adding a structured tag format to status updates, Open Brain becomes the pipeline that feeds the dashboard.

**How it works:** A Supabase Edge Function monitors the Open Brain thoughts table. When it detects a thought matching the pattern `STATUS UPDATE — [Project]: [details]`, it parses the project name, status, and next action, then writes to the dashboard's projects table.

**Result:** Any Claude session (Code, Cowork, Chat) that captures a status update to Open Brain automatically updates the dashboard. No extra step for Louis.

### Layer 2 — Claude Session Auto-Summaries

A standing instruction is added to the `CLAUDE.md` file in the repo and the Cowork project settings:

> "At the end of every session, capture a status update to Open Brain: STATUS UPDATE — [Project]: [What was done]. Next action: [What's next]. Status: [on track / needs attention / blocked]."

**Result:** Every Claude Code build session and every Cowork research session automatically reports its results to the dashboard.

### Layer 3 — Supabase Real-Time Sync

**How it works:** The dashboard frontend uses Supabase's real-time subscriptions. When the Edge Function writes an update to the projects table, the dashboard refreshes live — no manual reload needed.

**Result:** Louis opens the dashboard and it's already showing the latest state. If a Claude session finishes while the dashboard is open, the update appears in real time.

### Layer 4 — Auto-Calculated Stats

- **Sparkle Suite MRR:** Calculated from client records in Supabase (count × monthly rate). Louis adds a client once when they sign up; math stays current forever.
- **Rabbit Hole sprint progress:** Session summaries include which sprint day was completed. Dashboard counts completed days and shows "Day X of 28."
- **Debt payoff progress:** Calculates from financial entries. Total owed, total paid, percentage progress — all auto-updating as numbers are entered.
- **VA claim status:** Milestone-based tracker. Each milestone gets checked off; progress percentage auto-calculates.

### Layer 5 — Daily Brief (Auto-Generated)

When Louis opens the dashboard in the morning, a Daily Brief card appears at the top:

- **Yesterday's Activity:** Auto-generated from the previous day's Open Brain captures.
- **Today's Top 3:** The highest-priority queue items, pulled from the task queue logic.
- **Alerts:** Any blocked projects, projects with no activity in 7+ days, or approaching deadlines.

**How it works:** A Supabase Edge Function runs on a schedule (or on first dashboard load of the day). It queries Open Brain for yesterday's status updates, queries the task queue, checks for stale projects, and compiles the brief. Stored in a `briefs` table and displayed as a dismissible card.

### Layer 6 — Quick Edit (Human Input)

Some things only Louis knows. For those moments:

- **Tap-to-edit:** Tap any project card's status or next action field. It becomes editable inline. Type the update, tap save. No modals, no forms, no page navigation.
- **Quick add:** A floating `+` button to quickly add a note, a task, or an idea to any project or the backlog.
- **Financial entry:** A simple form for entering/updating debt balances, income changes, or one-time expenses. Designed for thumb input.

**Result:** Manual data entry is limited to the 5% of information that can't be auto-captured.

---

## Data Flow Summary

| Source | Path | Destination | Trigger |
|---|---|---|---|
| Claude Code session | Auto-summary → Open Brain | Dashboard projects table | Session end |
| Cowork session | Auto-summary → Open Brain | Dashboard projects table | Session end |
| Claude Chat | Manual OB capture | Dashboard projects table | Tagged capture |
| Louis (phone) | Tap-to-edit on dashboard | Supabase direct | Manual tap |
| Supabase Edge Fn | OB → parse → write | Dashboard projects table | New OB status thought |
| Supabase Edge Fn | Query OB + tasks | Daily brief | First load of day |

---

## Information Architecture

### 1. Daily Brief (Top — Auto-Generated)
The first thing Louis sees. A dismissible card summarizing yesterday's activity, today's top 3 priorities, and any alerts. Generated automatically from Open Brain data. Disappears after dismissal until the next morning.

### 2. The Pulse (Project Cards)
One card per active project. Each shows: project name, priority tier (color-coded), status badge, and the single next action. Tap to open project detail or tap-to-edit inline.

- **Overall Health Indicator** — aggregate visual. Green if all on track. Yellow if 2+ need attention.
- **Last Updated** timestamp per card so Louis knows if data is fresh.
- **Quick Update button** — tap card to edit status or next action directly.

### 3. Today's Queue
The priority queue. Top 3 actionable items based on tier priority and staleness.

- Queue items show: project name, specific task, Claude tool to use, copy-prompt button.
- **Done button:** mark complete, project next action auto-updates.
- **Queue logic:** Tier 1 first. Within tiers, longest-since-last-activity surfaces higher. Blocked items show grayed.

### 4. Project Detail Pages
Tap any project card to see full details:
- Name, description, scope, key links
- Status history timeline (auto-populated from OB updates)
- Action history (auto-populated)
- Notes section for free-form context

Project-specific sections:
- **Sparkle Suite:** client list with individual statuses, MRR calculation
- **VA Comp:** document checklist (gathered/needed/submitted), milestone tracker
- **Rabbit Hole:** sprint day tracker, launch plan progress
- **Finances:** debt table, payoff progress, budget overview
- **Healthcare:** conditions, meds, providers, appointments

### 5. Quick Stats Bar
Persistent footer or collapsible section visible on every page:
- Sparkle Suite: X clients • $X MRR • X pending
- VA: Current Rating: X% • Claim: [stage]
- Rabbit Hole: Sprint Day X/28 • [phase]
- Finances: Debt: $X • Monthly Min: $X • Paid: $X

### 6. Ideas Backlog
Simple list. Tap to add. Tap existing to promote to active project (with confirmation). Where future ideas live without cluttering the active view.

---

## Technical Architecture

- **Frontend:** React, Tailwind CSS, mobile-first. Single-page app.
- **Backend:** Supabase (neon-rabbit-core). No new infrastructure.
- **Auth:** Supabase Auth (email/password). Shared auth across NR products.
- **Hosting:** Vercel free tier. Custom subdomain (e.g., hq.neonrabbit.net).
- **Real-time:** Supabase real-time subscriptions for live updates.
- **PWA:** Installable on phone home screen. Full-screen, app icon, offline splash.
- **Edge Functions:** (1) OB status parser — watches Open Brain, writes to projects table. (2) Daily brief generator — compiles morning summary.

---

## Database Schema

| Table | Key Fields |
|---|---|
| `projects` | id, name, tier, status, next_action, scope, tool, category, links (jsonb), notes, updated_at |
| `tasks` | id, project_id, description, status (pending/done/blocked), tool, prompt_text, created_at, completed_at |
| `stats` | id, project_id, key, value, updated_at |
| `clients` | id, name, email, domain, status, monthly_rate, launched_at, notes |
| `debts` | id, name, balance, interest_rate, minimum_payment, updated_at |
| `health` | id, type (condition/medication/provider/appointment), name, details, date, notes |
| `va_documents` | id, document_name, status (gathered/needed/submitted), notes, updated_at |
| `ideas` | id, title, notes, created_at |
| `briefs` | id, date, content (jsonb), created_at |

---

## Design Direction

- Dark mode default with light mode toggle.
- Neon Rabbit branding as accents on clean dark background.
- Card-based layout. Stack vertical on mobile, grid on desktop.
- **Tier color coding:** Tier 1 = green, Tier 2 = blue, Tier 3 = purple, Tier 4 = gray.
- **Status badges:** On Track (green), Needs Attention (yellow), Blocked (red), Not Started (gray), Complete (✓).
- Smooth micro-interactions. 2028 feel — not 2010.
- No clutter. Every element earns its place.

---

## Pages / Views

| Page | Description | Build Phase |
|---|---|---|
| Home / Pulse | Daily brief + project cards + queue + stats. Default view. | MVP |
| Project Detail | Full detail, status history, tasks, links, notes. | MVP |
| Queue Manager | Full task queue with add, reorder, complete, copy-prompt. | MVP |
| Ideas Backlog | Parked ideas and future projects. | MVP |
| Finance View | Debt tracker, budget, payoff chart. | Post-MVP |
| Health View | Conditions, meds, appointments, providers. | Post-MVP |
| VA Claim Tracker | Document checklist, milestones, timeline. | Post-MVP |
| Sparkle Suite CRM | Client list, statuses, MRR, pipeline. | Post-MVP |
| Settings | Profile, theme, notifications. | Post-MVP |

---

## MVP Scope

First build includes only what's needed to be useful on Day 1:

- Home / Pulse with all 8 project cards and Daily Brief
- Project detail pages for each project
- Today's Queue with copy-prompt buttons
- Quick Stats bar (auto-calculated)
- Ideas Backlog page
- Open Brain → dashboard auto-sync (Edge Function)
- Claude session auto-summary standing instructions
- Tap-to-edit for quick manual updates
- Mobile-first responsive design + PWA
- Supabase Auth + dark mode

**Post-MVP:** Finance view with charts, health tracking page, VA claim tracker with milestones, Sparkle Suite CRM, settings page, notification system.

---

## Build Plan

The dashboard is a **Tier 3 project** — it gets built when Tier 1 and 2 are running smoothly. Target: MVP build in May 2026 after the Rabbit Hole beta sprint wraps. One focused weekend of Claude Code sessions could scaffold the entire MVP.

Until then, Open Brain serves as the dashboard. Louis can open Claude Chat and ask "what's the status of all my projects?" and get an accurate answer immediately from Open Brain. The master plan document is the interim reference.
