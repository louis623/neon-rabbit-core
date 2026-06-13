import { BookOpen, CalendarDays, Camera, Gem, Search, UsersRound } from "lucide-react";

const howItWorksSteps = [
  {
    title: "Find pieces you like.",
    body: "Search the jewelry library for styles and products you want to follow.",
  },
  {
    title: "Check rep trade boards.",
    body: "See which reps have pieces you love on their trade boards aka dance floors.",
  },
  {
    title: "Live show calendar.",
    body: "Find the next show with the piece you want.",
  },
  {
    title: "Save and show off.",
    body: "Keep favorites in a digital wishlist and show pieces you already own in your collection.",
  },
] as const;

const includedTools = [
  {
    title: "Master Jewelry Library",
    body: "Find pieces you like before you jump into live shows or rep boards.",
    icon: BookOpen,
  },
  {
    title: "Live Show Calendar",
    body: "Find the next show for the reps you want to watch.",
    icon: CalendarDays,
  },
  {
    title: "Rep Trade Boards / Dance Floors",
    body: "See which reps have the pieces you are looking for.",
    icon: UsersRound,
  },
  {
    title: "Collection Showcase",
    body: "Show off pieces you already own and keep favorites in a wishlist.",
    icon: Gem,
  },
  {
    title: "Photo-ready uploads",
    body: "Use label evidence and clean light-box photos when Silver members submit missing pieces.",
    icon: Camera,
  },
] as const;

export function PublicLandingFeatureCards() {
  return (
    <section
      className="grid gap-6"
      aria-label="Sparkle Finder public features"
      data-smoke="public-feature-cards"
    >
      <div
        className="grid gap-6 rounded-[var(--sparkle-radius-md)] border border-[rgba(246,231,218,0.18)] bg-[linear-gradient(145deg,var(--sparkle-plum)_0%,var(--sparkle-plum-deep)_100%)] p-5 text-[var(--sparkle-panel-text)] shadow-[0_18px_44px_rgba(54,34,29,0.16)] sm:p-6 lg:grid-cols-[minmax(15rem,0.5fr)_minmax(0,1fr)] lg:items-start"
        data-tone="espresso"
      >
        <div className="max-w-2xl">
          <div className="grid size-12 place-items-center rounded-full bg-[rgba(255,246,250,0.1)] text-[var(--sparkle-blush)]">
            <Search aria-hidden="true" className="size-6" strokeWidth={1.8} />
          </div>
          <p className="mt-5 text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-blush)]">
            How it works
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[#fff6fa]">
            How Sparkle Finder works
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(246,231,218,0.82)]">
            Follow the path from pieces to reps, trade boards, show times, wishlist, and collection.
          </p>
        </div>

        <ol className="grid gap-3 sm:grid-cols-2">
          {howItWorksSteps.map((step, index) => (
            <li
              className="rounded-[var(--sparkle-radius-sm)] border border-[rgba(246,231,218,0.14)] bg-[rgba(255,246,250,0.07)] p-4"
              key={step.title}
            >
              <div className="flex gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--sparkle-rose)] text-sm font-extrabold text-white">
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <h3 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[#fff6fa]">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[rgba(246,231,218,0.78)]">{step.body}</p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </div>

      <div
        className="grid gap-3 rounded-[var(--sparkle-radius-md)] border border-[var(--sparkle-border)] bg-white/60 p-5 sm:p-6"
        data-tone="light"
      >
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[var(--sparkle-rose)]">
            Included tools
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
            The pieces underneath the flow
          </h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {includedTools.map((tool) => {
            const Icon = tool.icon;

            return (
              <article
                className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/82 p-4"
                key={tool.title}
              >
                <div className="grid size-10 place-items-center rounded-full bg-[var(--sparkle-paper-soft)] text-[var(--sparkle-rose)]">
                  <Icon aria-hidden="true" className="size-5" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-[family-name:var(--font-playfair)] text-lg font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  {tool.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{tool.body}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
