import { CalendarDays, Gem, Search, Sparkles } from "lucide-react";

const bootItems = [
  {
    title: "Live show paths",
    body: "Calendar-first discovery for Sparkle Suite rep events.",
    icon: CalendarDays,
  },
  {
    title: "Library foundation",
    body: "A starter surface for the future jewelry reference flow.",
    icon: Gem,
  },
  {
    title: "Nic-Nac assist",
    body: "Bounded search support will arrive in the Silver workflow.",
    icon: Search,
  },
];

export default function Home() {
  return (
    <main className="min-h-screen px-6 py-8 sm:px-10">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-between gap-10 rounded-[2rem] border border-[var(--border)] bg-[rgba(255,255,255,0.72)] p-6 shadow-[0_24px_80px_rgba(83,37,59,0.12)] backdrop-blur sm:p-10">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-12 place-items-center rounded-full border border-[var(--border)] bg-[var(--surface)] font-[var(--font-playfair)] text-xl font-bold text-[var(--accent-strong)] shadow-sm">
              SF
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--accent-strong)]">
                Sparkle Finder
              </p>
              <p className="text-sm text-[#765263]">by Sparkle Suite</p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--surface-muted)] px-4 py-2 text-sm font-semibold text-[var(--accent-strong)]">
            <Sparkles aria-hidden="true" className="size-4" />
            App scaffold online
          </div>
        </header>

        <div className="grid gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:items-end">
          <div className="max-w-3xl">
            <h1 className="font-[var(--font-playfair)] text-5xl font-semibold leading-[1.02] text-[#2f1a29] sm:text-6xl lg:text-7xl">
              Sparkle Finder is booting.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[#765263]">
              This starter homepage confirms the standalone Next.js app is ready for the V1 discovery hub build.
            </p>
          </div>

          <div className="grid gap-3">
            {bootItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="flex gap-4 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-[0_12px_34px_rgba(83,37,59,0.08)]"
                >
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--surface-muted)] text-[var(--accent-strong)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[#37202f]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[#765263]">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}
