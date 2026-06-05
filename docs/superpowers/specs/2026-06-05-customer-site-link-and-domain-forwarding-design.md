# Sparkle Suite Customer Site Link and Domain Forwarding Decision

Date: 2026-06-05
Status: locked for launch

## Decision

Sparkle Suite customer-facing sites use a simple path-based public link by default:

```text
yoursparklesuite.com/{show-link}
```

Example:

```text
yoursparklesuite.com/gracie
```

Workspace access remains centralized:

```text
yoursparklesuite.com/login
```

After login, the authenticated rep is routed to their own Sparkle Suite workspace.

## Launch Scope

The launch product includes one primary customer-facing show link per rep. This link is intended to be easy to say, print, type, and later convert into QR assets without adding launch complexity.

The public show link should be case-insensitive, with a lowercase canonical URL and optional display formatting in UI or printed guidance.

## Reserved Paths

The show-link namespace must reserve system paths before reps can claim handles. At minimum, reserve:

```text
login
logout
admin
api
support
pricing
start
terms
privacy
nic-nac
workspace
dashboard
account
settings
help
docs
```

## Custom Domain Policy

Custom domains are not part of the default launch setup.

If a rep already owns a domain, they may forward it through their registrar to their Sparkle Suite show link:

```text
https://yoursparklesuite.com/{show-link}
```

This is self-managed by the rep and their domain provider. Sparkle Suite should provide help-center instructions explaining ordinary URL forwarding and clearly warn against masked forwarding.

Sparkle Suite does not buy, renew, hold, or manage rep-owned domains for the base product.

## Paid Help Boundary

If a rep needs hands-on help with domain forwarding or a true custom domain connection, that is paid support or a future premium service.

Launch positioning:

```text
Your Sparkle Suite show link is included. If you already own a domain, you can forward it to your show link through your domain provider. If you want us to help configure it, custom domain assistance is available as a paid support service.
```

## Nic-Nac Role

Nic-Nac should not walk reps through DNS or forwarding step-by-step inside the workspace.

Nic-Nac may point reps to the official help article for forwarding their own domain and may explain the boundary:

- The included Sparkle Suite show link is ready to use.
- Domain forwarding is managed by the rep's domain provider.
- Paid support is available if they want Sparkle Suite help.

## Deferred Ideas

The Live Link Kit is a future enhancement, not launch scope.

Deferred ideas include:

- QR code generation
- Business card QR assets
- TikTok overlay PNGs
- Live show screen badges
- Printed card upsells
- Automated branding packages

These ideas remain useful, but they should not block launch.

## Rationale

This decision follows the KISS principle. The path-based show link avoids default subdomains that may look awkward on business cards, avoids cheesy platform URLs, and avoids custom-domain support burden for every rep.

The forwarding option gives reps who already own domains a low-friction path without making Sparkle Suite responsible for registrar support. True custom domain setup can remain a paid concierge option later.
