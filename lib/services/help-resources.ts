import type { HelpResource } from '@/lib/services/types'

const HELP_RESOURCES: HelpResource[] = [
  {
    id: 'getting-started-after-purchase',
    category: 'Getting started',
    title: 'Getting started after purchase',
    summary: 'The first path after checkout: open the backend, meet Nic-Nac, and work through setup.',
    body:
      'After purchase, use your confirmation email to open the backend workspace. Nic-Nac will guide the setup checklist from inside the workspace, and this help hub holds the walkthroughs when you want to watch a step before doing it.',
    quickActions: ['Open backend workspace', 'Start setup checklist', 'Watch setup walkthrough'],
    video: {
      title: 'Getting started / setup walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'meet-nic-nac',
    category: 'Nic-Nac',
    title: 'Meet Nic-Nac and how to ask for help',
    summary: 'How to use Nic-Nac as the first stop for setup, site edits, and workflow questions.',
    body:
      'Nic-Nac is your Sparkle Suite assistant inside the backend workspace. Ask plain-English questions, ask for help changing site settings, or ask what to do next. If something needs Louis or Neon Rabbit support, Nic-Nac should help gather the details for escalation.',
    quickActions: ['Ask Nic-Nac what to do next', 'Ask for a site edit', 'Start an escalation'],
    video: {
      title: 'How to use Nic-Nac',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'backend-workspace-tour',
    category: 'Backend workspace',
    title: 'Backend workspace tour',
    summary: 'Where the main Sparkle Suite tools live once the rep logs in.',
    body:
      'The backend workspace is the home base for setup, shows, trade board work, customer roster, calculator, billing, site settings, and help. Use the left-side workspace sections to move between tools, then ask Nic-Nac when you want help taking action.',
    quickActions: ['Open workspace tour', 'Review workspace sections', 'Ask Nic-Nac for directions'],
    video: {
      title: 'Backend workspace tour',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'public-site-editing',
    category: 'Site settings',
    title: 'Editing the public site, copy, links, and skin',
    summary: 'How to change the customer-facing details shoppers see first.',
    body:
      'Use Site Settings for public-facing updates such as display name, business name, banner text, ticker text, tagline, hero image, social links, join-page visibility, and skin preset. These changes should feel like normal setup, not a custom build request.',
    quickActions: ['Open site settings', 'Choose skin preset', 'Update public links'],
    video: {
      title: 'Public site editing walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'shows-and-trade-board',
    category: 'Shows and trade board',
    title: 'Adding and updating shows; Managing trade board content',
    summary: 'How shows and trade board setup fit together before the rep goes live.',
    body:
      'Add upcoming shows in the calendar, then keep trade board pieces current so customers can request available pieces. Nic-Nac can help create shows, update show details, explain listing status, and guide trade request handling.',
    quickActions: ['Add a show', 'Open trade board', 'Ask Nic-Nac to explain status'],
    video: {
      title: 'Shows and trade board walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'calculator-walkthrough',
    category: 'Calculator',
    title: 'Using the calculator',
    summary: 'How to estimate monthly and single-show goals from the backend workspace.',
    body:
      'The business calculator helps estimate show revenue, costs, inventory flow, and take-home planning. Use it as a planning guide, then adjust assumptions when your show cadence, order volume, or costs change.',
    quickActions: ['Open calculator', 'Estimate monthly take-home', 'Estimate one show'],
    video: {
      title: 'Calculator walkthrough',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'chrome-extension-live-queue-overview',
    category: 'Live Queue',
    title: 'Chrome extension and Live Queue overview',
    summary: 'Why the Chrome extension exists and how it supports the public Live Queue.',
    body:
      'The Chrome extension connects the Bomb Party Party Orders page to Sparkle Suite so the public site can show the live reveal queue. Reps do not need implementation details; they need to know why the extension is there, how to confirm it is on, and when to ask for help if the queue looks stale or empty.',
    quickActions: ['Watch extension overview', 'Check extension status', 'Review Live Queue help'],
    video: {
      title: 'Chrome extension / Live Queue overview',
      provider: 'youtube',
      status: 'placeholder',
    },
  },
  {
    id: 'setup-troubleshooting-escalation',
    category: 'Troubleshooting',
    title: 'Troubleshooting and escalation',
    summary: 'What to try first and when Nic-Nac should package the issue for Louis or support.',
    body:
      'Start by checking the relevant help resource, then ask Nic-Nac to walk through the setup step. Escalate only when the rep is blocked, something appears broken, or a change needs Neon Rabbit support. Include the page, account, action attempted, and any visible error.',
    quickActions: ['Ask Nic-Nac to troubleshoot', 'Gather support details', 'Escalate to support'],
  },
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
  {
    id: 'live-queue-setup',
    category: 'Live Queue',
    title: 'Set up the Live Queue extension',
    summary:
      'How your sync code, Party Filter, and extension status work before a live show.',
    body:
      'The Live Queue extension reads your Bomb Party Party Orders page and sends unrevealed first names to your Sparkle Suite site. You enter your Sparkle Suite sync code in the extension once, then confirm the extension status is on and recently synced before you go live. Use Party Filter when you only want one party synced from a busy dashboard. Nic-Nac can help you find the right setup steps, but the rep confirms the sync code, chooses the Party Filter, and watches the status before show time.',
    quickActions: ['Check extension status', 'Confirm sync code', 'Set Party Filter'],
  },
  {
    id: 'live-queue-troubleshooting',
    category: 'Live Queue',
    title: 'Fix stale or empty Live Queue states',
    summary:
      'What to check when the queue is stale, empty, missing names, or not matching the show.',
    body:
      'A stale queue usually means the extension has not synced recently, Chrome is closed, the Bomb Party Party Orders tab is not open, or the saved sync code does not match Sparkle Suite. An empty queue can be correct when every order is revealed, no orders match the Party Filter, or the current party has no unrevealed rows. The rep should confirm the BP tab, extension status, sync code, and Party Filter first. If the queue is still stale or empty after that, ask Nic-Nac to help gather the status details for Louis or Neon Rabbit support.',
    quickActions: ['Review stale queue', 'Review empty queue', 'Ask Nic-Nac for help'],
  },
  {
    id: 'live-queue-rollout',
    category: 'Live Queue',
    title: 'Understand Web Store and unpacked install readiness',
    summary:
      'Why repo-ready extension work is separate from Chrome Web Store approval and rep rollout.',
    body:
      'The extension can be ready in the Sparkle Suite repo before every rep has the Web Store version. Web Store approval, rep rollout, and a verified installed copy are separate launch steps. During review, Louis or Neon Rabbit may provide an unpacked install for emergency or supervised testing, but reps should use the approved Web Store version for normal shows when it is available. Nic-Nac can explain the difference, while Louis or Neon Rabbit owns packaging, Web Store submission, approval checks, and rollout instructions.',
    quickActions: ['Check Web Store status', 'Review unpacked install note', 'Ask Nic-Nac what to use'],
  },
]

export function getHelpResources(query = ''): HelpResource[] {
  const normalized = query.trim().toLowerCase()
  if (!normalized) return HELP_RESOURCES

  return HELP_RESOURCES.filter((resource) =>
    [
      resource.category,
      resource.title,
      resource.summary,
      resource.body,
      ...resource.quickActions,
      resource.video?.title ?? '',
      resource.video?.status ?? '',
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized),
  )
}
