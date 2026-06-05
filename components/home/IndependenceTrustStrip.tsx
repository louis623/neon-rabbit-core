import { ShieldCheck } from "lucide-react";

export function IndependenceTrustStrip() {
  return (
    <section
      aria-label="Sparkle Finder independence statement"
      className="rounded-[var(--sparkle-radius-md)] border border-[rgba(246,231,218,0.18)] bg-[linear-gradient(145deg,var(--sparkle-plum)_0%,var(--sparkle-plum-deep)_100%)] p-5 text-[var(--sparkle-panel-text)] shadow-[0_18px_44px_rgba(54,34,29,0.16)] sm:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[rgba(255,246,250,0.1)] text-[var(--sparkle-blush)]">
          <ShieldCheck aria-hidden="true" className="size-6" strokeWidth={1.8} />
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-[var(--sparkle-blush)]">
            Independent discovery hub
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-playfair)] text-2xl font-semibold leading-tight text-[#fff6fa]">
            Clear about what we are, and what we are not.
          </h2>
          <p className="mt-3 text-sm leading-6 text-[rgba(246,231,218,0.82)] sm:text-base">
            Sparkle Finder does not sell Bomb Party jewelry. We are not Bomb Party, a Bomb Party affiliate, or a
            Bomb Party rep.
          </p>
        </div>
      </div>
    </section>
  );
}
