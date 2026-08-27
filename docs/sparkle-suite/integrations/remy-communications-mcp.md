# Remy Communications MCP

## Purpose

Remy can monitor the Sparkle Suite Communications Center without receiving a
Control Center user account or its broad operator privileges. The integration
is intentionally limited to read-only triage and non-persistent drafts.

Endpoint after production release:

`https://www.yoursparklesuite.com/api/remy/mcp`

## What Remy can do

- Read minimized Support Inbox summaries and Support reports.
- Read only reported Rep Network items in Network Safety.
- Read official broadcast history and delivery counts.
- Prepare support-reply, broadcast, and Task List candidate drafts.
- Send one Support reply only after the exact draft has received a recorded,
  one-time internal-operator approval.

## What Remy cannot do

- Sign into the Control Center or use its session cookie.
- Open a customer conversation, mark a conversation read, download an attachment,
  change a support status, publish a broadcast, moderate a report,
  suspend a rep, or create/promote a Task List item.
- Access billing, accounts, customer-site settings, deployment controls, or any
  unreported private Rep Network conversation.

Every successful tool call is recorded in
`remy_communications_agent_audit_events` with a request digest and resource IDs.
Raw request bodies, message bodies, attachments, and credentials are not written
to that audit table. The service is rate-limited to 60 calls per minute.

## One-time operator setup

1. Generate a long, random secret in the team password manager. Do not reuse a
   Control Center password or a Supabase/Vercel credential.
2. Set it in Vercel Production as `REMY_MCP_BEARER_TOKEN`. Optionally set
   `REMY_MCP_ALLOWED_ORIGINS` to a comma-separated list of approved browser
   origins; by default only `https://grok.com` and `https://www.grok.com` are
   accepted when an Origin header is present. Server-to-server calls without an
   Origin header remain supported.
3. In Grok, go to **Connectors → New Connector → Custom**, enter the endpoint
   above, and configure its Bearer token using the secret. Treat the token as a
   service credential, never as a prompt or chat message.
4. Ask Remy to call `communications_get_inbox_summary` first. Confirm that only
   the ten listed tools are available and that no Control Center credentials
   were supplied.
5. Keep all external actions in the human Control Center workflow: review a
   draft, review recipients, and make the final action deliberately.

## Tool contract

| Tool | Purpose | Effect |
| --- | --- | --- |
| `communications_get_inbox_summary` | Support Inbox triage | Read-only |
| `communications_list_support_reports` | Report queue triage | Read-only |
| `communications_get_support_report` | One minimized report | Read-only |
| `communications_list_network_safety_queue` | Reported Rep Network queue | Read-only |
| `communications_list_broadcasts` | Official broadcast history | Read-only |
| `communications_draft_support_reply` | Prepare a reply | Draft only |
| `communications_request_support_reply_approval` | Request one-time approval for the exact reply | No message sent |
| `communications_send_approved_support_reply` | Send only the exact approved reply | One-time approved send |
| `communications_draft_broadcast` | Prepare a broadcast and count audience | Draft only |
| `communications_draft_task_candidate` | Prepare Task List candidate | Draft only |

## Human approval boundary

For a simple Support reply, Remy first prepares the exact text and asks for
approval. The operator then approves that exact text in **Control Center →
Messages → Remy approvals**. The approval expires after 15 minutes and permits
one send only; Remy cannot alter the text after it was approved. A "yes" inside
an external agent chat is not itself the authority to send because Sparkle
Suite cannot independently verify who typed it.

Remy must always hand off the following to a human operator in Control Center:

- Publishing an official broadcast.
- Changing a Support report status or resolving it.
- Promoting a report to the live Task List.
- Moderating, dismissing, blocking, or suspending any Rep Network participant.

This preserves Sparkle Suite's intentional broadcast confirmation flow and
keeps Network Safety decisions with a responsible human operator.
