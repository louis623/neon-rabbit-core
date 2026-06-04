'use client'

import styles from './RequiredSetupPreviewPanel.module.css'

export function RequiredSetupPreviewPanel({
  previewHref,
  onApprove,
  disabled = false,
}: {
  previewHref: string
  onApprove: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section
      className={styles.panel}
      aria-label="Final customer-facing website preview"
    >
      <p className={styles.kicker}>Final review</p>
      <h2>Preview your customer-facing website</h2>
      <p>
        Open your preview, review the Look, welcome copy, About section,
        schedule, and links, then approve it here.
      </p>
      <a
        className={styles.previewLink}
        href={previewHref}
        target="_blank"
        rel="noreferrer"
      >
        Open preview
      </a>
      <button
        type="button"
        onClick={() =>
          onApprove(
            'I approve the customer-facing website preview. Unlock my Sparkle Suite Workspace.',
          )
        }
        disabled={disabled}
      >
        Approve preview and unlock workspace
      </button>
    </section>
  )
}
