'use client'

import styles from './RequiredSetupLookPicker.module.css'

const LOCKED_LOOK_MESSAGE =
  'Use the Sparkle Suite/Morganite theme for my customer site.'

export function RequiredSetupLookPicker({
  onChoose,
  disabled = false,
}: {
  onChoose: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Sparkle Suite theme">
      <div className={styles.header}>
        <p className={styles.kicker}>Sparkle Suite theme</p>
        <h2>Sparkle Suite/Morganite is ready</h2>
        <p>
          Sparkle Suite uses one polished Morganite look for every workspace and
          customer site, so setup can stay focused on your name, copy, shows,
          and launch details.
        </p>
      </div>
      <article className={styles.card}>
        <div className={styles.cardTop}>
          <span className={styles.code}>SS-01</span>
          <span className={styles.recommended}>Locked theme</span>
        </div>
        <div className={styles.preview} aria-hidden="true">
          <div
            className={styles.previewHero}
            style={{
              background:
                'linear-gradient(135deg, #fff8fb 0%, #ffe5f2 48%, #f5d1dc 100%)',
            }}
          />
          <div
            className={styles.previewCard}
            style={{
              borderColor: '#f6bdd4',
              background: '#fffafb',
            }}
          >
            <span style={{ background: '#e11d8f' }} />
            <span />
            <span />
          </div>
        </div>
        <div className={styles.copy}>
          <h3>Sparkle Suite/Morganite</h3>
          <p className={styles.styleName}>Warm, polished, and readable</p>
          <p>
            The same Sparkle Suite look is applied to your workspace preview and
            public Amethyst customer site.
          </p>
        </div>
        <div className={styles.swatches} aria-label="Morganite theme colors">
          <span
            className={styles.swatch}
            style={{ background: '#fff8fb' }}
            title="Soft blush"
          />
          <span
            className={styles.swatch}
            style={{ background: '#e11d8f' }}
            title="Sparkle pink"
          />
          <span
            className={styles.swatch}
            style={{ background: '#43231f' }}
            title="Warm cocoa"
          />
        </div>
        <button
          type="button"
          className={styles.choose}
          onClick={() => onChoose(LOCKED_LOOK_MESSAGE)}
          disabled={disabled}
        >
          Continue with Morganite
        </button>
      </article>
    </section>
  )
}
