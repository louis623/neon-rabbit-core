import {
  isAboutNarrativeCopySubmission,
  isAboutSectionCorrection,
} from '@/lib/nic-nac/site-editing-intent'
import { isCalendarReadQueryText } from '@/lib/nic-nac/calendar-read-intent'
import type { NicNacToolIntent } from '@/lib/nic-nac/tools'

type TradeBoardWorkflowForToolChoice = {
  status?: string
  phase?: string
  missing?: string[] | null
  blockers?: string[] | null
  known?: {
    itemNumber?: string | null
    designName?: string | null
    collectionName?: string | null
  } | null
} | null | undefined

type CalendarWorkflowForToolChoice = {
  status?: string
  phase?: string
  intent?: string
  missing?: string[] | null
} | null | undefined

type GenericTradeWorkflowForToolChoice = {
  status?: string
  workflowType?: string
  phase?: string
  intent?: string
  missingFields?: string[] | null
  blockers?: string[] | null
} | null | undefined

export type NicNacStepToolChoice =
  | 'none'
  | 'auto'
  | 'required'
  | {
      type: 'tool'
      toolName:
        | 'add_listing'
        | 'prepare_trade_board_work'
        | 'prepare_calendar_work'
        | 'add_show'
        | 'remove_listing'
        | 'list_my_trade_board'
        | 'list_my_shows'
        | 'search_jewelry_database'
        | 'get_trade_requests'
        | 'get_trade_swap_cleanup'
        | 'get_fulfillment_queue'
        | 'approve_trade'
        | 'approve_trade_swap'
        | 'reject_trade'
        | 'update_fulfillment_status'
        | 'report_jewelry_catalog_issue'
        | 'update_site_setting'
    }

export function chooseNicNacToolChoiceForStep(args: {
  requireToolCall: boolean
  stepsLength: number
  activeToolNames: string[]
  latestToolIntents?: NicNacToolIntent[]
  routedToolIntents?: NicNacToolIntent[]
  activeTradeBoardWorkflow?: TradeBoardWorkflowForToolChoice
  activeTradeWorkflow?: GenericTradeWorkflowForToolChoice
  activeCalendarWorkflow?: CalendarWorkflowForToolChoice
  latestUserText?: string
  previousAssistantText?: string
}): NicNacStepToolChoice {
  if (args.stepsLength > 0) return 'auto'
  if (
    args.activeToolNames.includes('list_my_shows') &&
    (args.activeCalendarWorkflow?.intent === 'list_shows' ||
      isCalendarReadQueryText(args.latestUserText ?? ''))
  ) {
    return { type: 'tool', toolName: 'list_my_shows' }
  }
  const pinnedTradeTool = chooseGenericTradeWorkflowTool(
    args.activeTradeWorkflow,
    args.activeToolNames,
  )
  if (pinnedTradeTool) return { type: 'tool', toolName: pinnedTradeTool }

  const pinnedTradeReadTool = chooseGenericTradeWorkflowReadTool(
    args.activeTradeWorkflow,
    args.activeToolNames,
  )
  if (pinnedTradeReadTool) {
    return { type: 'tool', toolName: pinnedTradeReadTool }
  }

  if (
    args.activeToolNames.includes('get_trade_requests') &&
    textAsksForTradeRequestInbox(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'get_trade_requests' }
  }
  if (
    args.activeToolNames.includes('get_fulfillment_queue') &&
    textAsksForFulfillmentQueue(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'get_fulfillment_queue' }
  }
  if (
    args.activeToolNames.includes('get_trade_swap_cleanup') &&
    textAsksForSwapCleanup(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'get_trade_swap_cleanup' }
  }
  if (
    args.activeToolNames.includes('search_jewelry_database') &&
    textAsksForCatalogLookup(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'search_jewelry_database' }
  }
  if (
    args.activeToolNames.includes('list_my_trade_board') &&
    textAsksForCurrentDanceFloor(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'list_my_trade_board' }
  }
  if (!args.requireToolCall) {
    // The Workspace keeps its complete tool catalog available, but a purely
    // conversational turn does not need the provider to evaluate tool calls.
    // Explicitly disabling tools for that first step also avoids a provider
    // edge case where `auto` with the full catalog can finish at `length`
    // before producing any tokens. Routed intents still retain optional tool
    // use, and required/workflow turns continue through the pinning rules.
    return shouldAllowOptionalToolSelection(args) ? 'auto' : 'none'
  }
  if (
    args.activeToolNames.includes('update_site_setting') &&
    (isAboutNarrativeCopySubmission({
      latestUserText: args.latestUserText ?? '',
      previousAssistantText: args.previousAssistantText ?? '',
    }) ||
      isAboutSectionCorrection({
        latestUserText: args.latestUserText ?? '',
        previousAssistantText: args.previousAssistantText ?? '',
      }))
  ) {
    return { type: 'tool', toolName: 'update_site_setting' }
  }
  if (
    args.activeToolNames.includes('add_listing') &&
    (tradeBoardWorkflowIsReadyToAdd(args.activeTradeBoardWorkflow) ||
      tradeBoardWorkflowHasDuplicatePhysicalConfirmation(args))
  ) {
    return { type: 'tool', toolName: 'add_listing' }
  }
  if (
    args.activeToolNames.includes('add_show') &&
    calendarWorkflowIsReadyToAdd(args.activeCalendarWorkflow)
  ) {
    return { type: 'tool', toolName: 'add_show' }
  }
  if (
    args.activeToolNames.includes('prepare_calendar_work') &&
    args.latestToolIntents?.includes('calendar') &&
    !args.latestToolIntents.includes('trade_board')
  ) {
    return { type: 'tool', toolName: 'prepare_calendar_work' }
  }
  if (
    args.activeToolNames.includes('prepare_trade_board_work') &&
    (args.routedToolIntents?.includes('trade_board') ?? true)
  ) {
    return { type: 'tool', toolName: 'prepare_trade_board_work' }
  }

  return 'required'
}

function chooseGenericTradeWorkflowReadTool(
  workflow: GenericTradeWorkflowForToolChoice,
  activeToolNames: string[],
): Extract<NicNacStepToolChoice, { type: 'tool' }>['toolName'] | null {
  if (workflow?.status !== 'active') return null
  if ((workflow.missingFields?.length ?? 0) === 0) return null

  const toolName =
    workflow.workflowType === 'trade_board_remove_listing'
      ? 'list_my_trade_board'
      : workflow.workflowType === 'trade_request_decision' ||
          workflow.workflowType === 'trade_swap_capture'
        ? 'get_trade_requests'
        : workflow.workflowType === 'trade_fulfillment_update'
          ? 'get_fulfillment_queue'
          : workflow.workflowType === 'trade_swap_cleanup'
            ? 'get_trade_swap_cleanup'
            : workflow.workflowType === 'trade_catalog_correction'
              ? 'search_jewelry_database'
              : null

  return toolName && activeToolNames.includes(toolName) ? toolName : null
}

function shouldAllowOptionalToolSelection(args: {
  routedToolIntents?: NicNacToolIntent[]
  latestUserText?: string
}) {
  const intents = args.routedToolIntents ?? []
  if (intents.some((intent) => intent !== 'memory')) return true
  if (!intents.includes('memory')) return false

  // `memory` is also the router's harmless fallback when no product intent
  // matches. Preserve optional memory lookup for real show/follow-up language,
  // while treating greetings and ordinary conversation as tool-free turns.
  return /\b(?:live|shows?|post[- ]?show|after the live|current[- ]?show|follow[- ]?up|promise|remember|queue)\b/i.test(
    args.latestUserText ?? '',
  )
}

function chooseGenericTradeWorkflowTool(
  workflow: GenericTradeWorkflowForToolChoice,
  activeToolNames: string[],
): Extract<NicNacStepToolChoice, { type: 'tool' }>['toolName'] | null {
  if (
    workflow?.status !== 'active' ||
    (workflow.missingFields?.length ?? 0) > 0 ||
    (workflow.blockers?.length ?? 0) > 0
  ) {
    return null
  }

  const toolName =
    workflow.phase === 'ready_to_remove'
      ? 'remove_listing'
      : workflow.phase === 'ready_to_reject'
        ? 'reject_trade'
        : workflow.phase === 'ready_to_approve' &&
            workflow.workflowType === 'trade_swap_capture'
          ? 'approve_trade_swap'
          : workflow.phase === 'ready_to_approve'
            ? 'approve_trade'
            : workflow.phase === 'ready_to_update' &&
                workflow.workflowType === 'trade_fulfillment_update'
              ? 'update_fulfillment_status'
              : workflow.phase === 'ready_to_update' &&
                  workflow.workflowType === 'trade_swap_cleanup'
                ? 'add_listing'
                : workflow.phase === 'ready_to_report'
                  ? 'report_jewelry_catalog_issue'
                  : null

  return toolName && activeToolNames.includes(toolName) ? toolName : null
}

function tradeBoardWorkflowHasDuplicatePhysicalConfirmation(args: {
  activeTradeBoardWorkflow?: TradeBoardWorkflowForToolChoice
  latestUserText?: string
  previousAssistantText?: string
}): boolean {
  const workflow = args.activeTradeBoardWorkflow
  return (
    workflow?.status === 'active' &&
    (workflow.missing ?? []).length === 1 &&
    workflow.missing?.[0] === 'jewelryFrontPhoto' &&
    (workflow.blockers?.length ?? 0) === 0 &&
    Boolean(workflow.known?.itemNumber) &&
    textIsAffirmative(args.latestUserText ?? '') &&
    textAsksDuplicatePhysicalPieceQuestion(args.previousAssistantText ?? '')
  )
}

function calendarWorkflowIsReadyToAdd(
  workflow: CalendarWorkflowForToolChoice,
): boolean {
  return (
    workflow?.status === 'active' &&
    workflow.phase === 'ready_to_add' &&
    (workflow.missing?.length ?? 0) === 0
  )
}

function textIsAffirmative(text: string): boolean {
  return /\b(yes|yep|yeah|yup|correct|right|exactly|please|do\s+it|go\s+ahead)\b/i.test(
    text,
  )
}

function textAsksDuplicatePhysicalPieceQuestion(text: string): boolean {
  return (
    /\balready\s+on\s+your\s+(?:Dance\s+Floor|Trade\s+Board)\b/i.test(text) &&
    /\b(?:another|second|additional|extra)\s+(?:identical\s+)?physical\s+piece\b/i.test(text) &&
    (/(?:\b(?:same|that\s+same)\s+design\b)/i.test(text) || /\bidentical\b/i.test(text))
  )
}

function textAsksForTradeRequestInbox(text: string): boolean {
  return (
    /\btrade\s+requests?\b/i.test(text) ||
    /\bpending\b[\s\S]{0,80}\brequests?\b/i.test(text) ||
    /\brequests?\b[\s\S]{0,60}\binbox\b/i.test(text) ||
    /\binbox\b[\s\S]{0,60}\brequests?\b/i.test(text)
  )
}

function textAsksForFulfillmentQueue(text: string): boolean {
  return (
    /\bfulfillment\s+queue\b/i.test(text) ||
    /\b(?:active|pending|open)\b[\s\S]{0,50}\bfulfillments?\b/i.test(text) ||
    /\b(?:what|which|show|list)\b[\s\S]{0,60}\b(?:needs?|need)\b[\s\S]{0,30}\b(?:ship|shipping|complete|fulfill)/i.test(text)
  )
}

function textAsksForSwapCleanup(text: string): boolean {
  return (
    /\b(?:post[- ]?show\s+)?swap\s+cleanup\s+(?:queue|list|items?)\b/i.test(text) ||
    /\b(?:show|open|list)\b[\s\S]{0,60}\bswap\s+cleanup\b/i.test(text)
  )
}

function textAsksForCatalogLookup(text: string): boolean {
  return (
    /\b(?:open|show|find|look\s*up|search|check)\b[\s\S]{0,80}\b(?:jewelry\s+)?(?:database|catalog)\b/i.test(text) ||
    /\b(?:database|catalog)\b[\s\S]{0,80}\b(?:record|details?|item)\b/i.test(text)
  )
}

function textAsksForCurrentDanceFloor(text: string): boolean {
  return (
    /\b(?:show|list|open|what(?:'s| is)|which)\b[\s\S]{0,80}\b(?:my|the|current)\b[\s\S]{0,30}\b(?:dance\s*floor|trade\s*board|board)\b/i.test(text) &&
    !/\b(?:add|put|place|post|remove|take\s+down|restore)\b/i.test(text)
  )
}

function tradeBoardWorkflowIsReadyToAdd(
  workflow: TradeBoardWorkflowForToolChoice,
): boolean {
  return (
    workflow?.status === 'active' &&
    workflow.phase === 'ready_to_add' &&
    (workflow.missing?.length ?? 0) === 0 &&
    (workflow.blockers?.length ?? 0) === 0
  )
}
