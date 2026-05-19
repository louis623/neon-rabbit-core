import { prelaunchContent } from '@/lib/prelaunch/content'
import { SparkleSeal } from './PrelaunchVisuals'

interface PrelaunchFooterProps {
  ctaHref?: string
  ctaLabel?: string
}

export function PrelaunchFooter({
  ctaHref = '#waitlist',
  ctaLabel = prelaunchContent.primaryCtaLabel,
}: PrelaunchFooterProps) {
  return (
    <>
      <section className="ss-closing">
        <div className="ss-wrap ss-closing__inner">
          <SparkleSeal className="ss-closing__seal" />
          <span className="ss-eyebrow">{prelaunchContent.footerEyebrow}</span>
          <h2>
            We're building this carefully. <em>The polished edge is on the way.</em>
          </h2>
          <p>Join the waitlist and be first to know when Sparkle Suite is ready.</p>
          <a className="ss-btn ss-btn--primary" href={ctaHref}>
            {ctaLabel}
            <span aria-hidden="true" className="ss-arrow">
              &rarr;
            </span>
          </a>
        </div>
      </section>
      <footer className="ss-foot">
        <div className="ss-wrap ss-foot__inner">
          <div className="ss-foot__brand">
            <SparkleSeal className="ss-foot__seal" />
            <span>{prelaunchContent.brand}</span>
          </div>
          <nav aria-label="Legal pages" className="ss-foot__links">
            <a href="/privacy-policy">Privacy Policy</a>
            <a href="/terms-and-conditions">Terms and Conditions</a>
          </nav>
          <div className="ss-foot__copy">
            <div>Copyright 2026 Sparkle Suite - Coming Soon</div>
            <div>{prelaunchContent.footerTagline}</div>
          </div>
        </div>
      </footer>
    </>
  )
}
