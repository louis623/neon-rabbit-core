import type { TradeBoardIntakePromptState } from './trade-board-intake-types'

export function renderTradeBoardIntakePromptState(
  state: TradeBoardIntakePromptState | null,
): string {
  if (!state) return ''

  const known = Object.entries(state.known)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `- ${key}: ${value}`)
    .join('\n')
  const photos = state.photos
    .map(
      (photo) =>
        `- photo ${photo.index}: declaredRole=${photo.declaredRole}, visualRole=${photo.visualRole}, roleConfirmed=${photo.roleConfirmed}, quality=${photo.quality}${
          photo.notes.length ? `, notes=${photo.notes.join('; ')}` : ''
        }`,
    )
    .join('\n')

  return [
    'Active workflow: trade_board_add_listing',
    `Workflow id: ${state.workflow.id}`,
    `Workflow status: ${state.workflow.status}`,
    `Workflow phase: ${state.workflow.phase}`,
    known ? `Known details:\n${known}` : 'Known details: none yet',
    photos ? `Photos:\n${photos}` : 'Photos: none yet',
    `Missing: ${state.missing.length ? state.missing.join(', ') : 'none'}`,
    `Blockers: ${state.blockers.length ? state.blockers.join(', ') : 'none'}`,
    `Next action: ${state.nextAction}`,
    `Hard rules:\n${state.hardRules.map((rule) => `- ${rule}`).join('\n')}`,
  ].join('\n')
}
