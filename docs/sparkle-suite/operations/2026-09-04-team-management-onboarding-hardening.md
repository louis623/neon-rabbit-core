# Team Management onboarding hardening operator guide

Status: implementation and PR review only. No production invite was created, no
customer domain or Vercel alias was moved, and no ChatGPT Site was provisioned by
this change.

## Product boundaries

- Public Join Team remains the customer-site `/join` page.
- Private New Rep Onboarding remains a token-scoped ChatGPT Sites experience.
- Business/site name and managed team name are separate. For example,
  `BlingKitchen` is Heather's business while `Opal Sparkling Gems` is her team.
- The product name in Sparkle Suite is **Team Management**.

## ChatGPT Sites provision step that remains manual

Sparkle Suite does not yet have a supported ChatGPT Sites provisioning API. Before
enabling invite creation for a lead, an operator must:

1. Create or approve a ChatGPT Site for that lead's onboarding experience using
   approved source content and a hostname that identifies the lead. Do not reuse
   `brittwithbling-start-strong.louis526569.chatgpt.site` for new links.
2. Configure `TEAM_ONBOARDING_BASE_URL` with that exact HTTPS Site URL.
3. Configure `TEAM_ONBOARDING_ALLOWED_ORIGINS` with every Site origin that must
   call Sparkle Suite. Existing published Sites, including a legacy Site retained
   for compatibility, work only when their exact origin is listed here.
4. Leave `TEAM_ONBOARDING_CUSTOM_DOMAIN_ENABLED=false` unless the optional
   `onboarding.yoursparklesuite.com` host has separately been approved and
   provisioned. This work does not create or change DNS.
5. Build and test the app after the environment change. Invite creation fails
   closed when the base is missing, invalid, retired, or outside the allowed
   origins.

The generated visible address adds the new rep's first name, the sending lead's
first name, and the managed team slug when available, then carries the opaque
token only in `?invite=`. Email addresses and phone numbers are rejected from URL
identity fields. Automating one ChatGPT Site per lead/recruit remains a future
provider integration; this PR does not pretend that hook exists.

The public endpoint limiter is intentionally a bounded, best-effort process-local
guard, consistent with other public Sparkle Suite routes. A future distributed
limiter can strengthen multi-instance enforcement without changing the endpoint
contract.

## Safe local/reviewer smoke checklist for Louis

Start the app locally with reviewer smoke mode enabled, then open
`http://localhost:3001/start` and choose **Open workspace preview**. This uses
the synthetic **Britt Test Rep** persona and seeds Team Management entitlement
`manual_beta`. Do not use a real recruit and do not send a link.

1. Sign in as the synthetic lead and open **Workspace → Team Management**.
2. Save a hidden fake team-member card with first name `Alex`.
3. Select **Create onboarding link**. Expected: the visible address contains
   `alex`, the sending lead's first name, and the managed team slug when set; it
   uses the approved ChatGPT Sites base and `?invite=<opaque token>`. It must not
   use Louis's retired Britt host.
4. Open the link in a private reviewer browser. Expected: Alex and the lead/team
   display identity appear; no internal IDs appear in the network response.
5. Mark one onboarding step complete. Expected: the same participant remains and
   the progress count updates in Team Management.
6. Submit a harmless fake question. Expected: it appears through the **Message
   Center → Team** onboarding conversation and the Team Management card shows the
   unread/activity state.
7. Preview the public Join Team page. Expected: it shows real visible card content,
   or clearly says no additional public team cards exist. If no official recruiting
   link is connected, it asks visitors to contact the lead and shows no dead or fake
   starter-pack CTA.
8. Choose **Remove** on the fake public card. Expected: a permanent-removal confirm
   appears. Cancel once to prove no change, then confirm in resettable reviewer data.
   The card is removed while linked onboarding history remains preserved.

Reset by returning to `http://localhost:3001/start` and choosing **Open workspace
preview** again. The reviewer reset deletes that synthetic persona's onboarding
conversations and their child messages first, then onboarding participants and
public team cards before reseeding the workspace. Never run this checklist
against a real customer or real recruit without Louis's explicit instruction.
