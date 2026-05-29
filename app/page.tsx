import { CalendarDays, Gem, Search } from "lucide-react";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";

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
    title: "Silver Membership",
    body: "Browse for free. Let Nic-Nac hunt for you with Silver.",
    icon: Search,
  },
];

export default function Home() {
  return (
    <>
      <SparkleFinderNav />
      <main className="min-h-[calc(100vh-5.75rem)] px-5 py-8 sm:px-8">
        <section className="mx-auto grid w-full max-w-7xl gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-end">
          <div className="max-w-3xl py-8 sm:py-14">
            <p className="mb-4 text-sm font-bold text-[var(--sparkle-coral)]">Sparkle Finder by Sparkle Suite</p>
            <h1 className="font-[var(--font-playfair)] text-5xl font-semibold leading-[1.02] text-[var(--sparkle-plum-deep)] sm:text-6xl lg:text-7xl">
              Sparkle Finder foundation is online.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--sparkle-ink-muted)]">
              The V1 discovery hub shell now has the brand tokens, seal, and primary navigation ready for the homepage build.
            </p>
          </div>

          <div className="grid gap-3 rounded-[var(--sparkle-radius-lg)] border border-[var(--sparkle-border)] bg-[rgba(255,254,253,0.84)] p-4 shadow-[var(--sparkle-shadow-md)] backdrop-blur">
            {bootItems.map((item) => {
              const Icon = item.icon;

              return (
                <article
                  key={item.title}
                  className="flex min-h-28 gap-4 rounded-[var(--sparkle-radius-md)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)]"
                >
                  <div className="grid size-11 shrink-0 place-items-center rounded-full bg-[var(--sparkle-blush)] text-[var(--sparkle-plum)]">
                    <Icon aria-hidden="true" className="size-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-[var(--sparkle-plum-deep)]">{item.title}</h2>
                    <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">{item.body}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </main>
    </>
  );
}
