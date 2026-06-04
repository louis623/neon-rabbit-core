'use client'

import styles from './RequiredSetupLiveQueuePanel.module.css'

export function RequiredSetupLiveQueuePanel({
  extensionCode,
  onSend,
  disabled = false,
}: {
  extensionCode: string
  onSend: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Live Queue setup">
      <div className={styles.header}>
        <p className={styles.kicker}>Required setup</p>
        <h2>Set up Live Queue</h2>
        <p>
          Live Queue needs to be connected before your Sparkle Suite Workspace is
          unlocked. If anything blocks setup, Nic-Nac will gather the details
          and notify support.
        </p>
      </div>
      <div className={styles.codeBox}>
        <span>Extension code</span>
        <strong>{extensionCode}</strong>
      </div>
      <ol className={styles.steps}>
        <li>Install or open the Sparkle Suite Chrome extension.</li>
        <li>Enter this extension code in the extension.</li>
        <li>Open your Bomb Party Party Orders page.</li>
        <li>Confirm the Party Filter for the show you want synced.</li>
        <li>Check Live Queue status before moving on.</li>
      </ol>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onSend('I connected Live Queue and confirmed it is syncing.')}
          disabled={disabled}
        >
          Live Queue is connected
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() =>
            onSend('I need help with Live Queue setup. Please notify support.')
          }
          disabled={disabled}
        >
          I need help with Live Queue setup
        </button>
      </div>
    </section>
  )
}
