import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchAudience() {
  return (
    <section className="ss-audience">
      <div className="ss-wrap">
        <div className="ss-audience__panel">
          <div className="ss-audience__copy">
            <span className="ss-eyebrow ss-eyebrow--paper">
              {prelaunchContent.audienceHeading}
            </span>
            <h2>
              Built for reps who want to <em>stand out.</em>
            </h2>
            <p>{prelaunchContent.audienceBody}</p>
          </div>
          <ul className="ss-audience__list">
            {prelaunchContent.audiences.map((audience) => (
              <li className="ss-audience__item" key={audience.number}>
                <span className="ss-audience__num">{audience.number}</span>
                <div>
                  <h4>{audience.title}</h4>
                  <p>{audience.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
