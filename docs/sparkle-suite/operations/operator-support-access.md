# Transparent Operator Support Access

## Purpose

Operator support access lets an authorized Sparkle Suite Control Center
operator help one eligible rep without asking for or using that rep's password.
It is a separate, time-limited support session. It does not create a rep Auth
session and it does not replace the operator's own account.

The feature is deliberately transparent:

- the exact rep receives a Message Center notice before access becomes active;
- the Workspace always shows a persistent support-mode banner;
- every session is retained, including read-only sessions;
- every attempted account mutation is tied to the operator, target rep,
  support session, capability, request ID, time, and result;
- the rep receives a completion notice and can review support-access history in
  their Account area.

## Operator workflow

1. Sign in to **Control Center** with the existing operator-only session.
2. Open the exact rep's customer profile.
3. In **Transparent support access**, review any active or recent sessions.
4. Select **Start support access**.
5. Choose the customer-service reason and enter a short, customer-safe note.
   Do not include passwords, credentials, payment information, private links,
   shipping addresses, or unnecessary customer data.
6. Confirm the frozen rep name and email in the dialog.
7. Select **Notify rep and start support access**.
8. Wait for the Workspace to open. If the start notice cannot be published to
   that one rep, access does not activate.
9. Work only inside the amber **Support mode** Workspace. Use the public-site
   link for visual review and return to the support Workspace for edits.
10. Select **End support access** when the task is complete. State whether
    anything changed. If something changed, enter a customer-safe completion
    summary.
11. Confirm the session appears in Control Center history with its final status
    and the rep's completion notice is recorded.

Support sessions expire automatically. A closed or expired session cannot be
reopened; start a newly disclosed session if more work is needed.

## Allowed support areas

The support Workspace can expose explicitly classified, target-scoped account
setup work:

- Workspace identity and required setup state;
- customer-site settings, media, and recipes;
- Dance Floor, jewelry-library, trade, fulfillment, and cleanup workflows;
- show calendar viewing;
- non-messaging team setup workflows;
- a read-only customer list with export, edit, unsubscribe, and outreach
  controls removed.

Routes are denied by default. Adding a new Workspace route does not make it
available to support access; its method, capability, and risk classification
must be reviewed and added explicitly.

## Always unavailable

Support access cannot view or change:

- billing, subscriptions, pricing, checkout, payments, Stripe objects, or SMS
  wallet funding;
- passwords, authentication, account ownership, or security settings;
- private Message Center, Support, Rep Network, or Nic-Nac conversation
  content;
- outbound email, SMS, team messages, Rep Network messages, or support reports
  sent as the rep;
- Live Queue codes or Chrome extension state;
- customer exports or bulk contact copying;
- Guardian, Sparkle Lab runs, deployments, DNS, production configuration, or
  Grok Bot/MCP control.

Public customer sites remain ordinary public pages. Opening one does not grant
support authority; all account edits must stay inside the active support
Workspace.

## Safe reviewer smoke

Do not use Louis's personal account or a real customer's account for release
acceptance. Use an eligible synthetic reviewer rep created for Sparkle Suite
review. Do not enter live billing or payment flows.

### Read-only pass

1. Start access for the exact synthetic reviewer target with reason
   **Troubleshooting** and a clearly labeled reviewer-smoke note.
2. Verify the start notice has exactly one recipient before the Workspace
   opens.
3. Verify the amber banner names the operator and target and shows an expiry.
4. Open customer-site setup, Dance Floor, calendar, and the read-only customer
   list.
5. Verify Account/billing, messages, Nic-Nac chat, Live Queue code, exports,
   customer edit controls, and outbound actions are absent or blocked.
6. Open the synthetic public customer site in a separate tab and confirm it is
   unchanged.
7. End access with **No account changes**.
8. Verify one completion notice and one immutable session-history entry.

### Audited mutation pass

Only run this pass against resettable synthetic data.

1. Reset or reseed the synthetic reviewer Workspace through its established
   reviewer-smoke reset path.
2. Start a new support session for that same frozen target.
3. Make one reversible customer-site text change and one reversible inventory
   change.
4. Refresh after each change and confirm the result without repeating an
   uncertain request.
5. Attempt one blocked billing URL and one blocked outbound route; both must
   return a support-action denial and must not call a provider.
6. End access with **Yes, I made a change** and a customer-safe summary.
7. Verify the audit contains attempted and final outcomes for both mutations,
   the blocked attempts, and the session close.
8. Verify the rep receives exactly one completion notice whose changed status
   agrees with the durable mutation evidence.
9. Reseed/reset the synthetic reviewer Workspace and confirm no smoke data
   remains.

## Failure handling

- If the start notice fails, confirm the pending session closed as failed. Do
  not work from its URL.
- If activation fails after the start notice, verify the correction notice was
  published or queued for retry.
- If a mutation says its audit outcome is unconfirmed, refresh and inspect the
  account. Do not repeat the action blindly.
- If a session expires or the operator/target becomes ineligible, return to
  Control Center. Do not try to revive the old URL.
- If the completion notice is temporarily unavailable, the existing Workspace
  message automation job retries the idempotent notice.
- If an established account unexpectedly reaches checkout, stop and follow the
  production account-safety incident procedure before opening checkout.

## Release checklist

Before release:

1. Verify the allowlisted repo, remote, branch, and exact HEAD.
2. Review all other unreleased source already present on the branch and obtain
   any separate release authorization it requires.
3. Run focused support tests, the standard suite, changed-file lint, the
   production build, and `supabase db push --dry-run`.
4. Apply only the reviewed operator-support migration.
5. Manually deploy the exact verified branch tip to the Sparkle Suite Vercel
   project.
6. Confirm both `https://www.yoursparklesuite.com` and
   `https://yoursparklesuite.com` resolve to that exact deployment.
7. Run the safe reviewer smoke above on the exact live domain.
8. Confirm ordinary rep sign-in, Workspace navigation, representative customer
   sites, and existing Control Center/MCP behavior still work.
9. Verify no live charge, DNS change, customer/provider side effect, or Live
   Queue extension change occurred.
