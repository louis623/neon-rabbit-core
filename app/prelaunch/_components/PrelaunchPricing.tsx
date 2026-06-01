import { prelaunchContent } from '@/lib/prelaunch/content'

type PricingPlan =
  | typeof prelaunchContent.pricing.founder
  | typeof prelaunchContent.pricing.standard

export function PrelaunchPricing() {
  const { pricing } = prelaunchContent

  return (
    <section
      aria-labelledby="prelaunch-pricing-heading"
      className="ss-pricing"
      id="pricing"
    >
      <div className="ss-wrap">
        <div className="ss-pricing__panel">
          <div className="ss-pricing__head">
            <span className="ss-eyebrow">{pricing.eyebrow}</span>
            <h2 id="prelaunch-pricing-heading">{pricing.heading}</h2>
            <p>{pricing.body}</p>
          </div>
          <div className="ss-pricing__grid">
            <article className="ss-pricing-build">
              <span>{pricing.buildFee.label}</span>
              <strong>{pricing.buildFee.price}</strong>
              <p>{pricing.buildFee.body}</p>
            </article>
            <PrelaunchPricingCard plan={pricing.founder} variant="founder" />
            <PrelaunchPricingCard plan={pricing.standard} variant="standard" />
          </div>
          <div className="ss-pricing__bottom">
            <div>
              <span className="ss-pricing__included-label">
                Included in Sparkle Suite
              </span>
              <ul className="ss-pricing__included">
                {pricing.included.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="ss-pricing__cta">
              <p>{pricing.note}</p>
              <a className="ss-btn ss-btn--primary" href={pricing.cta.href}>
                {pricing.cta.label}
                <span aria-hidden="true" className="ss-arrow">
                  -&gt;
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function PrelaunchPricingCard({
  plan,
  variant,
}: {
  plan: PricingPlan
  variant: 'founder' | 'standard'
}) {
  return (
    <article className={`ss-pricing-card ss-pricing-card--${variant}`}>
      <span className="ss-pricing-card__badge">{plan.badge}</span>
      <h3>{plan.label}</h3>
      <strong>{plan.price}</strong>
      <p>{plan.term}</p>
      <p>{plan.firstCheckout}</p>
      {'afterTerm' in plan ? <em>{plan.afterTerm}</em> : null}
    </article>
  )
}
