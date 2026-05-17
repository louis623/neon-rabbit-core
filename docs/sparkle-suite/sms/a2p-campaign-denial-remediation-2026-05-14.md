# Sparkle Suite A2P Campaign Denial Remediation - 2026-05-14

## Current truth

- Telnyx brand was previously verified.
- Sparkle Suite A2P/10DLC campaign was denied on 2026-05-14.
- Live SMS remains blocked.
- Do not attach `+19044383050`, claim real handset delivery, or mark SMS live until the campaign is approved and a handset smoke test succeeds.

## Denial details

From the Telnyx denial screen provided on 2026-05-14:

- Campaign ID: `4b30019e-140e-f6e9-0a95-4b5e0a73c301`
- TCR Campaign ID: `C7BAANX`
- Date registered: 2026-05-10
- Use case: Sole Proprietor
- Status: Failed MNO Review
- Failure reason: `Reseller / Non-compliant KYC. Register the brand info, not the agency behind the brand. (710)`

Submitted description shown in the denial screen:

> Neon Rabbit Digital Services sends Sparkle Suite marketing updates customer care messages and account notifications to people who opt in for Sparkle Suite information and onboarding support.

Submitted message flow shown in the denial screen:

- Verbal consent for Marketing Use Case.
- Customer may call `+17206296507` or be present in the office.
- Employee verbally presents consent language.
- Submitted language references `https://sparkle-suite.vercel.app` for privacy policy and terms of service.
- Confirmation SMS begins with: `Neon Rabbit Digital Services: You have agreed to receive SMS updates...`

## Live Telnyx portal facts - 2026-05-15

Observed directly in Telnyx before any resubmission:

- Brand ID: `4b20019e-026e-871a-a8cc-15f448839ccd`
- Brand TCR ID: `B6LGQP3`
- Brand status: `Verified`
- Brand registered: 2026-05-07
- Brand last updated: 2026-05-15
- Entity type: `Sole Proprietor`
- First/last name: `Louis Chapman`
- Telnyx brand field label: `DBA or brand name`
- Current Telnyx value for `DBA or brand name`: `Neon Rabbit Digital Services`
- Vertical: `Professional Services`
- Website: `https://sparkle-suite.vercel.app`
- Reseller: `No`
- Brand contact email: `louis@neonrabbit.net`
- Brand contact number: `+17206296507`
- Brand webhook URL: `https://sparkle-suite.vercel.app/api/telnyx/webhook`

Campaign details:

- Campaign ID: `4b30019e-140e-f6e9-0a95-4b5e0a73c301`
- TCR Campaign ID: `C7BAANX`
- Brand shown on campaign: `Neon Rabbit Digital Services`
- Assigned numbers: `0`
- Status: `Failed MNO Review`
- Actions available: `Edit campaign`, `Appeal Campaign`, `Deactivate campaign`

Live diagnosis update:

- The current brand record itself likely reinforces the reviewer confusion because the Telnyx `DBA or brand name` field says `Neon Rabbit Digital Services`, while the public website/product/opt-in story is Sparkle Suite.
- The brand website and webhook still use the old Vercel domain, while the next submission must use production URLs.
- Do not start by appealing. Start by correcting the brand identity/website story, then edit or resubmit the campaign.

## Live Telnyx portal update - 2026-05-17

Observed after Louis submitted the brand edit in Telnyx:

- Brand ID: `4b20019e-026e-871a-a8cc-15f448839ccd`
- Brand status: `Verified`
- Brand last updated: 2026-05-17
- Telnyx campaign list now shows brand name: `Sparkle Suite`
- Brand website now shows: `https://www.yoursparklesuite.com`
- Brand webhook URL was staged as: `https://www.yoursparklesuite.com/api/telnyx/webhook`
- Original denied campaign `C7BAANX` still exists with `0` assigned numbers and status `Failed MNO Review`.

New campaign draft staged in the Telnyx portal, but not submitted:

- Brand: `Sparkle Suite`
- Use case type: Sole Proprietor
- Selected use cases: `Marketing`, `Customer Care`, `Account Notification`
- Vertical: `Professional Services`
- Privacy Policy: `https://www.yoursparklesuite.com/privacy-policy`
- Terms and Conditions: `https://www.yoursparklesuite.com/terms-and-conditions`
- Embedded link sample: `https://www.yoursparklesuite.com/prelaunch`
- Campaign webhook: `https://www.yoursparklesuite.com/api/telnyx/webhook`
- Embedded link: `Yes`
- Embedded phone number: `No`
- Number pooling: `No`
- Age-gated content: `No`
- Direct lending or loan arrangement: `No`
- Keywords: `START`, `STOP`, `HELP`
- HELP contact used in the portal draft: `louis@neonrabbit.net`

Payment and confirmation screen state:

- Telnyx shows an application fee of `$10.00 USD`, first three months campaign fee of `$2.25 USD`, and recurring fee of `$0.75 USD per month`.
- The payment terms checkbox was intentionally left unchecked.
- The `Submit` button is disabled.
- No new campaign submission/payment was completed.
- No phone number was attached.
- Live SMS remains blocked until campaign approval, number attachment, and handset smoke succeed.

Follow-up correction:

- Attempting to submit the new campaign draft surfaced Telnyx error: `"Body/brandid": Sole Proprietor brands can only have one active campaign.`
- The existing failed campaign `C7BAANX` still counts as the brand's one campaign.
- Campaign details for `C7BAANX` expose these actions: `Edit campaign`, `Appeal Campaign`, and `Deactivate campaign`.
- Preferred next path is to use `Edit campaign` on `C7BAANX` and replace the denied fields with the corrected Sparkle Suite sender/opt-in/legal copy, then stop at payment/confirmation before final submit.
- Do not deactivate the failed campaign unless Telnyx support or portal behavior confirms edit/resubmission cannot resolve the one-campaign constraint.

Resubmission update:

- Louis approved clicking `Save` on the existing campaign edit form.
- Campaign `C7BAANX` / `4b30019e-140e-f6e9-0a95-4b5e0a73c301` was saved with the corrected Sparkle Suite campaign description, web opt-in workflow, sample messages, keyword replies, production legal URLs, and production webhook.
- After save, Telnyx returned to the campaigns list and the campaign status changed from `Failed MNO Review` to `Pending Telnyx Review`.
- Assigned numbers remain `0`.
- Do not attach `+19044383050` or mark SMS live until the campaign is approved and a handset smoke test succeeds.

## Primary diagnosis

The explicit denial code is KYC/brand ownership mismatch, not opt-in copy alone.

Treat the next submission as a brand/KYC correction first:

- Confirm the actual legal brand owner for Sparkle Suite SMS traffic.
- If Neon Rabbit Digital Services is the legal owner/operator of Sparkle Suite, resubmit with KYC and campaign language that clearly establishes Neon Rabbit as the first-party sender, not an agency or reseller sending on behalf of another brand.
- If Sparkle Suite or another end business is the true customer-facing legal brand, register that brand's KYC details instead of Neon Rabbit's agency identity.
- Do not reuse wording that makes Neon Rabbit sound like an agency sending for a separate unnamed client.

## Public compliance URL audit

Use production URLs only in the resubmission:

- `https://www.yoursparklesuite.com/prelaunch`
- `https://www.yoursparklesuite.com/privacy-policy`
- `https://www.yoursparklesuite.com/terms-and-conditions`

Observed risk in denied submission:

- The submitted flow references `https://sparkle-suite.vercel.app`, while the current compliance evidence should point to the production `www.yoursparklesuite.com` domain.
- The submitted opt-in flow emphasizes verbal consent. Web opt-in evidence is cleaner and should be the primary flow for resubmission.
- The public waitlist previously required phone and SMS consent to join. That could conflict with the required disclosure that SMS consent is not a condition of purchase or service.

Remediation applied in repo:

- The public waitlist phone field is optional.
- The SMS checkbox is optional and unchecked by default.
- Phone is required only when the user checks SMS consent.
- The SMS consent block now includes STOP, HELP, message frequency, message/data rates, carrier liability, no third-party marketing sharing, and links to the Privacy Policy and Terms and Conditions.
- Email-only waitlist signups are accepted and stored with `phone: null` and `sms_consent: false`.

## Final pre-resubmission package - 2026-05-15

### Sender identity decision

Preferred correction, based on the live Telnyx field label `DBA or brand name`:

```text
Sparkle Suite
```

Use `Sparkle Suite` as the Telnyx brand/DBA name if Telnyx allows the verified sole proprietor brand to be edited. Keep Louis Chapman as the sole proprietor identity and keep `Reseller: No`.

If Telnyx support says the brand field must retain the existing business name, use this fallback identity consistently:

```text
Neon Rabbit Digital Services d/b/a Sparkle Suite
```

Customer-facing SMS messages should begin with `Sparkle Suite:` because Sparkle Suite is the public product/program name. Campaign description, opt-in workflow, legal evidence, and support language should explain that Sparkle Suite is owned and operated by Neon Rabbit Digital Services, not an agency client or reseller customer.

Do not use:

- `Neon Rabbit Digital Services sends Sparkle Suite...`
- `on behalf of Sparkle Suite`
- `for Sparkle Suite`
- wording that makes Neon Rabbit sound like a marketing agency, reseller, or third-party software provider texting for a separate end brand

If the Telnyx brand cannot be edited without a new paid brand registration, ask Telnyx support whether changing the sole proprietor brand/DBA value from `Neon Rabbit Digital Services` to `Sparkle Suite` is the right correction for rejection 710 before paying for the campaign review again.

### Campaign description

```text
Sparkle Suite sends opted-in launch, onboarding, account, and customer support updates to people who request Sparkle Suite information through the public Sparkle Suite waitlist or intake forms. Sparkle Suite is the first-party software and messaging program operated by Neon Rabbit Digital Services under Louis Chapman's verified sole proprietor brand registration. Messages are sent only to contacts who provide their phone number and check the optional SMS consent box. Messages may include launch updates, onboarding next steps, account notifications, customer care follow-up, live show reminders, event updates, and trade board updates. Recipients can reply STOP to unsubscribe or HELP for help.
```

### Opt-in workflow

```text
A user visits https://www.yoursparklesuite.com/prelaunch, reviews the Sparkle Suite waitlist form, and may enter their name, email, optional phone number, TikTok handle, team rep name, and optional setup notes. The SMS consent checkbox is optional and unchecked by default. A phone number is required only if the user chooses SMS updates. If the user checks the SMS consent box, the form states that they agree to receive occasional Sparkle Suite launch updates by text, that message frequency may vary, message and data rates may apply, consent is not a condition of purchase, wireless carriers are not liable for delayed or undelivered messages, they can reply HELP for help or STOP to opt out, SMS opt-in data is not sold/rented/traded/shared for third-party marketing, and the Privacy Policy and Terms and Conditions are linked beside the consent language.
```

If Telnyx requires verbal opt-in to remain listed, make it secondary and specific:

```text
Sparkle Suite may also collect verbal SMS consent only from people who directly ask for Sparkle Suite information during a live conversation with Sparkle Suite / Neon Rabbit Digital Services. Staff read the same consent terms shown on the public waitlist form and record the phone number only after the person verbally agrees. The primary opt-in path is the public web form at https://www.yoursparklesuite.com/prelaunch.
```

### Use-case and URL choices

- Campaign use case: keep `Marketing`, `Customer Care`, and `Account Notification` only if Telnyx allows all three on the current sole proprietor campaign type.
- Embedded links: `Yes`, if any sample includes `https://www.yoursparklesuite.com/prelaunch`.
- Embedded phone numbers: `No`.
- Number pooling: `No`.
- Age-gated content: `No`.
- Direct lending or loan arrangement: `No`.
- Production opt-in URL: `https://www.yoursparklesuite.com/prelaunch`
- Privacy Policy: `https://www.yoursparklesuite.com/privacy-policy`
- Terms and Conditions: `https://www.yoursparklesuite.com/terms-and-conditions`
- Brand website, if editable: `https://www.yoursparklesuite.com`
- Brand webhook URL, if editable: `https://www.yoursparklesuite.com/api/telnyx/webhook`
- Do not use `https://sparkle-suite.vercel.app` anywhere in the resubmission.

### Message samples

Use `Sparkle Suite:` as the visible sender label, backed by the KYC/campaign description above.

```text
Sparkle Suite: Thanks for joining the waitlist. We will text useful launch updates when there is something worth knowing. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

```text
Sparkle Suite: Your onboarding follow-up is ready. Check your email for next steps, or reply HELP for support. Reply STOP to unsubscribe.
```

```text
Sparkle Suite: [Rep Name] is live tonight at [time]. Check their Sparkle Suite site for event details. Reply STOP to unsubscribe or HELP for help.
```

```text
Sparkle Suite: [Rep Name] updated their trade board with new pieces. Visit their Sparkle Suite site to browse. Reply STOP to unsubscribe.
```

Embedded-link sample:

```text
Sparkle Suite: Your waitlist spot is saved. See what is coming at https://www.yoursparklesuite.com/prelaunch. Reply STOP to unsubscribe or HELP for help.
```

### Keyword replies

STOP:

```text
Sparkle Suite: You have been unsubscribed and will no longer receive SMS updates. Reply START to resubscribe.
```

HELP:

```text
Sparkle Suite: For help, email hello@yoursparklesuite.com or louis@neonrabbit.net. Reply STOP to unsubscribe. Msg&data rates may apply.
```

START:

```text
Sparkle Suite: You are resubscribed to SMS updates. Reply STOP to unsubscribe or HELP for help. Msg&data rates may apply.
```

### Support-contact language

Preferred campaign support contact, if Louis confirms inbound mail works:

```text
For Sparkle Suite SMS help, email hello@yoursparklesuite.com or reply HELP to any Sparkle Suite text message. Sparkle Suite is operated by Neon Rabbit Digital Services in Jacksonville, FL.
```

Fallback support contact if `hello@yoursparklesuite.com` is not receiving inbound mail yet:

```text
For Sparkle Suite SMS help, email louis@neonrabbit.net or reply HELP to any Sparkle Suite text message. Sparkle Suite is operated by Neon Rabbit Digital Services in Jacksonville, FL.
```

Before submitting, make the HELP response, legal pages, and campaign support email match whichever support contact is actually live.

## Louis reviewer-facing checklist

Complete this checklist before paying another campaign review fee.

1. Telnyx KYC / brand record:
   - Confirm the verified sole proprietor identity is Louis Chapman.
   - Preferred: change `DBA or brand name` from `Neon Rabbit Digital Services` to `Sparkle Suite` if Telnyx allows it without creating a worse mismatch.
   - If the brand field cannot be changed safely, ask Telnyx support whether `Neon Rabbit Digital Services d/b/a Sparkle Suite` is acceptable before resubmitting the campaign.
   - Change website from `https://sparkle-suite.vercel.app` to `https://www.yoursparklesuite.com` if Telnyx allows brand edits.
   - Change webhook from `https://sparkle-suite.vercel.app/api/telnyx/webhook` to `https://www.yoursparklesuite.com/api/telnyx/webhook` if Telnyx allows brand edits and the production webhook is deployed.
   - Screenshot the brand details page before resubmission.
2. Sender identity:
   - Use `Sparkle Suite` as the visible sender and public brand.
   - Use `Neon Rabbit Digital Services d/b/a Sparkle Suite` only as fallback support/legal context if Telnyx requires the current brand value to remain.
   - Use `Sparkle Suite:` as the visible sample-message sender.
   - Remove any `on behalf of`, `agency`, `reseller`, or separate-client wording.
3. Public opt-in evidence:
   - Deploy the waitlist remediation before resubmitting.
   - Screenshot `https://www.yoursparklesuite.com/prelaunch` with the SMS checkbox visible, optional, and unchecked.
   - Screenshot the phone field showing it is not required unless SMS is selected.
   - Screenshot the disclosure with STOP, HELP, message frequency, rates, consent not condition of purchase, carrier liability, no third-party marketing sharing, Privacy Policy, and Terms links.
4. Legal evidence:
   - Confirm `https://www.yoursparklesuite.com/privacy-policy` loads.
   - Confirm `https://www.yoursparklesuite.com/terms-and-conditions` loads.
   - Confirm the SMS terms and privacy sections use the same sender/support story as the campaign.
5. Campaign fields:
   - Use production URLs only.
   - Use the public web form as the primary opt-in workflow.
   - Include verbal opt-in only if Louis will actually use and document that process.
   - Keep embedded links enabled only if using the production `www.yoursparklesuite.com` link sample.
6. Post-approval gate:
   - Do not attach `+19044383050` until the campaign is approved.
   - Do not run or claim real handset delivery until after number attachment.
   - Save queued/sent/delivered provider evidence and an actual handset screenshot after smoke succeeds.
   - Only then update HQ/Open Brain from `blocked` to `live`.

## Telnyx support pre-check draft

Send this before paying the next review fee if Telnyx support will advise:

```text
Subject: Pre-check for corrected 10DLC resubmission after rejection 710

Hello Telnyx team,

Our Sparkle Suite sole proprietor 10DLC campaign was denied with rejection 710:
"Reseller / Non-compliant KYC. Register the brand info, not the agency behind the brand."

Campaign ID: 4b30019e-140e-f6e9-0a95-4b5e0a73c301
TCR Campaign ID: C7BAANX

The verified Telnyx record is a sole proprietor brand under Louis Chapman. The current Telnyx DBA/brand name field says Neon Rabbit Digital Services, but Sparkle Suite is the first-party public product/program and opt-in brand operated by Neon Rabbit Digital Services, not an agency client or reseller customer. The current brand website also still points to the old Vercel URL, and we plan to correct it to https://www.yoursparklesuite.com.

For resubmission, we plan to use this public sender identity:

Sparkle Suite

The public opt-in flow is:
https://www.yoursparklesuite.com/prelaunch

Privacy Policy:
https://www.yoursparklesuite.com/privacy-policy

Terms and Conditions:
https://www.yoursparklesuite.com/terms-and-conditions

The waitlist SMS checkbox is optional, unchecked by default, and includes STOP/HELP, message frequency, message/data rates, consent not a condition of purchase, carrier liability, no third-party marketing sharing, and legal links. Phone number is required only if SMS consent is selected.

Before we pay for another review, can you confirm whether we should edit the existing sole proprietor brand's DBA/brand name to Sparkle Suite and then resubmit, or whether Telnyx requires a different brand registration/change path to resolve rejection 710?

Thank you,
Louis Chapman
Neon Rabbit Digital Services / Sparkle Suite
```

## External research notes - 2026-05-14

Sources reviewed:

- Telnyx 10DLC Carrier Error Codes Explanations: `https://support.telnyx.com/en/articles/10547022-10dlc-carrier-error-codes-explanations`
- Telnyx 10DLC Campaign Compliance Requirements: `https://support.telnyx.com/en/articles/9940291-10dlc-campaign-compliance-requirements`
- Telnyx 10DLC Campaign Approval Best Practices: `https://support.telnyx.com/en/articles/7127078-10dlc-campaign-approval-best-practices`
- Telnyx Sole Proprietor guide: `https://support.telnyx.com/en/articles/13545282-guide-to-sole-proprietor-10dlc-brand-and-campaign-registration`
- Telnyx developer campaign registration guide: `https://developers.telnyx.com/docs/messaging/10dlc/campaign-registration`
- Twilio A2P 10DLC privacy policy / terms URL changelog: `https://www.twilio.com/en-us/changelog/a2p-10dlc-campaign-registration-will-require-privacy-policy-and-`
- TSG 10DLC Vetting Best Practices: `https://support.tsgglobal.com/hc/en-us/articles/12151417676187-10DLC-Vetting-Best-Practices-Opt-In-Out-Help-Privacy-Policy`
- Telzio 10DLC rejection guide: `https://telzio.com/support/admins/messaging/10dlc/troubleshoting-10dlc-use-case-rejections`
- Reddit field reports from r/Twilio, r/GoHighLevel, r/smallbusiness, and r/VOIP about recent A2P/10DLC approval friction.

Research synthesis:

- Error 710 is consistently defined as a brand/KYC mismatch: the registered brand must be the actual message sender, not an agency, reseller, or software provider behind the sender.
- For sole proprietor campaigns, identity details must match the individual operating the business. Telnyx's sole proprietor path is intended for a single individual without an EIN and includes OTP identity verification.
- Reviewers expect one continuous story across the registered brand, website, campaign description, CTA/message flow, legal links, support contact, sample messages, and sender name.
- Telnyx specifically warns that brand, website, sample messages, use case, and email/company name consistency are review factors.
- Telnyx compliance requirements say SMS opt-in must be text-message-specific and separate from email/phone consent.
- Telnyx says privacy policy and terms links should be included in registration; Twilio's 2026 updates reinforce that dedicated privacy and terms URLs are now a first-class review input across the ecosystem.
- Public web opt-in is easier to verify than verbal opt-in. If verbal opt-in is used, the submitted flow should include the exact script.
- Forum reports are noisy but consistent on one practical point: reviewers behave like they are following a paper trail. If a reviewer cannot see the opt-in checkbox, legal links, brand identity, and message purpose quickly, the campaign is at higher denial risk.
- Reddit reports also warn that support pre-approval is not a guarantee; do not spend the next review until the submission packet is internally self-consistent.

Pre-submit risk flags for this campaign:

- `Neon Rabbit Digital Services` versus `Sparkle Suite` needs one deliberate sender identity strategy. The safest wording depends on the exact KYC record:
  - If the verified sole proprietor/brand is Louis/Neon Rabbit doing business as Sparkle Suite, make that relationship explicit everywhere.
  - If Sparkle Suite is the customer-facing brand, the campaign-facing sender should be Sparkle Suite, with Neon Rabbit only appearing as owner/operator where necessary.
- Avoid any wording that implies Neon Rabbit is an agency texting on behalf of Sparkle Suite as a separate client.
- Do not use `sparkle-suite.vercel.app` in the next submission.
- Do not rely on the verbal consent flow as the primary proof unless it is a real process and includes the exact script.
- Keep message samples away from generic marketing language. Samples should show concrete Sparkle Suite launch/onboarding/support/live-show reminders and include opt-out language.
- If selecting marketing, the CTA/message flow/description must mention marketing. If trying to avoid marketing, remove promotional samples and do not describe marketing updates.
- If embedded links are enabled, include a real production link in at least one sample. If embedded links are not enabled, remove links from all samples and flow text except legal/evidence URLs where required by registration.
- Make sure support email and website domain do not look unrelated. A domain-matched support address such as `hello@yoursparklesuite.com` is preferable if available and working.

Recommended next review sequence before spending another fee:

1. Export or screenshot the exact current KYC/brand fields from Telnyx.
2. Decide the sender identity line:
   - `Sparkle Suite by Neon Rabbit Digital Services`, or
   - `Neon Rabbit Digital Services d/b/a Sparkle Suite`, or
   - another exact legal/trade-name format that matches the Telnyx brand record.
3. Update the campaign description, sample messages, keyword responses, support contact, and public opt-in copy to use that same identity.
4. Capture screenshots of the public waitlist and legal pages after the current code changes are deployed.
5. Send the final draft to `10dlcquestions@telnyx.com` or support and ask whether the KYC identity line resolves rejection `710` before paying for a new review, if Telnyx will answer.
6. Submit only after the KYC identity, public evidence, and samples all match.
