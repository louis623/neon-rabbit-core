import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchVideoSection() {
  return (
    <section className="ss-summary" aria-label="Sales video snippets">
      <div className="ss-wrap">
        <div className="ss-summary__panel">
          <div className="ss-summary__copy">
            <span className="ss-eyebrow ss-eyebrow--paper">
              {prelaunchContent.salesVideoHeading}
            </span>
            <h2>Short TikTok-style previews.</h2>
            <p>{prelaunchContent.salesVideoBody}</p>
          </div>
          <div className="ss-summary__cards">
            {prelaunchContent.salesVideoItems.map((item) => (
              <div className="ss-summary__card" key={item}>
                <div>
                  <h4>{item}</h4>
                  <p>Sales preview slot for an embedded clip.</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
