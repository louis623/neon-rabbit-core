import { Search } from "lucide-react";

type CollectorSearchProps = {
  query: string;
};

export function CollectorSearch({ query }: CollectorSearchProps) {
  return (
    <form action="/collectors" className="flex w-full flex-col gap-3 sm:flex-row" role="search">
      <label className="sr-only" htmlFor="collector-search">
        Search public collectors
      </label>
      <div className="flex min-h-11 flex-1 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3">
        <Search aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-ink-muted)]" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm font-semibold text-[var(--sparkle-plum-deep)] outline-none placeholder:text-[var(--sparkle-ink-muted)]"
          defaultValue={query}
          id="collector-search"
          name="q"
          placeholder="Search by collector name or handle"
          type="search"
        />
      </div>
      <button
        className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white"
        type="submit"
      >
        Search
      </button>
    </form>
  );
}
