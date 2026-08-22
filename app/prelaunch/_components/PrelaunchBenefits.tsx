import { prelaunchContent } from '@/lib/prelaunch/content'
import { FeatureGlyph } from './PrelaunchVisuals'

export function PrelaunchBenefits() {
  return (
    <>
      <section className="ss-summary" id="summary">
        <div className="ss-wrap">
          <div className="ss-summary__panel">
            <div className="ss-summary__copy">
              <span className="ss-eyebrow ss-eyebrow--paper">
                {prelaunchContent.valueHeading}
              </span>
              <span className="ss-rule ss-rule--paper" />
              <h2>
                The edge customers can actually <em>feel.</em>
              </h2>
              <p>
                Sparkle Suite is built for reps who want more than a link page
                and a handful of workarounds. Your site, dance floor, live
                queue, event calendar, customer updates, and Nic-Nac all work
                together in one setup that feels more polished to customers and
                easier to run on your side.
              </p>
              <p>
                That means a better experience up front, smoother flow while
                you&apos;re live, and fewer details to keep chasing by hand.
              </p>
            </div>
            <div className="ss-summary__cards">
              {prelaunchContent.valueCards.map((card) => (
                <div className="ss-summary__card" key={card.title}>
                  <FeatureGlyph title={card.title} />
                  <div>
                    <h4>{card.title}</h4>
                    <p>{card.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="ss-features" id="features">
        <div className="ss-wrap">
          <div className="ss-features__head">
            <div>
              <span className="ss-eyebrow">{prelaunchContent.suiteHeading}</span>
              <h2>
                The tools behind the <em>wow factor.</em>
              </h2>
            </div>
            <p className="ss-lead">{prelaunchContent.suiteBody}</p>
          </div>
          <div className="ss-feat-grid">
            {prelaunchContent.suiteItems.map((item) => (
              <article className="ss-feat" key={item.title}>
                <div className="ss-feat__head">
                  <FeatureGlyph title={item.title} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
