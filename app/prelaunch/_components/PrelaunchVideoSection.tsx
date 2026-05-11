import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchVideoSection() {
  return (
    <section className="prelaunch-section bg-white" id="video">
      <div className="prelaunch-shell grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
            What Is Sparkle Suite?
          </p>
          <h2 className="prelaunch-display text-4xl leading-tight text-[var(--prelaunch-plum-ink)] sm:text-5xl">
            Watch the guided walkthrough
          </h2>
          <p className="mt-5 text-lg leading-8 text-[var(--prelaunch-muted)]">
            Sparkle Suite is being built to give reps a calmer, more polished
            setup around live shows, customer updates, and the work that happens
            behind the scenes.
          </p>
        </div>

        {prelaunchContent.videoEmbedUrl ? (
          <iframe
            className="aspect-video w-full rounded-lg border border-[var(--prelaunch-border)]"
            src={prelaunchContent.videoEmbedUrl}
            title="Sparkle Suite guided walkthrough"
          />
        ) : (
          <div className="prelaunch-card grid aspect-video place-items-center p-8 text-center">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--prelaunch-muted)]">
                Guided walkthrough frame
              </p>
              <p className="mt-4 max-w-md text-lg leading-8 text-[var(--prelaunch-plum-ink)]">
                The video slot is ready. Until the walkthrough is recorded, this
                section keeps the page honest and copy-led.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
