import {
  isAboutNarrativeCopySubmission,
  isAboutSectionCorrection,
} from '@/lib/nic-nac/site-editing-intent'
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
  | 'auto'
  | 'required'
  | {
      type: 'tool'
      toolName:
        | 'add_listing'
        | 'prepare_trade_board_work'
        | 'add_show'
        | 'remove_listing'
        | 'get_trade_requests'
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
  routedToolIntents?: NicNacToolIntent[]
  activeTradeBoardWorkflow?: TradeBoardWorkflowForToolChoice
  activeTradeWorkflow?: GenericTradeWorkflowForToolChoice
  activeCalendarWorkflow?: CalendarWorkflowForToolChoice
  latestUserText?: string
  previousAssistantText?: string
}): NicNacStepToolChoice {
  if (args.stepsLength > 0) return 'auto'
  if (!args.requireToolCall) return 'auto'
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
  const pinnedTradeTool = chooseGenericTradeWorkflowTool(
    args.activeTradeWorkflow,
    args.activeToolNames,
  )
  if (pinnedTradeTool) return { type: 'tool', toolName: pinnedTradeTool }
  if (
    args.activeToolNames.includes('add_show') &&
    calendarWorkflowIsReadyToAdd(args.activeCalendarWorkflow)
  ) {
    return { type: 'tool', toolName: 'add_show' }
  }
  if (
    args.activeToolNames.includes('get_trade_requests') &&
    textAsksForTradeRequestInbox(args.latestUserText ?? '')
  ) {
    return { type: 'tool', toolName: 'get_trade_requests' }
  }
  if (
    args.activeToolNames.includes('prepare_trade_board_work') &&
    (args.routedToolIntents?.includes('trade_board') ?? true)
  ) {
    return { type: 'tool', toolName: 'prepare_trade_board_work' }
  }

  return 'required'
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
