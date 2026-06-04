'use client'

import { AMETHYST_SKIN_CARDS } from '@/lib/amethyst/skin-cards'
import styles from './RequiredSetupLookPicker.module.css'

const LOOK_LABELS: Record<string, string> = {
  amethyst: 'Original Sparkle',
  sparkle_suite_morganite: 'Warm + Polished',
  black_diamond: 'Dark + Dramatic',
  rose_gold: 'Soft Jewelry Polish',
  garnet: 'Bold Boutique Red',
  amber: 'Bright + Energetic',
  velvet: 'Purple Boutique',
  rose_quartz: 'Fun Pink Sparkle',
}

const RECOMMENDED_LOOK_ID = 'sparkle_suite_morganite'

export function RequiredSetupLookPicker({
  onChoose,
  disabled = false,
}: {
  onChoose: (message: string) => void
  disabled?: boolean
}) {
  return (
    <section className={styles.panel} aria-label="Customer-site Look options">
      <div className={styles.header}>
        <p className={styles.kicker}>Customer-site Look</p>
        <h2>Choose your customer-site Look</h2>
        <p>
          These are starting points, so choose the one that feels closest to
          your live show style. You can change your Look later, and we will keep
          adding new Looks over time.
        </p>
      </div>
      <div className={styles.grid}>
        {AMETHYST_SKIN_CARDS.map((card) => {
          const lookLabel = LOOK_LABELS[card.id] ?? card.label
          const isRecommended = card.id === RECOMMENDED_LOOK_ID
          const choiceMessage = `I choose the ${lookLabel} Look (${card.label}, ${card.code}).`

          return (
            <article key={card.id} className={styles.card}>
              <div className={styles.cardTop}>
                <span className={styles.code}>{card.code}</span>
                {isRecommended ? (
                  <span className={styles.recommended}>Recommended</span>
                ) : null}
              </div>
              <div className={styles.preview} aria-hidden="true">
                <div
                  className={styles.previewHero}
                  style={{ background: card.swatches[0]?.value }}
                />
                <div
                  className={styles.previewCard}
                  style={{
                    borderColor: card.swatches[1]?.value,
                    background: card.swatches[2]?.value,
                  }}
                >
                  <span style={{ background: card.swatches[1]?.value }} />
                  <span />
                  <span />
                </div>
              </div>
              <div className={styles.copy}>
                <h3>{lookLabel}</h3>
                <p className={styles.styleName}>{card.label}</p>
                <p>{card.description}</p>
              </div>
              <div className={styles.swatches} aria-label={`${lookLabel} colors`}>
                {card.swatches.map((swatch) => (
                  <span
                    key={`${card.id}-${swatch.label}`}
                    className={styles.swatch}
                    style={{ background: swatch.value }}
                    title={swatch.label}
                  />
                ))}
              </div>
              <button
                type="button"
                className={styles.choose}
                onClick={() => onChoose(choiceMessage)}
                disabled={disabled}
              >
                Choose this Look
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}
