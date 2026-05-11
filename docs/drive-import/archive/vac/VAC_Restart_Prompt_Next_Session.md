# VA Compensation — Next Session Restart Prompt

**Use this prompt to open the next VA Compensation session.** Paste into a fresh Claude chat along with the listed files.

---

## Copy Below This Line

---

PROJECT: VA Compensation
CONTEXT: Last session (April 21 evening) designed the complete project management system — 3-phase project structure, 8-stage per-condition pipeline, 4-link-type interlinks, 7-bucket records approach, 5-tier condition organization, 7-color status system. HQ dashboard mockup generated and APPROVED by Louis with no changes. This session = BUILD.
GOAL: Build the VA Compensation tab on NR HQ dashboard exactly as mocked up, fully wired. Chat sessions write directly to Supabase — Claude Code does NOT manually update the dashboard each session. Includes Supabase schema design, Edge Function tool extensions to nr-hq-mcp, frontend build matching mockup 1:1, and generation of the 6-file assembly line as initial seed data.

SESSION OPEN: Standard 6-pull protocol per SOP v1.12.

Pulls to run:
1. search_thoughts query="SESSION CLOSE VA Compensation Project Management System" threshold=0.35
2. search_thoughts query="ACTIVE TASK VA Compensation Dashboard Build" threshold=0.35
3. list_thoughts days=2 limit=30
4. get_build_summary(project="va_compensation") + get_open_items(project="va_compensation")
5. CLAUDE engineering pull: domain="architecture" + domain="verification" + domain="file management"
6. CLAUDE ABOUT LOUIS pull query="VA work partnership session pacing time references" limit=3 threshold=0.4

FILES TO UPLOAD AT SESSION START:
- VAC_Project_Tracker_v1.3.md
- VAC_Evidence_Inventory_v1.1.md
- VAC_Comprehensive_Claim_Review_v1.0_DRAFT.md
- vac_dashboard_mockup.html (the BUILD TARGET — reference throughout)

FIRST ACTIONS (in order):
1. Run 6-pull session open
2. Confirm with Louis any between-session records surfaced (Encounter #3, FL VA continuation, decision letters for buckets)
3. Confirm between-session waiver letter status check — any response from VA?
4. Walk the build approach:
   a. Supabase schema design (vac_conditions, vac_sources, vac_interlinks, vac_activity_log, vac_phase_state)
   b. Edge Function tool extensions to nr-hq-mcp (create/update/list/resolve operations for VAC tables)
   c. Seed data population plan (from 18 existing open_items + Open Brain captures + generated assembly-line files)
   d. Frontend build approach (match mockup 1:1)
5. Adversarial Codex review of schema + Edge Function design per Rule 4 (two-system validation)
6. Generate the 6 assembly-line markdown files as initial seed data:
   - VAC_Source_Records_Tracker.md
   - VAC_Conditions_By_Tier.md
   - VAC_Activity_Log.md
   - VAC_Interlink_Map.md
   - VAC_SubChat_Prompt_Template_v2.md (record-bucket-framed)
   - VAC_HQ_Page_Design.md
7. Write Claude Code prompt for frontend build (Rule 22 rich context)
8. Fire Code session
9. Louis verifies per Rule 18

CRITICAL CONTEXT TO LOAD AT SESSION START:

**Mockup is LOCKED.** Louis said "nothing should be changed on it." Build frontend 1:1 to vac_dashboard_mockup.html. Do NOT propose design changes this session.

**Architecture requirement.** Chat sessions write to Supabase → dashboard reads live. No Code-in-the-loop for routine data updates. Edge Function tool extensions enable this.

**Standing Rule 17 satisfied.** Design approved via mockup. Build is authorized.

**Two new standing rule candidates from last session — honor immediately:**
1. Session pacing is Louis's call. Do NOT propose session close, do NOT ask about fatigue, do NOT check in on how Louis is feeling. Louis decides when sessions end.
2. No time-of-day references. No "tonight," "yesterday," "later today," "this evening," etc. Use session anchors ("last session," "4/21 capture") or specific dates only.

**Sub-chat template v1.0 is OBSOLETE.** Do not use it or reference it. v2.0 (record-bucket-framed) generates this session as part of the 6-file assembly line.

**HLR deadline April 9, 2027** — generous runway. Do not manufacture urgency.

**Louis's wife Meisha has MS** — load-bearing context, never surface inappropriately.

**Louis's explicit emotional reframe from last session:** VA work has been dread / procrastination / anxiety. Seeing the mockup shifted him to excitement. This session's job is to turn excitement into working software. Match the energy — build mode, execution mode.

**Outstanding correspondence still pending VA response:** AFib/back waiver letter — check status at session open.

**Open items inventory:** 18 active items on va_compensation project. None expected to be resolved this session unless build session produces shipped work that closes 312d7bbd (Build VA Compensation project tracking page).

**Sparkle Suite in parallel:** Phase 1 Task 1.1+ still queued on SS track. VA Comp remains Tier 1. Do not propose shifting priority.

POTENTIAL DELIVERABLES THIS SESSION:
- Supabase migration file (new VAC tables + RLS policies)
- Edge Function updates to nr-hq-mcp (new MCP tools for VAC table operations)
- Frontend: VA Compensation tab on NR HQ matching mockup
- 6 assembly-line markdown files (initial seed data)
- Standing Rules v3.17 bump (adds session pacing rule + no-time-references rule)
- Louis verification per Rule 18 of live running dashboard
- Open Brain session close + active task captures

---

## End of Restart Prompt
