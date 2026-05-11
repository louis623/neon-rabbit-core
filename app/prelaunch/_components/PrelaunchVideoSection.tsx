import { prelaunchContent } from '@/lib/prelaunch/content'

export function PrelaunchVideoSection() {
  if (!prelaunchContent.videoEmbedUrl) {
    return (
      <section id="video" className="bg-white px-6 py-16">
        <div className="mx-auto max-w-5xl rounded-[2rem] border border-[color:rgba(90,52,92,0.14)] bg-[linear-gradient(145deg,rgba(247,215,231,0.34),rgba(255,255,255,0.96))] p-8 shadow-[0_20px_60px_rgba(90,52,92,0.06)] sm:p-10">
          <div className="max-w-3xl space-y-4">
            <h2 className="font-amethyst-display text-3xl text-[var(--prelaunch-plum-ink)] sm:text-4xl">
              {prelaunchContent.videoFallbackHeading}
            </h2>
            <p className="text-base leading-7 text-[color:rgba(90,52,92,0.82)]">
              {prelaunchContent.videoFallbackBody}
            </p>
            <p className="text-sm leading-6 text-[color:rgba(90,52,92,0.66)]">
              {prelaunchContent.videoBody}
            </p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="video" className="bg-white px-6 py-16">
      <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="space-y-4">
          <h2 className="font-amethyst-display text-3xl text-[var(--prelaunch-plum-ink)] sm:text-4xl">
            {prelaunchContent.videoHeading}
          </h2>
          <p className="max-w-2xl text-base leading-7 text-[color:rgba(90,52,92,0.82)]">
            {prelaunchContent.videoBody}
          </p>
        </div>
        <iframe
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="min-h-64 w-full rounded-[2rem] border border-[color:rgba(90,52,92,0.16)] bg-[linear-gradient(135deg,rgba(247,215,231,0.55),rgba(232,221,255,0.65))]"
          src={prelaunchContent.videoEmbedUrl}
          title="Sparkle Suite guided walkthrough"
        />
      </div>
    </section>
  )
}
