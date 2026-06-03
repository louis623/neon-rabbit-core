import type { ReactNode } from 'react'
import type { RequiredSetupState } from '@/lib/self-serve/required-setup'
import { NicNacGlyph } from './NicNacGlyph'
import styles from './RequiredSetupHome.module.css'

export function RequiredSetupHome({
  state,
  chat,
}: {
  state: RequiredSetupState
  chat: ReactNode
}) {
  const completed = state.completedSteps.length
  const total = state.steps.length
  const progress = total > 0 ? Math.round((completed / total) * 100) : 0
  const currentStep = state.steps.find((step) => step.id === state.currentStep)

  return (
    <main className={styles.root}>
      <section className={styles.hero}>
        <div className={styles.brandRow}>
          <span className={styles.mark}>S</span>
          <div>
            <p>Sparkle Suite</p>
            <h1>Set up with Nic-Nac</h1>
          </div>
        </div>
        <div className={styles.copy}>
          <p className={styles.kicker}>Paid setup</p>
          <h2>One conversation, one step at a time.</h2>
          <p>
            Nic-Nac will shape the public site, teach the workspace, and unlock
            the full dashboard when everything is polished enough to represent
            your business and Sparkle Suite.
          </p>
        </div>
        <div className={styles.progressShell}>
          <div className={styles.progressTopline}>
            <span>{completed} of {total}</span>
            <span>{currentStep?.label ?? 'Setup'}</span>
          </div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
        </div>
      </section>
      <section className={styles.chatPanel} aria-label="Nic-Nac required setup chat">
        <header className={styles.chatHeader}>
          <NicNacGlyph size={34} />
          <div>
            <p>Nic-Nac</p>
            <span className={styles.chatStatus}>Required setup resumes automatically</span>
          </div>
        </header>
        <div className={styles.chatBody}>{chat}</div>
      </section>
    </main>
  )
}
