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
  const consultUrl = process.env.SPARKLE_PRELAUNCH_CONSULT_URL?.trim()

  return {
    subject: 'Welcome to the Sparkle Suite waitlist',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Thanks for joining the Sparkle Suite waitlist.',
      'We are building Sparkle Suite to help reps create a better customer experience with less patchwork behind the scenes.',
      'Here is the path from here: we confirm your waitlist spot, review your fit, schedule the first consult, build your setup profile, send the agreement and Stripe test-mode checkout when you are ready, then move the account into the build checklist before launch.',
      consultUrl
        ? `If you are ready to book the first consult, use this link: ${consultUrl}`
        : 'When we are ready to schedule the first consult, we will email you with the next step. You can also reply here any time.',
      'Reply to this email any time if you want to unsubscribe or ask a question.',
      'Thanks for being early.\n\nSparkle Suite',
    ]),
  }
}

export function buildPrelaunchConsultOutreachEmailContent(
  name: string,
): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(name)
  const consultUrl = process.env.SPARKLE_PRELAUNCH_CONSULT_URL?.trim()

  return {
    subject: 'Next step for your Sparkle Suite consult',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Your Sparkle Suite account flow is ready for the first consult step.',
      consultUrl
        ? `Please choose a consult time here: ${consultUrl}`
        : 'Reply with a couple of times that work for you and we will get the consult scheduled.',
      'On the consult, we will confirm your setup, pricing path, agreement, payment, and launch checklist before build work starts.',
      'Sparkle Suite',
    ]),
  }
}

export function buildPrelaunchConsultScheduledEmailContent(input: {
  name: string
  scheduledAt: string
  meetingUrl?: string | null
  notes?: string | null
}): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(input.name)
  const meetingUrl = input.meetingUrl?.trim()
  const notes = input.notes?.trim()

  return {
    subject: 'Your Sparkle Suite consult is scheduled',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      `Your Sparkle Suite consult is scheduled for ${input.scheduledAt}.`,
      meetingUrl ? `Meeting link: ${meetingUrl}` : 'We will send or confirm the meeting link before the consult.',
      notes ? `Notes: ${notes}` : '',
      'After the consult, we will confirm your setup profile, agreement, payment, build checks, and launch handoff.',
      'Sparkle Suite',
    ].filter(Boolean)),
  }
}

export function buildPrelaunchPaymentCheckoutEmailContent(input: {
  name: string
  checkoutUrl: string
  pricingTier?: string | null
}): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(input.name)
  const tierLine =
    input.pricingTier === 'founder'
      ? 'This checkout uses the first-20 founder pricing path.'
      : 'This checkout uses the current Sparkle Suite pricing path.'

  return {
    subject: 'Your Sparkle Suite checkout link',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Your Sparkle Suite checkout link is ready.',
      tierLine,
      input.checkoutUrl,
      'After checkout, we will finish the agreement/build checks and move your account toward launch.',
      'Sparkle Suite',
    ]),
  }
}

export function buildPrelaunchAccountReadyEmailContent(input: {
  name: string
  accountUrl: string
}): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(input.name)

  return {
    subject: 'Your Sparkle Suite account is ready',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Your Sparkle Suite account has been connected and is ready for review.',
      `Open Nic-Nac here: ${input.accountUrl}`,
      'Use the login details provided during launch handoff. If anything looks off, reply to this email before we move the account into live use.',
      'Sparkle Suite',
    ]),
  }
}

export function buildSelfServePurchaseConfirmationEmailContent(input: {
  name: string
  backendUrl: string
  publicSiteUrl?: string | null
  helpUrl: string
}): SparkleSuitePrelaunchEmailContent {
  const recipientName = normalizeRecipientName(input.name)
  const publicSiteUrl = input.publicSiteUrl?.trim()

  return {
    subject: 'Your Sparkle Suite workspace is ready',
    text: buildPlainTextEmail([
      `Hi ${recipientName},`,
      'Thanks for purchasing Sparkle Suite. Your backend workspace is ready, and Nic-Nac will guide the rest of your setup from inside the workspace.',
      `Open your backend workspace: ${input.backendUrl}`,
      publicSiteUrl
        ? `Your public Sparkle Suite site: ${publicSiteUrl}`
        : 'Your public Sparkle Suite site link will appear in the workspace as soon as it is available.',
      `Use the help/how-to hub for walkthroughs: ${input.helpUrl}`,
      'Start with the setup walkthrough, then use the videos for Nic-Nac, site editing, shows, trade board, calculator, and the Chrome extension / Live Queue overview when you need them.',
      'Louis only needs to step in if something gets escalated. Otherwise, Nic-Nac and the help/how-to hub are your first stop.',
      'Sparkle Suite',
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
