export const OPERATOR_ONBOARDING_CHECKLIST_STATUSES = [
  'not_started',
  'in_progress',
  'waiting_on_rep',
  'blocked',
  'complete',
  'not_applicable',
] as const

export type OperatorOnboardingChecklistStatus =
  (typeof OPERATOR_ONBOARDING_CHECKLIST_STATUSES)[number]

export type OperatorOnboardingChecklistItemKey =
  | 'identity_and_customer_placement'
  | 'workspace_access'
  | 'about_section_intake'
  | 'public_site_foundation'
  | 'public_route_proof'
  | 'calendar_and_show_links'
  | 'live_queue_readiness'
  | 'welcome_communication'
  | 'custom_domain_authority'
  | 'custom_domain_vercel'
  | 'custom_domain_dns'
  | 'custom_domain_mapping'
  | 'custom_domain_route_proof'
  | 'custom_domain_brand_assets'
  | 'closeout'

export interface OperatorOnboardingChecklistItemDefinition {
  key: OperatorOnboardingChecklistItemKey
  title: string
  description: string
  optional?: boolean
  defaultStatus?: OperatorOnboardingChecklistStatus
  guidance?: readonly string[]
}

// This is an operator launch ledger, not the rep's self-serve setup state.
// Keep intake answers in the approved About-section workflow, not in this log.
export const OPERATOR_ONBOARDING_CHECKLIST_ITEMS: readonly OperatorOnboardingChecklistItemDefinition[] = [
  { key: 'identity_and_customer_placement', title: 'Confirm customer identity and placement', description: 'Verify the intended rep, active customer classification, and customer record before making launch changes.' },
  { key: 'workspace_access', title: 'Confirm Workspace access', description: 'Verify the customer reaches the intended Workspace/trial or entitlement. Dashboard-unlocked alone is not launch proof.' },
  {
    key: 'about_section_intake',
    title: 'Gather the About-section intake',
    description: 'Ask these five questions, then write the About copy manually. Do not place the customer’s answers in this operator checklist.',
    guidance: [
      'Your origin story: How did you discover Bomb Party, and what made you decide to become a rep?',
      'Your live vibe: What should someone expect in one of your lives—music, energy, style, favorite collections, or anything else?',
      'The big reveal: Any favorite reveals, milestones, unicorns/diamonds, or moments you’d like highlighted?',
      'Just for fun: A few personal details you’re comfortable sharing, such as family, pets, hobbies, interests, or favorite things.',
      'Your promise: What do you want customers to feel when they shop or spend time with you?',
    ],
  },
  { key: 'public_site_foundation', title: 'Set public-site foundation', description: 'Confirm the public slug, Site Settings, shop link, and customer-facing social handles are intentionally configured.' },
  { key: 'public_route_proof', title: 'Prove public site routes', description: 'Check the customer’s Home, Dance Floor, and Join routes, including tenant-specific copy.' },
  { key: 'calendar_and_show_links', title: 'Verify Calendar and show links', description: 'Confirm a named show platform resolves only to that customer’s matching configured social link, in named order.' },
  { key: 'live_queue_readiness', title: 'Check Live Queue readiness', description: 'Confirm the customer can use their intended live-show workflow without relying on an operator session.' },
  { key: 'welcome_communication', title: 'Send welcome and next steps', description: 'Send the customer their approved welcome, access, and support information.' },
  { key: 'custom_domain_authority', title: 'Confirm custom-domain authority', description: 'For a custom domain, confirm the customer has usable registrar/DNS access before changing anything.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'custom_domain_vercel', title: 'Attach custom domain in Vercel', description: 'Attach only the approved customer domain to the intended deployment.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'custom_domain_dns', title: 'Apply narrow DNS changes', description: 'Use only the necessary registrar DNS records; preserve unrelated records and customer aliases.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'custom_domain_mapping', title: 'Verify customer-domain mapping', description: 'Confirm the domain resolves to the intended customer record with an identity guard.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'custom_domain_route_proof', title: 'Prove custom-domain routes', description: 'Check the root and customer subpages on the custom domain, not only the primary page.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'custom_domain_brand_assets', title: 'Verify brand and sharing assets', description: 'Check favicon and social-share metadata on the custom domain; note that external previews can take time to refresh.', optional: true, defaultStatus: 'not_applicable' },
  { key: 'closeout', title: 'Record safe launch proof and closeout', description: 'Record only a concise, non-sensitive proof note and any remaining follow-up. Never put credentials or private customer answers here.' },
]

export interface OperatorOnboardingChecklistEntry {
  itemKey: OperatorOnboardingChecklistItemKey
  status: OperatorOnboardingChecklistStatus
  evidenceSummary: string | null
  updatedAt: string | null
  completedAt: string | null
}

export interface OperatorOnboardingChecklistItem extends OperatorOnboardingChecklistItemDefinition {
  entry: OperatorOnboardingChecklistEntry
}

export function isOperatorOnboardingChecklistItemKey(value: string): value is OperatorOnboardingChecklistItemKey {
  return OPERATOR_ONBOARDING_CHECKLIST_ITEMS.some((item) => item.key === value)
}

export function isOperatorOnboardingChecklistStatus(value: string): value is OperatorOnboardingChecklistStatus {
  return (OPERATOR_ONBOARDING_CHECKLIST_STATUSES as readonly string[]).includes(value)
}

export function buildOperatorOnboardingChecklist(entries: readonly OperatorOnboardingChecklistEntry[] = []): OperatorOnboardingChecklistItem[] {
  const entriesByKey = new Map(entries.map((entry) => [entry.itemKey, entry]))
  return OPERATOR_ONBOARDING_CHECKLIST_ITEMS.map((item) => ({
    ...item,
    entry: entriesByKey.get(item.key) ?? {
      itemKey: item.key,
      status: item.defaultStatus ?? 'not_started',
      evidenceSummary: null,
      updatedAt: null,
      completedAt: null,
    },
  }))
}
