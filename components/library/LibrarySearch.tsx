import type { BombPartyLabel, JewelryType } from "@/lib/sparkle-finder/types";

const jewelryTypes: Array<JewelryType | "all"> = ["all", "ring", "earrings", "necklace", "bracelet", "other"];
const labels: Array<BombPartyLabel | "all"> = ["all", "diamond", "unicorn", "standard"];

export function LibrarySearch() {
  return (
    <form className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-4 shadow-[var(--sparkle-shadow-sm)] md:grid-cols-[minmax(0,1fr)_12rem_12rem]">
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Search the Jewelry Library
        <input
          className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-medium text-[var(--sparkle-plum-deep)]"
          name="q"
          placeholder="Try a collection, item number, or piece name"
          type="search"
        />
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Type
        <select className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm capitalize text-[var(--sparkle-plum-deep)]" name="type">
          {jewelryTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Label
        <select className="min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm capitalize text-[var(--sparkle-plum-deep)]" name="label">
          {labels.map((label) => (
            <option key={label} value={label}>
              {label === "all" ? "All labels" : label}
            </option>
          ))}
        </select>
      </label>
    </form>
  );
}
