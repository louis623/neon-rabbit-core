import { prelaunchContent } from '@/lib/prelaunch/content'
import { FeatureGlyph, SparkleSeal } from './PrelaunchVisuals'

export function PrelaunchHero() {
  return (
    <>
      <header className="ss-nav">
        <div className="ss-wrap ss-nav__inner">
          <a className="ss-brand" href="#top" aria-label="Sparkle Suite">
            <SparkleSeal className="ss-brand__seal" />
            <span className="ss-brand__name">{prelaunchContent.brand}</span>
          </a>
          <span className="ss-nav__pill">
            <span className="ss-dot" />
            {prelaunchContent.eyebrow}
          </span>
        </div>
      </header>

      <section className="ss-hero" id="top">
        <div className="ss-wrap ss-hero__grid">
          <div className="ss-hero__copy">
            <div className="ss-hero__kicker">
              <span className="ss-rule" />
              <span className="ss-eyebrow">
                {prelaunchContent.brand} - {prelaunchContent.eyebrow}
              </span>
            </div>
            <h1 className="ss-hero__title">
              {prelaunchContent.headline}
            </h1>
            <p className="ss-hero__sub">{prelaunchContent.body}</p>
            <div className="ss-hero__ctas">
              <a className="ss-btn ss-btn--primary" href="#waitlist">
                {prelaunchContent.primaryCtaLabel}
                <span aria-hidden="true" className="ss-arrow">
                  &rarr;
                </span>
              </a>
              <a className="ss-btn ss-btn--ghost" href="#summary">
                {prelaunchContent.secondaryCtaLabel}
              </a>
            </div>
            <ul className="ss-hero__signals">
              {prelaunchContent.heroFeatures.map((feature) => (
                <li key={feature.title}>
                  <span className="ss-bullet" />
                  <span>
                    {feature.title === 'Nic-Nac'
                      ? `${feature.title}, ${feature.body}`
                      : `${feature.title} ${feature.body}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <aside aria-label="What's inside" className="ss-stack">
            <div className="ss-stack__label">
              <span className="ss-eyebrow ss-eyebrow--ink">
                {prelaunchContent.previewHeading}
              </span>
            </div>
            {prelaunchContent.previewItems.map((item) => (
              <article className="ss-card" key={item.title}>
                <FeatureGlyph title={item.title} />
                <div>
                  <div className="ss-card__title">{item.title}</div>
                  <div className="ss-card__sub">{item.body}</div>
                </div>
              </article>
            ))}
            <p className="ss-stack__note">
              <strong>Plus Nic-Nac</strong> - the built-in live show AI assistant
              helping with flow, content, and the moving parts behind the scenes.
            </p>
          </aside>
        </div>
      </section>
    </>
  )
}
