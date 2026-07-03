import Link from "next/link";
import { Bot, CalendarDays, Camera, Heart, Images, Search, Sparkles, UsersRound } from "lucide-react";
import { FindThisForMe } from "@/components/nic-nac/FindThisForMe";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import type { HomepageBlingVaultModel } from "@/lib/sparkle-finder/homepage-bling-vault";
import type { LucideIcon } from "lucide-react";

type FindPiecePanelProps = {
  accountState: SparkleFinderAccountState;
  model: HomepageBlingVaultModel;
};

export function FindPiecePanel({ accountState, model }: FindPiecePanelProps) {
  const nicNacItemId = model.wishlistItems[0]?.jewelryItemId ?? model.heroItem?.jewelryItemId;

  return (
    <section
      className="border-b border-[var(--sparkle-border-strong)] bg-[rgba(255,255,255,0.72)]"
      data-smoke="find-piece-panel"
      id="find-a-piece"
    >
      <div className="sparkle-finder-app-canvas mx-auto grid max-w-[56rem] gap-4 px-5 py-6 sm:px-8 lg:px-10">
        <article className="grid content-start gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Find a Piece</p>
            <h2 className="mt-1 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              What are you looking for?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
              Start with what you know. Sparkle Finder will point you toward the next place to look or the right helper to ask.
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <FindOption href="/library" icon={Search} label="I know the name" />
            <FindOption href="/library" icon={Sparkles} label="I know the collection" />
            <FindOption href="/silver#showcase-studio" icon={Camera} label="Add a Missing Piece" />
            <FindOption href="/photo-setup" icon={Images} label="Photo Setup Guide" />
            <FindOption href="#homepage-nic-nac" icon={Heart} label="Find pieces on my list" />
            <FindOption href="#homepage-nic-nac" icon={Bot} label="Ask Nic-Nac for Help" />
          </div>

          <div className="grid gap-2 border-t border-[var(--sparkle-border)] pt-4 sm:grid-cols-2 lg:grid-cols-4">
            <ContextLink href="/live-shows" icon={CalendarDays} label="Live Shows" />
            <ContextLink href="/rep-boards" icon={UsersRound} label="Rep Boards" />
            <ContextLink href="/favorites" icon={Heart} label="Favorite Reps" />
            <ContextLink href="/collectors" icon={UsersRound} label="Collectors" />
          </div>
        </article>

        <div id="homepage-nic-nac">
          <FindThisForMe accountState={accountState} compact jewelryItemId={nicNacItemId} />
        </div>
      </div>
    </section>
  );
}

function FindOption({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-12 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper-soft)] px-4 text-sm font-black text-[var(--sparkle-plum)] transition hover:border-[var(--sparkle-border-strong)] hover:bg-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{label}</span>
    </Link>
  );
}

function ContextLink({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
}) {
  return (
    <Link
      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-bold text-[var(--sparkle-ink-muted)] transition hover:text-[var(--sparkle-plum)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
      href={href}
    >
      <Icon aria-hidden="true" className="size-4 shrink-0 text-[var(--sparkle-coral)]" />
      <span>{label}</span>
    </Link>
  );
}
