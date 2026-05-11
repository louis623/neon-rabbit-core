# Neon Rabbit — VA Compensation Project Tracker

**Version:** 1.3 | **Created:** April 20, 2026 | **Last Updated:** April 21, 2026 | **Status:** ACTIVE

---
📍 **WHERE THIS FILE LIVES:** Google Drive `/Neon Rabbit/`
🔍 **HOW CLAUDE ACCESSES IT:** Drive connector on demand OR uploaded at start of VA Compensation sessions
📁 **UPLOAD TO PROJECT:** No — uploaded per VA session only
🏷 **PROJECT:** VA Compensation
👤 **WHO USES IT:** Louis (overall reference), Claude (cite-checking, planning, gap analysis)
🔄 **UPDATE TRIGGER:** Major decisions, condition status changes, filings made, decisions received, strategic pivots, workflow changes, dashboard build milestones

---

## v1.3 Changes (April 21, 2026 — evening session)

Major project management system design session. Workflow architecture locked. HQ dashboard designed and approved. Next session = build.

**Workflow architecture locked:**
- 3-phase project structure (Records Scrub → Records Expansion → Deep Research)
- 8-stage per-condition pipeline (Discovery → Intake → Extraction → Analysis → Strategy → Filed → Decision → Granted|Appeal)
- 4-link-type interlink system (causation / evidence / dependency / presumptive cluster)
- 7-bucket record processing structure
- 5-tier condition organization (Granted / Urgent / Parking Lot / Research / Fringe)
- 7-color status system

**Strategic shifts:**
- Sub-chat approach REFRAMED — record-bucket-framed instead of condition-framed (records cut across conditions)
- VAC_SubChat_Prompt_Template_v1.0 now OBSOLETE — v2 (record-bucket-framed) generates next session

**Deliverables this session:**
- Comprehensive audit framework file generated (VAC_Comprehensive_Claim_Review_v1.0_DRAFT.md)
- HQ dashboard mockup generated (vac_dashboard_mockup.html) — Louis-approved, no changes

**Next session scope locked:**
- Build VAC dashboard exactly as mockup
- Supabase schema + Edge Function extensions for chat-writes-DB architecture
- Generate 6-file assembly line as initial seed data

**New standing rule candidates captured:**
- Session pacing is Louis's call (no Claude-initiated close suggestions, no fatigue check-ins)
- No time-of-day references in responses (no "tonight," "yesterday," etc.)

---

## v1.2 Changes (April 21, 2026 — afternoon session)

Major update after April 21 records discovery session.

**Strategic shifts:**
- HLR argument framework substantially strengthened — VA's own 2020 records contain F41.9 anxiety diagnosis and patient-voice Iraq causation narrative
- "Online counselor" question fully resolved — was VA telehealth at Golden VA, not civilian provider
- New potential claims surfaced: standalone PTSD (combat symptoms volunteered to VA, PCL-5 never administered), additional PACT presumptive (dyspnea, chronic dermatitis)
- New strategic deliverables planned: project tracking page + comprehensive claim history audit

**Process changes:**
- Records retrieval plan partially closed; new pulls scoped (Encounter #3 Georgia series, FL VA continuation)
- Outstanding correspondence flagged: AFib/back C&P waiver letter status check elevated to HIGH

---

## Project Status: TIER 1 — TOP PRIORITY ABOVE SPARKLE SUITE

VA Compensation became top-priority project on April 20, 2026. Reasoning: family financial necessity given Meisha's MS and her decreasing earning capacity over time. Tax-free monthly disability income is structural rather than optional.

This does not mean Sparkle Suite stops. SS Phase 0 complete, Phase 1/2 sessions continue. But VA work gets priority for session slots when scheduling conflicts and is now full-context Claude Chat project, not parallel Cowork project.

---

## Project Management System Architecture (locked 4/21 evening)

### Phases (project-wide, sequential, can overlap per-condition)

| Phase | Name | Goal | Exit Criteria |
|---|---|---|---|
| I | Records Scrub | Extract everything from records already in hand | All known records processed ≥ EXTRACTION stage |
| II | Records Expansion | Pull missing records identified in Phase I | No high-value record sources identifiable as missing |
| III | Deep Research | Per-condition deep dives, PACT presumption research, rating criteria | Filing strategy locked for every condition |

**Current phase: PHASE I — Records Scrub. Progress: ~3 of 12 known records processed.**

### Stages (per-condition pipeline)

```
Discovery → Intake → Extraction → Analysis → Strategy → Filed → Decision → (Granted | Appeal)
```

### Status Colors

| Color | Stage |
|---|---|
| ⚪ Grey | Discovery (untouched) |
| 🟣 Purple | Intake (queued) |
| 🟡 Yellow | Extraction (in progress) |
| 🔵 Blue | Analysis (understood) |
| 🟠 Orange | Strategy (ready but not filed) |
| Blue-outlined | Filed (awaiting VA) |
| 🟢 Green | Granted |
| 🔴 Red | Denied (needs appeal decision) |
| 🟡 Amber | Deferred |

### Interlink Types

1. **Causation** — A causally contributes to B
2. **Evidence** — same document supports both claims
3. **Dependency** — A must be SC'd before B can be claimed as secondary
4. **Presumptive cluster** — shared exposure pathway (PACT)

### Record Buckets

1. VA Clinical Records
2. VA Decision Letters
3. Nexus Letters & Medical Opinions
4. Mayo Records
5. Lay Statements & Personal Statements
6. VA Correspondence (outgoing)
7. Service Records / Military

### 5-Tier Condition Organization

See Section "Conditions — By Tier" below.

---

## Strategic Framework

### Path Forward (Locked April 20, 2026)

**Higher-Level Review (HLR) for GAD denial — not another supplemental.**

Reasoning: The April 9, 2026 GAD denial contained adjudication errors that warrant Higher-Level Review under VA Form 20-0996 rather than another supplemental claim. New evidence has been submitted; the issue is how that evidence was weighed. HLR lets a senior reviewer re-evaluate the existing record without requiring new evidence.

Deadline: April 9, 2027 (one year from decision date). Runway is generous.

### Argument Framework (Updated April 21, 2026)

The HLR rests on six argument categories, all now backed by VA-internal evidence:

1. **Current diagnosis failure** — VA's own records contain F41.9 (8/12/2020 Danborn) and MDD/Anxiety (9/4/2020 + 12/3/2020 Georgia). Plus Mayo Jan 2026 GAD diagnosis "for VA purposes." VA's "no current diagnosed disability" finding contradicts these.

2. **Nexus failure** — VA's own 9/4/2020 clinical record contains Louis's first-person causation narrative tying mood/anger to Iraq. Plus Dr. McMullan's 02/21/2025 nexus letter ("more likely than not...burn pit exposure and stress of deployments"). VA's "no link to military service" finding ignores both.

3. **PACT/TERA presumptive failure** — VA conceded TERA in same denial. Louis's 9/4/2020 medical history at VA includes "Exposure to environmental pollution, occupational" + dyspnea + chronic dermatitis (PACT-relevant).

4. **Duty-to-assist procedural failure** — VA's denial of Golden VA evidence as "not relevant" is impeachable; Golden VA's own notes contain F41.9 diagnosis and active treatment. PCL-5 PTSD screening never administered despite combat symptoms volunteered.

5. **Longitudinal history** — Continuous progression: 2003-2004 Iraq → 2017 first MH touches at Aurora VA → 2020 Aug-Dec active anxiety treatment at Golden VA → 2021+ Mayo records → 2026 Mayo formal GAD diagnosis. 22-year progression.

6. **F41.9 → F41.1 specifier refinement** — VA's 2020 unspecified coding and Mayo's 2026 GAD specifier describe the same continuing condition. Diagnostic refinement is medically routine.

### VetCom Letter (HOLD)

Letter to VetCom requesting senior-advocate engagement and HLR strategy. Adjudication errors rewritten 4/21 to reflect new evidence. Tone: warm but pointed.

HOLD status pending Louis decision on:
- Letter scope (errors-only vs. full HLR strategy preview vs. accountability-focused)
- Whether to deploy now or wait for additional records (Encounter #3, FL VA continuation)
- Tone calibration

### Backup Path

If VetCom doesn't step up after the letter: VA-accredited attorney on contingency (typical 20% of retroactive award, capped, paid only if successful). Research deferred to lower priority.

DAV remains as POA safety net (free, no harm).

---

## Conditions — By Tier

### Tier 1 — Granted / Active Compensation

| Condition | Rating | Effective | Notes |
|---|---|---|---|
| Tinnitus | 10% | 3/17/2025 | Current combined rating = 10% |

### Tier 2 — Urgent / Time-Sensitive

| Condition | Status | Pipeline Stage | Clock |
|---|---|---|---|
| GAD | Denied 4/9/2026 | Strategy 🟠 | HLR by 4/9/2027 |
| AFib | Denied — C&P miss | Analysis 🔴 | Waiver response pending |
| Back / L5 | Denied — C&P miss | Analysis 🔴 | Waiver response pending |
| Psoriasis (Guttate) | Denied | Extraction 🟡 | Rumored Nov 2026 supplemental [PENDING VERIFY] |

### Tier 3 — Parking Lot (Ready, Waiting for Sequence)

| Condition | Status | Pipeline Stage | Waiting On |
|---|---|---|---|
| Sleep Apnea | Denied | Extraction 🟡 | GAD HLR outcome |
| Binge Eating Disorder | Never filed | Intake 🟣 | Strategic call: standalone vs secondary to GAD |

### Tier 4 — Needs More Documentation / Research

| Condition | Gap | Pipeline Stage |
|---|---|---|
| Hypertension | Claim status unclear | Discovery ⚪ |
| PTSD (standalone) | No formal PTSD dx; PCL-5 duty-to-assist gap | Discovery ⚪ |
| Dyspnea / Respiratory | Pulmonary workup needed | Discovery ⚪ |
| Chronic Dermatitis | Decide merge with psoriasis or separate | Discovery ⚪ |
| Tachycardia | Separately claimed or folded in AFib? | Discovery ⚪ |

### Tier 5 — Fringe (To Be Explored)

Unexplored — next session's bucket processing and deep research phase will surface candidates. Angles to evaluate:
- GERD / acid reflux (burn pit pathway)
- IBS / GI issues (Gulf War / burn pit adjacent)
- Migraines / tension headaches (often secondary to MH)
- TBI (even minor head impacts)
- Hearing loss beyond tinnitus
- Erectile dysfunction (secondary to SSRIs or CV)
- Sinusitis / rhinitis (PACT presumptive)
- Skin conditions beyond psoriasis
- Insomnia (secondary to GAD, separate from OSA)
- Depression as separate from GAD (2017 MDD dx on record)
- Sertraline side effects as separate compensable
- Any other symptoms Louis hasn't mentioned to VA

---

## Condition Causation Web

Direct quote from Louis (4/21/2026): *"the anxiety and binge eating that caused the weight gain → which did not help the back issues → which did not help my sleep apnea → which could have been a significant factor in a fib"*

Expanded model:

```
ROOT CAUSES
├─ Iraq deployment 13 mo 2003-2004 (VA-conceded)
├─ Burn pit exposure (Burn Pit Registry, TERA conceded)
└─ Combat experience as driver/machine gunner (in clinical record)
       │
       ├─→ MENTAL HEALTH CHAIN
       │   ├─ Anxiety (GAD/F41.9 → Mayo F41.1)
       │   ├─ Binge eating disorder (F50.81)
       │   ├─ Major depressive features (MDD/Anxiety per Georgia)
       │   └─ Possible PTSD (combat symptoms documented, never formally screened)
       │
       └─→ DIRECT BURN PIT/PACT CHAIN
           ├─ Psoriasis (guttate)
           ├─ Chronic dermatitis
           ├─ Dyspnea
           └─ Possibly hypertension

MENTAL HEALTH CHAIN → PHYSICAL CASCADE
       Anxiety + Binge Eating
              │
              ↓
       Weight gain (BMI 36+ documented)
              │
              ├─→ Back / L5 (mechanical aggravation + service-incurred strain)
              ├─→ Sleep apnea (weight + post-deployment factors)
              └─→ AFib ("binge eating triggers AFIB" per Dr. Georgia)
                       │
                       └─→ Hypertension (cardiovascular stress)
```

---

## Open Items — Live State (NR HQ va_compensation project)

18 items active as of 4/21 evening. See NR HQ MCP for canonical state. No items resolved or created this session — no claims filed, no decisions received.

### Active — High Priority

- `5313f41b` File HLR on GAD denial (deadline 4/9/2027) — argument framework locked
- `b8c4bdd6` Draft VetCom letter — adjudication errors locked, HOLD pending deployment decision
- `0258a20b` AFib + back C&P waiver status check — still no VA response
- `dc965f36` Pull FL VA mental health continuation records post-Dec 2020
- `e96442f0` MyHealtheVet Blue Button pull (2018-2020 + post-2020 records)
- `312d7bbd` Build VA Compensation project tracking page — **DESIGN APPROVED 4/21 EVENING, BUILD QUEUED FOR NEXT SESSION**
- `a679632d` Comprehensive claim history audit + interlink + filing strategy review — framework shipped as VAC_Comprehensive_Claim_Review_v1.0_DRAFT.md; full synthesis pending bucket processing
- `047e4bfc` Get full sertraline + psychotropic Rx history (in_progress)

### Active — Medium Priority

- `6e17a276` C-file via VA Form 3288
- `f7ea138d` McMullan GAD-specific nexus letter refresh
- `dd49d441` Pull encounter #3 from Georgia pharm series
- `00ecb70e` Evaluate VetCom response after letter
- `f415849e` File sleep apnea claim secondary to GAD
- `ca03849b` File psoriasis PACT supplemental (~Nov 2026 deadline)
- `f8d665c6` Evaluate standalone PTSD claim
- `6d7192a5` Evaluate additional PACT presumptive claims

### Active — Low Priority

- `b90270da` Research VA-accredited attorneys on contingency (backup path)

### Active — Infrastructure

- `c257a081` Seed va_compensation Build Tracker structure — **NOW SUPERSEDED BY NEW VAC-SPECIFIC SCHEMA — will be resolved or restructured during build session**

---

## Evidence References

Companion file: **VAC_Evidence_Inventory_v1.1.md**

The Evidence Inventory is the single source of truth for:
- What documents we have
- What status each is in (verified, partial, pending)
- Verbatim quotes safe to cite
- Per-condition gap analysis
- Records retrieval plan

Always consult Evidence Inventory before drafting any filing.

---

## Companion Files

| File | Version | Purpose |
|---|---|---|
| `VAC_Project_Tracker` | v1.3 | THIS FILE — overall project state |
| `VAC_Evidence_Inventory` | v1.1 | Evidence audit, verbatim quotes, gap analysis |
| `VAC_Comprehensive_Claim_Review_DRAFT` | v1.0 | Audit framework — synthesis target end of assembly line |
| `VAC_SubChat_Prompt_Template` | v1.0 OBSOLETE | Condition-framed — do not use |
| `VAC_SubChat_Prompt_Template` | v2.0 | Record-bucket-framed — generates next session |
| `vac_dashboard_mockup.html` | v1.0 | Design-approved HQ dashboard — build target for next session |

### Files to be Generated Next Session (6-file assembly line)

| File | Purpose |
|---|---|
| `VAC_Source_Records_Tracker.md` | Every record, bucket, stage, processing status |
| `VAC_Conditions_By_Tier.md` | Standalone tier list with pipeline stage + evidence score |
| `VAC_Activity_Log.md` | Append-only timestamped log of VA project actions |
| `VAC_Interlink_Map.md` | 4-link-type map of condition relationships |
| `VAC_SubChat_Prompt_Template_v2.md` | Record-bucket-framed sub-chat prompt |
| `VAC_HQ_Page_Design.md` | Design spec formalization of approved mockup |

---

## Key Decisions Locked

| Date | Decision | Reasoning |
|---|---|---|
| 4/20/2026 | VA Comp = Tier 1 priority above SS | Family financial necessity (Meisha MS) |
| 4/20/2026 | HLR path for GAD (not another supplemental) | Adjudication error in existing decision |
| 4/20/2026 | VetCom letter tone: warm but pointed | Accountability moment, not relationship break |
| 4/20/2026 | Keep DAV as POA safety net | Free, no harm |
| 4/20/2026 | VA work moves to Open Brain (out of Layer 7 human-only) | Project complexity requires cross-session memory |
| 4/21/2026 | Records-first strategy locked | Don't draft on incomplete factual base |
| 4/21/2026 | All open_item updates authorized | Strategic re-framing post-records discovery |
| 4/21/2026 eve | Record-bucket-framed sub-chats (not condition-framed) | Records cut across conditions; condition list emerges from records |
| 4/21/2026 eve | 3-phase project structure locked | Prevents premature deep-dive before records processed |
| 4/21/2026 eve | 8-stage pipeline locked | Standardizes condition flow Discovery→Appeal |
| 4/21/2026 eve | 4-link-type interlink system locked | Enables interlink web visualization |
| 4/21/2026 eve | HQ dashboard mockup approved, no changes | Louis: "nothing should be changed on it" |
| 4/21/2026 eve | Chat-writes-DB architecture | Louis's explicit ask: chat sessions write to Supabase, not Code |

---

## Outstanding Items Requiring Louis Action (Between Sessions)

1. Dig for **Encounter #3** in Timothy Georgia pharm series (probably ~10/8/2020) on MyHealtheVet
2. Dig for **Florida VA mental health continuation** records post-Dec 2020 on MyHealtheVet
3. Status check on **AFib/back waiver letter** via VA.gov portal
4. (Optional) locate the individual **decision letters** for AFib, back, sleep apnea, psoriasis, tinnitus grant, any historical denials — these become high-ROI seed data for the decision-letters bucket

No session-scheduling pressure. Spin up when ready.

---

## Critical Context (Always Reload)

- **Letter is HOLD until next strategic call**
- **HLR deadline April 9, 2027** — plenty of runway, do not create artificial urgency
- **Louis's wife Meisha has MS** (load-bearing context, never surface inappropriately)
- **Mayo's "never received an official diagnosis" line is wrong** — VA records prove otherwise; cite VA records directly, do not lean on Mayo for prior-diagnosis question
- **Online counselor identity resolved** — Golden VA telehealth (Danborn + Georgia), not civilian
- **Sub-chat template v1.0 is OBSOLETE** — do not use
- **Next session = BUILD, not more design**

---

## Version History

- **v1.3 — April 21, 2026 (evening)** — Project management system architecture locked. 3-phase / 8-stage / 4-interlink / 7-bucket / 5-tier / 7-color system documented. HQ dashboard mockup approved. Next session = build. Sub-chat template reframed record-bucket-based. Two new standing rule candidates captured.

- **v1.2 — April 21, 2026 (afternoon)** — Major update after records discovery session. HLR argument framework rebuilt with Golden VA evidence. Online counselor question marked resolved. New potential claims surfaced (PTSD, PACT presumptives). Causation web articulated. Open items live state updated. Outstanding action items for between-sessions logged.

- **v1.1 — April 21, 2026** — Renamed from L1_VA_Compensation_Project_Tracker to VAC_Project_Tracker (de-L1'd, moved to per-session upload). Added open_items reference table. Records-first strategy locked.

- **v1.0 — April 20, 2026** — Initial creation. Project elevated to Tier 1. HLR path locked. Strategic framework established.

---

*This tracker is the single source of truth for VA Compensation project state. Every VA session opens with this file loaded. Updates happen incrementally per Standing Rule 12 — never batched.*
