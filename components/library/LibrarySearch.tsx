import Link from "next/link";
import { Search, X } from "lucide-react";
import type { BombPartyLabel, JewelryType } from "@/lib/sparkle-finder/types";
import type { LibraryFilters } from "@/app/(hub)/library/page";

const jewelryTypes: Array<JewelryType | "all"> = ["all", "ring", "earrings", "necklace", "bracelet", "other"];
const labels: Array<BombPartyLabel | "all"> = ["all", "diamond", "unicorn", "standard"];

type LibrarySearchProps = {
  filters: LibraryFilters;
};

export function LibrarySearch({ filters }: LibrarySearchProps) {
  return (
    <form
      action="/library"
      className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)] md:grid-cols-[minmax(0,1fr)_12rem_12rem_auto]"
      method="get"
    >
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Search the Jewelry Library
        <input
          className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-medium text-[var(--sparkle-plum-deep)]"
          defaultValue={filters.q}
          name="q"
          placeholder="Try a collection, item number, or piece name"
          type="search"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Type
        <select
          className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm capitalize text-[var(--sparkle-plum-deep)]"
          defaultValue={filters.type}
          name="type"
        >
          {jewelryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Label
        <select
          className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm capitalize text-[var(--sparkle-plum-deep)]"
          defaultValue={filters.label}
          name="label"
        >
          {labels.map((label) => (
            <option key={label} value={label}>
              {label === "all" ? "All labels" : label}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-rose)] px-4 text-sm font-bold text-white shadow-[var(--sparkle-shadow-sm)]"
          type="submit"
        >
          <Search aria-hidden="true" className="size-4" strokeWidth={2} />
          Search
        </button>
        <Link
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-plum-deep)]"
          href="/library"
        >
          <X aria-hidden="true" className="size-4" strokeWidth={2} />
          Clear
        </Link>
      </div>
    </form>
  );
}
