# Sparkle Suite — KB Module: Legal

📍 WHERE THIS FILE LIVES: Google Drive /Neon Rabbit/
🔍 HOW CLAUDE ACCESSES IT: Upload to chat when needed
📁 UPLOAD TO PROJECT: No
🏷 PROJECT: Sparkle Suite
👤 WHO USES IT: Louis (reference), Claude (session context)
🔄 UPDATE TRIGGER: Any legal research session, legal consult outcomes, or policy decisions

**Version:** 1.0 | **Derived from:** SS_Knowledge_Base_v1.9 (Section 14, gap analysis) | **Last Updated:** April 8, 2026
**Status:** Research complete, parked for legal review when budget allows.

⚠️ **NOT LEGAL ADVICE.** This is research-informed reference material. Full review by a Florida-licensed attorney is planned before any of this language goes live.

**COMPANION MODULES:**
- SS_KB_Core_v1.0.md — Architecture, strategy, business model, decisions
- SS_KB_SiteSpec_v1.0.md — Site template spec
- SS_KB_OpenItems_v1.0.md — Open questions, research sprint, gap analysis
- SS_KB_Clients_v1.0.md — Client roster and status

---

## Consolidated Legal Consult Session — Planned

When budget allows, ONE legal consult session with a Florida-licensed attorney covering all accumulated legal concerns:
1. TCPA/CAN-SPAM consent language review (specific text for signup forms)
2. Footer disclaimer language review (independent rep disclosure, trademark usage)
3. Join Team FAQ FTC compliance (income claim disclaimers)
4. Annual/Forever cancellation refund policy language
5. Service agreement template review (when drafted)
6. Any other legal items that accumulate before then

Not a retainer — one focused session to get all legal language reviewed at once.

---

## TCPA/CAN-SPAM Compliance (Researched Session #9)

### Critical: NR Carries Liability
NR is legally responsible for what reps send through the platform — even if reps initiate the messages. Must build guardrails so reps cannot blast inappropriate content.

### TCPA (SMS) Requirements
- **Prior express written consent required** before sending marketing SMS
- Consent must be specific to sender — identify NR/rep specifically
- **Honor opt-outs within 10 business days** (immediate in practice)
- **Accept:** STOP, QUIT, CANCEL, UNSUBSCRIBE, END keywords
- Since April 2025: Must accept opt-out via any reasonable method (email, phone, web form, chatbot — not just keyword replies)
- **Sending hours:** 8am–9pm recipient's local timezone (NOT sender's)
- Store consent records for **5 years**
- **Register as 10DLC sender** with The Campaign Registry before any mass SMS
- Florida has additional state-level restrictions
- **Violations:** $500–$1,500 per message

### CAN-SPAM (Email) Requirements
- No prior consent needed to send commercial email
- Must include **opt-out mechanism** in every email
- **Accurate headers** (From, Reply-To)
- **Physical postal address** in every email
- **Identify as advertisement** if promotional
- Honor opt-outs **within 10 business days**
- **Penalties:** Up to $53,088 per violation

### Build Implications
- Consent language on signup forms must be **specific and SEPARATE** for SMS vs email
- Must build automatic STOP handling (chatbot-level opt-out processing)
- Must store **timestamped consent records** in Supabase
- Must enforce sending windows (recipient's timezone, not rep's)
- Pre-show reminders may qualify as transactional (lower consent bar) if customer opted into the event
- Promotional broadcasts require the higher written consent standard
- Build guardrails so reps cannot blast inappropriate content

### Consent Language — Needs Legal Review
Current placeholder (NOT approved): "By signing up, you agree to receive email and SMS updates from [Business Name]. Unsubscribe anytime."

This needs to be replaced with legally-reviewed language that:
- Separates SMS consent from email consent
- Identifies the sender specifically
- Explains frequency
- Explains how to opt out
- Meets TCPA/CAN-SPAM requirements

---

## Footer Disclaimer Language (Researched Session #9)

### Research-Informed Recommended Text
**NOT APPROVED — Parked for legal review**

```
© [Year] [Business Name]. All rights reserved. | [Rep Name] is an Independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC. [Business Name] is not affiliated with, endorsed by, or sponsored by Bomb Party LLC. | Powered by Neon Rabbit Sparkle Suites
```

"Powered by" link → rep-facing homepage of yoursparklesuite.com.

### FTC Compliance — Join Team FAQ
The "Can I really make money doing this?" FAQ answer on the Join Team page requires an FTC-compliant income disclaimer:
- Results vary and are not guaranteed
- Individual results depend on effort, experience, and market conditions
- No income is guaranteed
- Provide context about typical/average rep earnings if known

NR provides standard template answer with appropriate language. Flag to reps during chatbot onboarding.

---

## SaaS Cancellation/Refund Policy

### LOCKED (Session #9)

**Monthly:**
- No refund
- Cancel anytime
- Service runs through end of billing cycle
- Site goes offline after billing period ends

**Quarterly:**
- No refund for current quarter
- Cancel anytime
- Service runs through end of current quarter
- Site goes offline after quarter ends

**All tiers:**
- Site goes offline at end of paid period
- Rep's personal content (photos, copy) exportable upon request before shutdown
- NR-owned code, design, and templates remain NR property

**Note:** SaaS refund policies are NOT legally required in the US for digital products/licenses. Having one is recommended for trust and chargeback prevention.

### NEEDS BRAINSTORMING (Not Yet Decided)

**Annual tier:**
- Pro-rated refund for unused months?
- 90-day cancellation window?
- Full no-refund like monthly/quarterly?
- Something else?

**Forever tier:**
- Does a forever/lifetime tier even exist?
- Risk: cost exposure if NR's costs rise over time
- Risk: reps who pay once and consume resources indefinitely
- Needs dedicated discussion before deciding if this tier is offered at all

---

## Service Agreement

**Status:** PARKING LOT — draft when system exists.

Cannot write agreement for a system that doesn't exist. Draft when:
- Basic rep hub is built
- Workflows established
- Pricing finalized
- Ready to take first new client through new system

Legal consult session will include service agreement template review.

---

## MLM/Direct Sales Compliance Notes

Bomb Party is an MLM/direct-sales company. Rep websites must:
- Clearly identify the person as an independent representative
- Not imply affiliation with or endorsement by Bomb Party LLC
- Include appropriate income disclaimers on any recruitment content (Join Team page)
- Not make income guarantees or misleading income claims

NR carries potential liability for deceptive claims made through its platform — this extends to rep recruitment content on Join Team pages.
