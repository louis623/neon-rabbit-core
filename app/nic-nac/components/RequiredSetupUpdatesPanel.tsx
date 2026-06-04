'use client'

import styles from './RequiredSetupUpdatesPanel.module.css'

export function RequiredSetupUpdatesPanel({
  onSend,
  disabled = false,
}: {
  onSend: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Email and SMS update readiness">
      <div className={styles.header}>
        <p className={styles.kicker}>Required setup</p>
        <h2>Email and SMS update readiness</h2>
        <p>
          Checkout does not text or email customers automatically. Required
          setup only confirms that your Sparkle Suite Workspace is ready for
          opted-in updates later.
        </p>
      </div>
      <ul className={styles.checks}>
        <li>Review how customers opt in before they receive updates.</li>
        <li>Confirm email and SMS updates can be prepared after setup.</li>
        <li>No live customer messages are sent during required setup.</li>
      </ul>
      <div className={styles.actions}>
        <button
          type="button"
          onClick={() =>
            onSend(
              'I understand email and SMS update readiness. No live customer messages should be sent during setup.',
            )
          }
          disabled={disabled}
        >
          Confirm update readiness
        </button>
        <button
          type="button"
          className={styles.secondary}
          onClick={() =>
            onSend('I need help with email and SMS update setup. Please notify support.')
          }
          disabled={disabled}
        >
          I need help with update setup
        </button>
      </div>
    </section>
  )
}
