export interface HardFailMatch {
  id: string
  phrase: string
}

export const TRADE_BOARD_INTAKE_HARD_FAIL_PATTERNS: Array<{
  id: string
  phrase: string
  pattern: RegExp
}> = [
  {
    id: 'cannot_add_listings',
    phrase: "I can't actually add listings",
    pattern: /\bi\s+can(?:no|')?t\s+actually\s+add\s+listings\b/i,
  },
  {
    id: 'manual_workspace_add',
    phrase: 'Log into your workspace and add it manually',
    pattern: /\blog\s+into\s+your\s+workspace\b[\s\S]{0,120}\badd\s+it\s+manually\b/i,
  },
  {
    id: 'earrings_photo_needs_after_label',
    phrase: 'The photo of the earrings needs',
    pattern: /\bthe\s+photo\s+of\s+the\s+earrings\s+needs\b/i,
  },
  {
    id: 'unboxed',
    phrase: 'Unboxed',
    pattern: /\bunboxed\b/i,
  },
  {
    id: 'plain_background',
    phrase: 'Plain background',
    pattern: /\bplain\s+background\b/i,
  },
  {
    id: 'packaging_too_prominent',
    phrase: 'Packaging is too prominent',
    pattern: /\bpackaging\s+is\s+too\s+prominent\b/i,
  },
  {
    id: 'manual_backend_add',
    phrase: 'Have Louis add it manually on the backend',
    pattern:
      /\b(?:escalate|send|hand|route)[\s\S]{0,80}\b(?:louis|backend|support|team)\b[\s\S]{0,160}\badd\s+it\s+manually\b|\badd\s+it\s+manually\b[\s\S]{0,160}\b(?:backend|louis|support|team)\b/i,
  },
  {
    id: 'without_box_or_card',
    phrase: 'Without the box or card',
    pattern: /\bwithout\s+(?:the\s+)?(?:box|card|box\s+or\s+card|card\s+or\s+box)\b/i,
  },
  {
    id: 'plain_surface',
    phrase: 'Plain surface',
    pattern: /\bplain\s+surface\b/i,
  },
  {
    id: 'direct_photo_link',
    phrase: 'Direct link to a photo',
    pattern:
      /\bdirect\s+(?:image\s+)?link\b[\s\S]{0,120}\b(?:photo|image|picture|cloud)\b|\b(?:photo|image|picture)\b[\s\S]{0,120}\bdirect\s+(?:image\s+)?link\b/i,
  },
  {
    id: 'cloud_photo_link',
    phrase: 'Cloud link',
    pattern: /\bcloud\s+link\b/i,
  },
  {
    id: 'photo_url_request',
    phrase: 'Photo URL',
    pattern: /\bphoto\s+url\b/i,
  },
  {
    id: 'escalate_to_louis',
    phrase: 'Escalate this to Louis',
    pattern: /\bescalate\s+this\s+to\s+louis\b/i,
  },
  {
    id: 'backend_preflight_rejection',
    phrase: 'Backend preflight rejection',
    pattern:
      /\b(?:system|backend)[\s\S]{0,80}\breject(?:ing|ed|s)?\b[\s\S]{0,120}\b(?:photo|image|preflight)\b|\bpreflight\s+stage\b/i,
  },
  {
    id: 'backend_not_under_control',
    phrase: 'Backend validation is not under my control',
    pattern:
      /\bbackend\s+validation\b[\s\S]{0,120}\bnot\s+under\s+my\s+control\b|\bnot\s+under\s+my\s+control\b[\s\S]{0,120}\bbackend\s+validation\b/i,
  },
  {
    id: 'flag_to_louis',
    phrase: 'Flag this for Louis',
    pattern: /\bflag\s+this\s+for\s+louis\b/i,
  },
  {
    id: 'photo_quality_settings',
    phrase: 'Photo quality settings',
    pattern: /\bphoto\s+quality\s+settings\b/i,
  },
  {
    id: 'escalate_to_team',
    phrase: 'Escalate this to the team',
    pattern: /\bescalate\s+this\s+to\s+the\s+team\b/i,
  },
]

export function detectTradeBoardIntakeHardFails(text: string): {
  count: number
  matches: HardFailMatch[]
} {
  const matches = TRADE_BOARD_INTAKE_HARD_FAIL_PATTERNS.filter((entry) =>
    entry.pattern.test(text),
  ).map(({ id, phrase }) => ({ id, phrase }))

  return {
    count: matches.length,
    matches,
  }
}

export function summarizeHardFailDetection(texts: string[]): {
  count: number
  phrases: string[]
} {
  const seen = new Map<string, string>()
  for (const text of texts) {
    for (const match of detectTradeBoardIntakeHardFails(text).matches) {
      seen.set(match.id, match.phrase)
    }
  }

  return {
    count: seen.size,
    phrases: Array.from(seen.values()),
  }
}
