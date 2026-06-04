import styles from './Chips.module.css'
import type { NicNacChatMode } from './EmptyGreeting'

const WORKSPACE_CHIP_LABELS = ["What's on my board?", 'Remove a listing']

export function Chips({
  visible,
  onPick,
  disabled,
  mode = 'workspace',
}: {
  visible: boolean
  onPick: (text: string) => void
  disabled?: boolean
  mode?: NicNacChatMode
}) {
  if (!visible) return null
  if (mode === 'required_setup') return null
  const labels = WORKSPACE_CHIP_LABELS

  return (
    <div className={styles.row} role="group" aria-label="Suggested prompts">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          className={styles.chip}
          onClick={() => onPick(label)}
          disabled={disabled}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
