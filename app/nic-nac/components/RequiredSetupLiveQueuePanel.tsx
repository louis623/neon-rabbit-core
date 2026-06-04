'use client'

import { LIVE_QUEUE_CHROME_EXTENSION_URL } from '@/lib/nic-nac/live-queue-extension'
import styles from './RequiredSetupLiveQueuePanel.module.css'

export function RequiredSetupLiveQueuePanel({
  syncCode,
  onSend,
  disabled = false,
}: {
  syncCode: string | null
  onSend: (message: string) => void
  disabled?: boolean
}) {
  const hasSyncCode = Boolean(syncCode?.trim())

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
        <span>Live Queue sync code</span>
        <strong>{hasSyncCode ? syncCode : 'Not assigned yet'}</strong>
      </div>
      {!hasSyncCode ? (
        <p className={styles.blockedNote}>
          Nic-Nac needs support to assign your Live Queue sync code before this
          step can be completed.
        </p>
      ) : null}
      <ol className={styles.steps}>
        <li>
          <a
            className={styles.storeLink}
            href={LIVE_QUEUE_CHROME_EXTENSION_URL}
            target="_blank"
            rel="noreferrer"
          >
            Open Sparkle Suite Live Queue in the Chrome Extension Store
          </a>
          .
        </li>
        <li>Enter this sync code in the extension.</li>
        <li>Open your Bomb Party Party Orders page.</li>
        <li>Confirm the Party Filter for the show you want synced.</li>
        <li>Check Live Queue status before moving on.</li>
      </ol>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() => onSend('I connected Live Queue and confirmed it is syncing.')}
          disabled={disabled || !hasSyncCode}
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
