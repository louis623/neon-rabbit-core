import Link from "next/link";
import { Bell, CalendarDays, PlayCircle } from "lucide-react";
import type { LiveShow, RepSummary } from "@/lib/sparkle-finder/types";

type LiveShowAgendaProps = {
  liveShows: LiveShow[];
  reps: RepSummary[];
};

export function LiveShowAgenda({ liveShows, reps }: LiveShowAgendaProps) {
  const repById = new Map(reps.map((rep) => [rep.id, rep]));
  const sortedShows = [...liveShows].sort(
    (left, right) => new Date(left.startsAt).getTime() - new Date(right.startsAt).getTime(),
  );

  return (
    <aside
      className="border-t border-[var(--sparkle-border)] bg-[rgba(255,243,240,0.68)] px-5 py-6 sm:px-8 lg:border-l lg:border-t-0 lg:px-6 lg:py-6"
      data-smoke="agenda"
      id="live-shows"
    >
      <div className="mx-auto max-w-2xl lg:sticky lg:top-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <CalendarDays aria-hidden="true" className="size-5 shrink-0 text-[var(--sparkle-plum)]" />
            <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-2xl">
              Today across Sparkle Suite
            </h2>
          </div>
          <Link
            className="shrink-0 text-sm font-semibold text-[var(--sparkle-rose)] underline-offset-4 hover:underline"
            href="/live-shows"
          >
            View full calendar
          </Link>
        </div>

        <div className="overflow-hidden rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[rgba(255,254,253,0.86)] shadow-[var(--sparkle-shadow-sm)]">
          {sortedShows.slice(0, 5).map((show, index) => {
            const rep = repById.get(show.repId);
            const isLive = show.status === "live" || index === 0;

            return (
              <article
                key={show.id}
                className="grid min-h-[4.25rem] grid-cols-[2.8rem_minmax(4.7rem,0.62fr)_minmax(0,1fr)] items-center gap-3 border-b border-[var(--sparkle-border)] px-3 py-2 last:border-b-0 sm:grid-cols-[2.9rem_minmax(5rem,0.55fr)_minmax(0,1fr)_auto] sm:px-4"
              >
                <div className="grid size-11 place-items-center rounded-full bg-[linear-gradient(135deg,#fffefd,#f1d0ca)] text-sm font-bold text-[var(--sparkle-plum)] ring-2 ring-white">
                  {getInitials(rep?.displayName ?? "SF")}
                </div>
                <div>
                  <time
                    className="block text-lg font-bold leading-tight text-[var(--sparkle-plum-deep)]"
                    dateTime={show.startsAt}
                  >
                    {formatTime(show.startsAt)}
                  </time>
                  <span className="text-xs font-semibold text-[var(--sparkle-ink-muted)]">
                    {show.durationMinutes}m
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-bold text-[var(--sparkle-plum-deep)]">
                    {rep?.displayName ?? "Sparkle Suite Rep"}
                  </h3>
                  <p className="truncate text-xs leading-5 text-[var(--sparkle-ink-muted)]">{show.title}</p>
                </div>
                <Link
                  className="col-span-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-rose)] px-3 text-xs font-bold text-[var(--sparkle-rose)] transition hover:bg-[var(--sparkle-blush)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--sparkle-rose)] sm:col-span-1"
                  href={show.showUrl}
                >
                  {isLive ? (
                    <>
                      <PlayCircle aria-hidden="true" className="size-4" />
                      Watch
                    </>
                  ) : (
                    <>
                      <Bell aria-hidden="true" className="size-4" />
                      Set Reminder
                    </>
                  )}
                </Link>
              </article>
            );
          })}
        </div>

        <div className="mt-4 text-center">
          <Link className="inline-flex items-center text-sm font-bold text-[var(--sparkle-rose)] hover:underline" href="/live-shows">
            See all live shows
            <span aria-hidden="true" className="ml-2">-&gt;</span>
          </Link>
        </div>
      </div>
    </aside>
  );
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
