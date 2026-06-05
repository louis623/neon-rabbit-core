# Required Setup Checkout Smoke

Use this when testing the real landing page lead flow through Stripe sandbox checkout into Nic-Nac required setup. This is separate from reviewer smoke reset; reviewer reset is useful for iterating setup copy, but it does not prove the real Stripe origin/auth handoff.

## Stable Preview

Open:

```text
https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app
```

## Safe Test Identity

Use a fresh fake account each run:

```text
Name: Gracie Smoke
Email: smoke.rep.<timestamp>@example.com
Password: SparkleSmoke!2026
```

Use fake Stripe sandbox billing details:

```text
Card: 4242 4242 4242 4242
Expiration: 12/34
CVC: 123
Address: 123 Smoke Test Lane, Aurora, CO 80014
Phone: 201-555-0123
```

Do not use personal information. Do not use live Stripe credentials.

## Expected Path

1. Landing page loads on the stable preview host.
2. `/start` opens the real account creation path, not the reviewer shortcut.
3. Email signup creates the account and redirects to Stripe sandbox checkout.
4. Stripe checkout completes with the test card.
5. Stripe returns to the same stable preview host:

```text
https://sparkle-suite-git-codex-sparkle-cro-d70670-louis-2849s-projects.vercel.app/nic-nac?onboarding=required-setup&billing=subscription-success&session_id=...
```

6. Nic-Nac shows required setup for the new paid account.
7. The page must not show `Demo Rep`, `Sparkle Suite Demo`, `Reviewer preview`, or `Reset setup preview`.
8. The first reply to Nic-Nac sends successfully.
9. When Live Queue setup is reached, Nic-Nac provides the Chrome Extension Store link and the saved Live Queue sync code.
10. The Live Queue sync code uses the approved format, such as `GFF-7342`; Nic-Nac must not invent a long ID or a Fizz-style code.
11. The rep should be told the code stays saved at the top of the Sparkle Suite Workspace for future use.
12. After final approval and unlock, the Sparkle Suite Workspace topbar shows the same saved Live Queue sync code.

## Targeted Customer-Site No-Demo-Data Gate

Before approving the final preview for a targeted customer site such as `?c=<repId>` or a custom-domain route, verify:

- No `Sparkle by Sasha`, `Sasha Rivera`, `Jane`, or `Jane's Sparkle Party`.
- No fake Trade Board listings or ticker pieces.
- No fake Live Queue customer names.
- No fake upcoming shows.
- No hard-coded `Tuesday 8pm CST` schedule.
- No fake Join Team members.
- Title, meta description, and JSON-LD match the new rep.
- Empty Trade Board and Live Queue sections use honest neutral empty states until real data exists.
- Customer signup and unsubscribe requests preserve the targeted rep query.

## Failure Capture

If the flow fails, capture these before resetting:

- Final Stripe return URL.
- `/api/stripe/sync` response status/body.
- `/api/self-serve/setup-state` response status/body.
- `/api/nic-nac` response status/body.
- Whether `Demo Rep`, `Sparkle Suite Demo`, `Reviewer preview`, or `Reset setup preview` appears.
- The Live Queue sync code shown, if any.

## Safety Notes

- Stripe sandbox only.
- No live customer email or SMS sends during required setup.
- Do not modify Chrome Web Store settings.
- Do not modify Sparkle Suite Chrome extension files or live-show systems.
