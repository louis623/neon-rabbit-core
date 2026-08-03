import { NicNacGlyph } from './NicNacGlyph'
import styles from './NicNacHeader.module.css'

export function NicNacHeader({
  onClose,
  onNewConversation,
  onRefreshConversation,
  newConversationDisabled,
  closeLabel,
}: {
  onClose?: () => void
  onNewConversation?: () => void
  onRefreshConversation?: () => void
  newConversationDisabled?: boolean
  closeLabel?: string
}) {
  return (
    <header className={styles.header}>
      <div className={styles.titleGroup}>
        <NicNacGlyph size={20} />
        <span className={styles.title}>Nic-Nac</span>
      </div>
      <div className={styles.actions}>
        {onRefreshConversation ? (
          <button
            type="button"
            onClick={onRefreshConversation}
            className={styles.refreshBtn}
            aria-label="Refresh conversation"
            disabled={newConversationDisabled}
            title="Refresh conversation"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M11.75 5.5 A5 5 0 1 0 12 7 M11.75 1.75 V 5.5 H8"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
        {onNewConversation ? (
          <button
            type="button"
            onClick={onNewConversation}
            className={styles.newBtn}
            aria-label="New conversation"
            disabled={newConversationDisabled}
            title="New conversation"
          >
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M7 1.5 V 12.5 M 1.5 7 H 12.5"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className={styles.closeBtn}
            aria-label={closeLabel ?? 'Close Nic-Nac'}
          >
            <svg width="18" height="18" viewBox="0 0 14 14" aria-hidden="true">
              <path
                d="M2 2 L12 12 M12 2 L2 12"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </header>
  )
}
