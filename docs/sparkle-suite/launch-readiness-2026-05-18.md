# Sparkle Suite Launch Readiness - 2026-05-18

## Ready for demo

- Operator runbook: `docs/sparkle-suite/demo-launch-runbook-2026-05-18.md`.
- Browser smoke walkthrough: `docs/sparkle-suite/browser-smoke-walkthrough-2026-05-18.md`.
- Stripe subscription checkout and billing portal routes now return actionable configuration errors and use the authenticated rep identity for checkout metadata.
- Stripe webhook handling has focused coverage for signature-gated subscription updates.
- SignWell agreement onboarding can build a sandbox payload and blocks live sends unless `SIGNWELL_ALLOW_LIVE_SEND=true`.
- Demo account seed planning is repeatable by `DEMO_REP_EMAIL`, includes 2 upcoming shows, 10 listings, 5 audience members, and no live-provider actions.
- `npm run smoke:demo -- --category local_static` now executes a provider-free static smoke check against the demo seed shape.
- `npm run smoke:demo -- --category local_static --json` emits a machine-readable report without env secrets or dotenv noise.
- `npm run smoke:demo -- --category supabase_demo --json` has been run for `louis+sparkle-demo@neonrabbit.net`; it seeded the account and verified demo login/read access.
- `npm run smoke:demo -- --category local_app --json` has been run against `http://localhost:3000`; it verified `/api/nic-nac/me` and the `/nic-nac` shell for the demo rep.
- `npm run stripe:demo-price -- --json` created Stripe test monthly price `price_1TYTAZHRBK3pZpO2b6WQ8kUl` without checkout or charge.
- `npm run smoke:demo -- --category stripe_test --json` passed when `STRIPE_PRICE_MONTHLY=price_1TYTAZHRBK3pZpO2b6WQ8kUl` was set in the shell.
- `npm run smoke:launch -- --categories local_static,stripe_test --json --write-report` is available for a repeatable safe aggregate smoke report.
- `npm run smoke:demo -- --category stripe_local_routes --json` passed against `http://localhost:3000`, creating Stripe test-mode checkout and portal sessions only.
- Vercel env now has `STRIPE_PRICE_MONTHLY=price_1TYTAZHRBK3pZpO2b6WQ8kUl` in Development and Preview for `codex/sparkle-cross-phase-hardening`.
- Protected Vercel Preview `https://sparkle-suite-2chlrqw8y-louis-2849s-projects.vercel.app` passed demo auth, Nic-Nac shell, Stripe test checkout session, and Stripe test portal session smoke through authenticated `vercel curl`.
- Vercel env now has `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`, and `SIGNWELL_TEMPLATE_ID` in Development and Preview for `codex/sparkle-cross-phase-hardening`.
- `npm run smoke:demo -- --category signwell_sandbox --json` passed for `louis+sparkle-demo@neonrabbit.net`, building a non-sending payload with `send_email=false`.
- `npm run smoke:demo -- --category stripe_test --json` validates test-mode Stripe config without creating a checkout session.
- Latest local browser attempt on 2026-05-18 reached the `/nic-nac` shell but stopped before Stripe browser checkout because the browser session was not authenticated as the demo rep.
- Latest safe aggregate smoke report `.local/launch-smoke-results/launch-local-2026-05-18T20-02-36-150Z.json` passed `local_static` and `stripe_test`; `signwell_sandbox` was blocked locally by missing SignWell env names in this workspace session.

## P0 launch blockers

- Telnyx 10DLC approval is still pending. Do not attach `+19044383050` or send live SMS until campaign approval and number attachment are confirmed.
- Live Stripe readiness is not claimed. Use test mode first; production keys and a small live smoke need explicit Louis approval.
- Live SignWell sends are not approved. Sandbox/dry-run payloads are ready, but real agreements require explicit Louis approval.
- Paid Nic-Nac provider smoke is blocked by default and requires `NIC_NAC_ALLOW_PAID_SMOKE=true` plus a capped request count.

## P1 onboarding blockers

- First demo login smoke uses the built-in demo password unless `DEMO_REP_PASSWORD` is set. Rotate or set a custom demo password before sharing the account outside Louis.
- Stripe test-mode checkout/portal still needs the current Louis-approved demo rep credential in the local environment, or explicit approval to rotate/reset the demo account password, before an end-to-end browser smoke can continue.
- Production Vercel `STRIPE_PRICE_MONTHLY` is intentionally not set yet; verify production `STRIPE_SECRET_KEY` mode or explicitly approve production test-mode setup before adding it there.
- Browser checkout walkthrough is documented but still needs a final manual pass with the current demo password, Louis/Vercel SSO for protected preview, and test-mode Stripe only.
- Vercel Deployment Protection remains enabled for browser access; CLI smoke can use authenticated `vercel curl`, while browser walkthrough still needs Louis/Vercel SSO.
- Local SignWell sandbox smoke needs `SIGNWELL_API_KEY`, `SIGNWELL_API_BASE_URL`, and `SIGNWELL_TEMPLATE_ID` in the current shell or `.env.local` before it can be included in the local aggregate launch smoke again.
- SignWell browser walkthrough/live send is still not approved. Keep `SIGNWELL_ALLOW_LIVE_SEND` unset unless Louis explicitly approves recipient, template, and timing.

## P2 post-launch polish

- Manual browser walkthrough remains; the latest local browser attempt is blocked on current demo credential access, while earlier command-side route smoke had verified demo auth and Nic-Nac loading.
- Add a compact admin view link list for the demo rep once Louis chooses the first-user launch scope.

## Provider status

- Stripe: test-mode route readiness implemented; live mode parked behind explicit approval.
- SignWell: sandbox/dry-run payload readiness implemented and previously passed; current local aggregate smoke needs SignWell env names restored before re-running that category. Live send remains parked behind `SIGNWELL_ALLOW_LIVE_SEND=true` and explicit approval.
- Telnyx: live SMS parked until 10DLC approval and number attachment.
- Nic-Nac: paid smoke parked behind explicit paid-smoke env gates and request cap.
- Supabase: demo seed and login/read smoke passed for `louis+sparkle-demo@neonrabbit.net`; visible counts were reps=1, listings=10, shows=2, audience=5.

## Recommended first-user launch scope

- Launch with one seeded demo rep first.
- Smoke order has previously completed through SignWell sandbox payload smoke; the current local browser phase is blocked on demo credential access and local SignWell env availability.
- Keep SMS live sends, live SignWell sends, live Stripe charges, and paid Nic-Nac smoke out of the first pass unless Louis approves each provider scope separately.
