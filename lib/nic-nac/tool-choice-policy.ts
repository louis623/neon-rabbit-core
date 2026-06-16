type TradeBoardWorkflowForToolChoice = {
  status?: string
  phase?: string
  missing?: string[] | null
  blockers?: string[] | null
} | null | undefined

export type NicNacStepToolChoice =
  | 'auto'
  | 'required'
  | { type: 'tool'; toolName: 'add_listing' }

export function chooseNicNacToolChoiceForStep(args: {
  requireToolCall: boolean
  stepsLength: number
  activeToolNames: string[]
  activeTradeBoardWorkflow?: TradeBoardWorkflowForToolChoice
}): NicNacStepToolChoice {
  if (args.stepsLength > 0) return 'auto'
  if (!args.requireToolCall) return 'auto'
  if (
    args.activeToolNames.includes('add_listing') &&
    tradeBoardWorkflowIsReadyToAdd(args.activeTradeBoardWorkflow)
  ) {
    return { type: 'tool', toolName: 'add_listing' }
  }

  return 'required'
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
