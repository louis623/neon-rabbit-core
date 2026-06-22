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

export type NicNacStepToolChoice =
  | 'auto'
  | 'required'
  | { type: 'tool'; toolName: 'add_listing' | 'prepare_trade_board_work' }

export function chooseNicNacToolChoiceForStep(args: {
  requireToolCall: boolean
  stepsLength: number
  activeToolNames: string[]
  activeTradeBoardWorkflow?: TradeBoardWorkflowForToolChoice
  latestUserText?: string
  previousAssistantText?: string
}): NicNacStepToolChoice {
  if (args.stepsLength > 0) return 'auto'
  if (!args.requireToolCall) return 'auto'
  if (
    args.activeToolNames.includes('add_listing') &&
    (tradeBoardWorkflowIsReadyToAdd(args.activeTradeBoardWorkflow) ||
      tradeBoardWorkflowHasDuplicatePhysicalConfirmation(args))
  ) {
    return { type: 'tool', toolName: 'add_listing' }
  }
  if (args.activeToolNames.includes('prepare_trade_board_work')) {
    return { type: 'tool', toolName: 'prepare_trade_board_work' }
  }

  return 'required'
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

function textIsAffirmative(text: string): boolean {
  return /\b(yes|yep|yeah|yup|correct|right|exactly|please|do\s+it|go\s+ahead)\b/i.test(
    text,
  )
}

function textAsksDuplicatePhysicalPieceQuestion(text: string): boolean {
  return (
    /\balready\s+on\s+your\s+Trade\s+Board\b/i.test(text) &&
    /\b(?:another|second|additional|extra)\s+physical\s+piece\b/i.test(text) &&
    /\b(?:same|that\s+same)\s+design\b/i.test(text)
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
