import Link from "next/link";
import { getLiveShows, getRepById } from "@/lib/sparkle-finder/service";

export default function LiveShowsPage() {
  const shows = getLiveShows();

  return (
    <section className="grid gap-6">
      <div>
        <h1 className="font-[var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
          Master Live Calendar
        </h1>
        <p className="mt-3 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          One schedule for Sparkle Suite rep live shows and next-show context.
        </p>
      </div>
      <div className="grid gap-4">
        {shows.map((show) => {
          const rep = getRepById(show.repId);

          return (
            <article
              className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
              key={show.id}
            >
              <p className="text-sm font-bold text-[var(--sparkle-coral)]">{formatShowTime(show.startsAt)}</p>
              <h2 className="mt-2 font-[var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                {show.title}
              </h2>
              <p className="mt-1 text-sm text-[var(--sparkle-ink-muted)]">
                {rep?.businessName ?? "Sparkle Suite Rep"} · {show.durationMinutes} minutes
              </p>
              <Link className="mt-4 inline-flex text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href={show.showUrl}>
                Open show path
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function formatShowTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/New_York",
  }).format(new Date(value));
}
