import type { HelpResource } from '@/lib/services/types'

const HELP_RESOURCES: HelpResource[] = [
  {
    id: 'trade-board-basics',
    category: 'Trade board',
    title: 'How the trade board works',
    summary: 'What belongs on your board, what the status labels mean, and how Nic-Nac helps.',
    body:
      'Your trade board is the live list of pieces you are willing to trade. Available means shoppers can request it. Pending trade means a request is in motion. Traded means a swap was completed. Removed means you pulled it down on purpose.',
    quickActions: ['Review active listings', 'Remove a listing', 'Ask Nic-Nac to add a piece'],
  },
  {
    id: 'trade-request-handling',
    category: 'Trade requests',
    title: 'How to approve or deny trade requests',
    summary: 'A quick decision framework for requests that arrive during or after a show.',
    body:
      'Use the request inbox to compare the customer note with your current goals. Approving moves the piece into fulfillment. Denying returns the piece to your available board. If several customers want the same piece, only one request can move forward.',
    quickActions: ['Open request inbox', 'Approve request', 'Deny request'],
  },
  {
    id: 'fulfillment-rhythm',
    category: 'Fulfillment',
    title: 'Keep fulfillment moving',
    summary: 'What the approved, shipped, and completed queue states are for.',
    body:
      'Approved means the trade is committed and needs follow-through. Shipped means it is on the way. Completed means the swap is fully done and can roll into your history metrics. Keep this queue current so your monthly report stays trustworthy.',
    quickActions: ['Review queue', 'Mark shipped', 'Mark completed'],
  },
  {
    id: 'audience-consent',
    category: 'Audience',
    title: 'Consent and outreach guardrails',
    summary: 'Who can still receive email or SMS and what to do after an opt-out.',
    body:
      'Only message customers who are still reachable in the dashboard. If someone has opted out or sent STOP, they need to opt back in themselves. Use the signup form link when a customer wants back in.',
    quickActions: ['Copy signup form link', 'Review reachable customers', 'Open customer roster'],
  },
  {
    id: 'wallet-billing',
    category: 'Billing',
    title: 'SMS wallet and billing basics',
    summary: 'How SMS charges, wallet loads, and monthly billing fit together.',
    body:
      'Manual texts debit the SMS wallet. If the wallet is low, load funds or enable auto-recharge. Monthly platform billing is separate from SMS spend and lives in Account / billing.',
    quickActions: ['Open SMS wallet', 'Manage billing', 'Enable auto-recharge'],
  },
  {
    id: 'site-tweaks',
    category: 'Site settings',
    title: 'Fast site tweaks reps make most often',
    summary: 'Banner text, ticker copy, hero image, join-page visibility, and social handles.',
    body:
      'Site settings are for the fast public-facing tweaks shoppers notice first. Use them when your show cadence changes, your recruitment push changes, or you want cleaner branding without editing code.',
    quickActions: ['Open site settings', 'Update banner text', 'Hide join page'],
  },
]

export function getHelpResources(query = ''): HelpResource[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return HELP_RESOURCES

  return HELP_RESOURCES.filter((resource) =>
    [resource.category, resource.title, resource.summary, resource.body]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  )
}
