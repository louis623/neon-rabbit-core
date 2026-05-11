export interface SparkleSuitePrelaunchEmailContent {
  subject: string
  text: string
}

function buildPlainTextEmail(blocks: string[]) {
  return blocks.join('\n\n')
}

function normalizeRecipientName(name: string) {
  const normalized = name.trim()
  return normalized || 'there'
}

export function buildPrelaunchWaitlistWelcomeEmailContent(
  name: string,
): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(name)

  return {
    subject: 'Welcome to the Sparkle Suite waitlist',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Thanks for joining the Sparkle Suite waitlist.',
      'We are building Sparkle Suite to help reps create a better customer experience with less patchwork behind the scenes.',
      'We will send occasional prelaunch updates when there is something useful to share, including early feature progress and first-access news.',
      'Reply to this email any time if you want to unsubscribe or ask a question.',
      'Thanks for being early.\n\nSparkle Suite',
    ]),
  }
}

export function buildInitialPrelaunchNewsletterIssue(): SparkleSuitePrelaunchEmailContent {
  return {
    subject: 'A smoother rep setup starts with less patchwork',
    text: buildPlainTextEmail([
      'A better customer experience starts with a better rep setup.',
      'One of the biggest things shaping Sparkle Suite right now is reducing patchwork. Reps should not have to juggle scattered reminders, follow-up notes, and live-show timing just to create a polished customer experience.',
      'That is why the early Sparkle Suite foundation is centered on practical flow: Live event calendar for timing, Email updates and SMS updates for follow-up, and built-in support that stays useful instead of noisy.',
      'We will keep these updates short and worth opening as the prelaunch build moves forward.',
      'If you know a rep who would want these updates too, send them to the prelaunch page to join the waitlist.',
      'Sparkle Suite',
    ]),
  }
}
