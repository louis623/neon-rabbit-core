// Service-layer errors. ServiceError is the canonical class for new code.
// TradeBoardError is preserved as a subclass so the existing tool handlers
// (lib/thumper/tools/list-my-trade-board.ts, lib/thumper/tools/remove-listing.ts)
// keep working without code changes â€” they do `instanceof TradeBoardError` and
// read `err.code`. Both checks survive subclassing.
//
// Tool handlers translate ServiceError â†’ ThumperToolError at the route boundary
// (see lib/thumper/errors.ts). The service layer never references
// ThumperToolError; that's the rule that lets the same service back both the
// chat (Thumper) and HTTP (dashboard) entry points.

export class ServiceError extends Error {
  readonly code: string
  readonly userMessage: string
  readonly statusCode: number

  constructor(args: {
    code: string
    message: string
    userMessage?: string
    statusCode?: number
    cause?: unknown
  }) {
    super(args.message)
    this.name = 'ServiceError'
    this.code = args.code
    this.userMessage = args.userMessage ?? args.message
    this.statusCode = args.statusCode ?? 400
    if (args.cause !== undefined) {
      ;(this as { cause?: unknown }).cause = args.cause
    }
  }
}

// Backward-compat for existing trade-board tool handlers. The legacy two-arg
// constructor signature (code, message) MUST be preserved â€” see the live
// throw sites in `removeListing` below and the original implementation history.
// Empty subclass keeps `instanceof TradeBoardError` working for code that
// already imports the name.
export class TradeBoardError extends ServiceError {
  constructor(
    code: 'LISTING_NOT_FOUND' | 'UNAUTHORIZED' | 'INVALID_INPUT' | string,
    message: string,
    userMessage?: string,
  ) {
    super({ code, message, userMessage })
    this.name = 'TradeBoardError'
  }
}

// ============================================================================
// Predefined error factories. Stable codes for the cross-domain catalog.
// Tool handlers and dashboard routes can pattern-match on these codes.
// ============================================================================

export const errors = {
  MISSING_ITEM_INPUT: () =>
    new ServiceError({
      code: 'MISSING_ITEM_INPUT',
      message: 'itemNumber or listingId required',
      userMessage: 'I need either an item number or listing ID to do that.',
    }),
  MISSING_PIECE_PHOTO: () =>
    new ServiceError({
      code: 'MISSING_PIECE_PHOTO',
      message: 'piece photo URL required when no canonical photo exists',
      userMessage: 'I need a photo of the piece for that listing.',
    }),
  LISTING_PHOTO_PREFLIGHT_FAILED: (coachingMessages: string[]) =>
    new ServiceError({
      code: 'LISTING_PHOTO_PREFLIGHT_FAILED',
      message: `listing photo preflight failed: ${coachingMessages.join(' ')}`,
      userMessage: `That listing photo needs one more try before I can save it. ${coachingMessages.join(' ')}`.trim(),
      statusCode: 422,
    }),
  CLICKWRAP_REQUIRED: (context: 'listing' | 'request' = 'listing') =>
    new ServiceError({
      code: 'CLICKWRAP_REQUIRED',
      message:
        context === 'request'
          ? 'clickwrap acceptance required before submitting request'
          : 'clickwrap acceptance required before listing',
      userMessage:
        context === 'request'
          ? 'You need to accept the trade terms before I can submit that request.'
          : 'You need to confirm you own the piece, the listing details are accurate, and that final trade decisions stay with you before I can list it. MSRP is reference data, not the trade-parity engine.',
    }),
  LISTING_NOT_FOUND: (detail?: string) =>
    new ServiceError({
      code: 'LISTING_NOT_FOUND',
      message: detail ? `listing not found: ${detail}` : 'listing not found',
      userMessage: "I couldn't find that listing on your board.",
    }),
  DUPLICATE_LISTING: (itemNumber: string) =>
    new ServiceError({
      code: 'DUPLICATE_LISTING',
      message: `active listing already exists for item ${itemNumber}`,
      userMessage: `You already have ${itemNumber} listed and available.`,
    }),
  REQUEST_NOT_PENDING: () =>
    new ServiceError({
      code: 'REQUEST_NOT_PENDING',
      message: 'trade request is not in pending status',
      userMessage: 'That trade request has already been handled.',
    }),
  REQUEST_ALREADY_EXISTS: () =>
    new ServiceError({
      code: 'REQUEST_ALREADY_EXISTS',
      message: 'a pending request already exists for this listing',
      userMessage: 'That piece already has a pending trade request.',
      statusCode: 409,
    }),
  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    new ServiceError({
      code: 'INVALID_STATUS_TRANSITION',
      message: `invalid status transition: ${from} â†’ ${to}`,
      userMessage: `I can't move that from "${from}" to "${to}".`,
    }),
  AMBIGUOUS_CUSTOMER: (name: string) =>
    new ServiceError({
      code: 'AMBIGUOUS_CUSTOMER',
      message: `more than one fulfillment matches customer "${name}"`,
      userMessage: `Multiple customers named "${name}" â€” can you give me a request ID?`,
    }),
  FULFILLMENT_NOT_FOUND: () =>
    new ServiceError({
      code: 'FULFILLMENT_NOT_FOUND',
      message: 'fulfillment row not found',
      userMessage: "I couldn't find that fulfillment.",
    }),
  UNAUTHORIZED: (detail?: string) =>
    new ServiceError({
      code: 'UNAUTHORIZED',
      message: detail ? `unauthorized: ${detail}` : 'unauthorized',
      userMessage: "That isn't on your board, so I can't change it.",
      statusCode: 403,
    }),
  INVALID_INPUT: (detail: string, userMessage?: string) =>
    new ServiceError({
      code: 'INVALID_INPUT',
      message: `invalid input: ${detail}`,
      userMessage: userMessage ?? 'I need a bit more information to do that.',
    }),
  NEEDS_COLLECTION: (designId: string, designName: string) =>
    new ServiceError({
      code: 'NEEDS_COLLECTION',
      message: `design ${designId} has no collection`,
      userMessage: `"${designName}" needs a collection name before I can list it.`,
    }),
  NEEDS_FULL_INFO: (itemNumber: string) =>
    new ServiceError({
      code: 'NEEDS_FULL_INFO',
      message: `no design found for item ${itemNumber}`,
      userMessage: `I don't have ${itemNumber} on file yet â€” I'll need the design name and a photo.`,
    }),
  EVENT_NOT_FOUND: () =>
    new ServiceError({
      code: 'EVENT_NOT_FOUND',
      message: 'calendar event not found or not owned by rep',
      userMessage: "I couldn't find that show on your schedule.",
      statusCode: 404,
    }),
  EVENT_NOT_EDITABLE: () =>
    new ServiceError({
      code: 'EVENT_NOT_EDITABLE',
      message: 'event is not in scheduled status and cannot be modified',
      userMessage:
        'That show has already started, finished, or been cancelled â€” I can only edit upcoming scheduled shows.',
      statusCode: 409,
    }),
  EVENT_NOT_CANCELLABLE: () =>
    new ServiceError({
      code: 'EVENT_NOT_CANCELLABLE',
      message: 'event is already completed or cancelled',
      userMessage: 'That show is already done or cancelled.',
      statusCode: 409,
    }),
  EVENT_TIME_PAST: () =>
    new ServiceError({
      code: 'EVENT_TIME_PAST',
      message: 'event time must be in the future',
      userMessage: 'That time is in the past â€” when do you actually want to schedule it?',
      statusCode: 400,
    }),
  MISSING_PLATFORM: () =>
    new ServiceError({
      code: 'MISSING_PLATFORM',
      message: 'platform is required for a show',
      userMessage:
        'Where are you streaming? I need the platform â€” Facebook Live, TikTok, Instagram, etc.',
      statusCode: 400,
    }),
  MISSING_EVENT_TIME: () =>
    new ServiceError({
      code: 'MISSING_EVENT_TIME',
      message: 'event time is required for a show',
      userMessage: 'When is the show? I need a date and time.',
      statusCode: 400,
    }),
  TOO_MANY_DISCOUNT_CODES: () =>
    new ServiceError({
      code: 'TOO_MANY_DISCOUNT_CODES',
      message: 'maximum 10 discount codes per show',
      userMessage:
        "That's a lot of codes! I can handle up to 10 per show - which ones are the most important?",
      statusCode: 400,
    }),
  EMPTY_DISCOUNT_CODE: () =>
    new ServiceError({
      code: 'EMPTY_DISCOUNT_CODE',
      message: 'discount code text cannot be empty',
      userMessage: "One of those codes is blank - what should it say?",
      statusCode: 400,
    }),
  NOT_A_SERIES: () =>
    new ServiceError({
      code: 'NOT_A_SERIES',
      message: 'event is not part of a recurring series',
      userMessage:
        "That show isn't part of a recurring series, so I can only update it individually.",
      statusCode: 400,
    }),
  INVALID_PHONE_NUMBER: () =>
    new ServiceError({
      code: 'INVALID_PHONE_NUMBER',
      message: 'recipient phone must be in E.164 format',
      userMessage:
        'I need the phone number in full international format, like +15551234567.',
      statusCode: 400,
    }),
  CONTENT_SCREENING_BLOCKED: (matchedPhrases: string[]) =>
    new ServiceError({
      code: 'CONTENT_SCREENING_BLOCKED',
      message: `content screening blocked the message: ${matchedPhrases.join(', ')}`,
      userMessage: `I can't send that as written because it uses prohibited recruiting language: ${matchedPhrases.join(', ')}. Try plain product or show language instead.`,
      statusCode: 422,
    }),
  SMS_NOT_CONFIGURED: () =>
    new ServiceError({
      code: 'SMS_NOT_CONFIGURED',
      message: 'Telnyx SMS is not configured',
      userMessage:
        "SMS delivery isn't configured in this environment yet. If this keeps happening, let Louis know.",
      statusCode: 503,
    }),
  INSUFFICIENT_SMS_WALLET: () =>
    new ServiceError({
      code: 'INSUFFICIENT_SMS_WALLET',
      message: 'sms wallet has insufficient funds',
      userMessage:
        "There's not enough in the SMS wallet to send that text right now.",
      statusCode: 402,
    }),
  SMS_DELIVERY_FAILED: (detail?: string) =>
    new ServiceError({
      code: 'SMS_DELIVERY_FAILED',
      message: detail ? `telnyx send failed: ${detail}` : 'telnyx send failed',
      userMessage: detail
        ? `I couldn't send that text: ${detail}. If this keeps happening, let Louis know.`
        : "I couldn't send that text. If this keeps happening, let Louis know.",
      statusCode: 502,
    }),
  SMS_WEEKLY_LIMIT_REACHED: () =>
    new ServiceError({
      code: 'SMS_WEEKLY_LIMIT_REACHED',
      message: 'manual SMS weekly limit reached',
      userMessage: "You've hit your weekly text limit.",
      statusCode: 429,
    }),
  EMAIL_NOT_CONFIGURED: () =>
    new ServiceError({
      code: 'EMAIL_NOT_CONFIGURED',
      message: 'Resend email is not configured',
      userMessage:
        "Email delivery isn't configured in this environment yet. If this keeps happening, let Louis know.",
      statusCode: 503,
    }),
  EMAIL_WEEKLY_LIMIT_REACHED: () =>
    new ServiceError({
      code: 'EMAIL_WEEKLY_LIMIT_REACHED',
      message: 'manual email weekly limit reached',
      userMessage: "You've hit your weekly email limit.",
      statusCode: 429,
    }),
  EMAIL_DELIVERY_FAILED: (detail?: string) =>
    new ServiceError({
      code: 'EMAIL_DELIVERY_FAILED',
      message: detail ? `resend send failed: ${detail}` : 'resend send failed',
      userMessage: detail
        ? `I couldn't send that email: ${detail}. If this keeps happening, let Louis know.`
        : "I couldn't send that email. If this keeps happening, let Louis know.",
      statusCode: 502,
    }),
  AUTOMATION_KEY_REQUIRED: () =>
    new ServiceError({
      code: 'AUTOMATION_KEY_REQUIRED',
      message: 'automation key required for automated message sends',
      userMessage: 'This automated reminder is missing its send key.',
      statusCode: 400,
    }),
  AUTOMATED_MESSAGE_ALREADY_SENT: (channel: 'sms' | 'email') =>
    new ServiceError({
      code: 'AUTOMATED_MESSAGE_ALREADY_SENT',
      message: `automated ${channel} reminder already sent for this show`,
      userMessage:
        channel === 'sms'
          ? 'That automated text reminder already went out for this show.'
          : 'That automated email reminder already went out for this show.',
      statusCode: 409,
    }),
}
