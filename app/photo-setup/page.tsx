import type { Metadata } from "next";
import { Camera, CheckCircle2, ExternalLink, Lightbulb, ShieldCheck, Sparkles } from "lucide-react";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";

const lightBoxProductHref = "https://www.amazon.com/dp/B0C7Z93NPR";

const setupChecks = [
  "Use the original Bomb Party label or package detail that shows item clues.",
  "Place the jewelry on a plain, clean background with bright, even light.",
  "Retake blurry, shadowy, cropped, or overly filtered photos before submitting.",
  "Keep the jewelry photo separate from the label evidence so Nic-Nac can review both clearly.",
] as const;

export const metadata: Metadata = {
  title: "Photo Setup Guide | Sparkle Finder",
  description:
    "Simple light-box photo guidance for Sparkle Finder Showcase Studio jewelry uploads.",
};

export default function PhotoSetupPage() {
  return (
    <>
      <SparkleFinderNav variant="public" />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)]">
        <div className="mx-auto grid max-w-[112rem] gap-6 px-5 py-8 sm:px-8 lg:px-10">
          {renderPhotoSetupPageContent()}
        </div>
      </main>
      <SparkleFinderFooter />
    </>
  );
}

export function renderPhotoSetupPageContent() {
  return (
    <section className="grid gap-6" data-smoke="photo-setup-guide">
      <div className="overflow-hidden rounded-[var(--sparkle-radius-md)] border border-[rgba(238,44,155,0.22)] bg-[linear-gradient(135deg,#fffefd_0%,#fff4f8_52%,#fff8ef_100%)] shadow-[var(--sparkle-shadow-sm)]">
        <div className="grid gap-6 p-5 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-start lg:p-7">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">
              Showcase Studio
            </p>
            <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)] sm:text-5xl">
              Photo setup for jewelry uploads
            </h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
              Sparkle Suite reps use a compact photo box for jewelry photos, but you do not need this exact one. Any
              clean, well-lit light box that shows the label evidence and jewelry clearly can work.
            </p>
          </div>

          <aside className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/82 p-4">
            <div className="flex items-start gap-3">
              <ShieldCheck aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-[var(--sparkle-rose)]" />
              <div>
                <h2 className="font-[family-name:var(--font-playfair)] text-xl font-semibold text-[var(--sparkle-plum-deep)]">
                  Plain resource link
                </h2>
                <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                  This is the photo box Sparkle Suite reps use. It is shared as a convenience, not an advertisement or storefront.
                </p>
              </div>
            </div>
            <a
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-4 text-sm font-bold text-white transition hover:bg-[var(--sparkle-plum-deep)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--sparkle-rose)]"
              href={lightBoxProductHref}
              rel="noopener noreferrer"
              target="_blank"
            >
              View the photo box
              <ExternalLink aria-hidden="true" className="size-4" />
            </a>
          </aside>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-start gap-3">
            <Camera aria-hidden="true" className="mt-1 size-7 shrink-0 text-[var(--sparkle-rose)]" />
            <div>
              <h2 className="font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
                What Nic-Nac needs to see
              </h2>
              <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                The goal is a reviewable record, not a professional product shoot. Clear label evidence plus a sharp
                front-facing jewelry photo gives Nic-Nac the best chance to confirm a missing piece.
              </p>
            </div>
          </div>

          <ul className="mt-5 grid gap-3 sm:grid-cols-2">
            {setupChecks.map((check) => (
              <li className="flex gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/70 p-3" key={check}>
                <CheckCircle2 aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-[var(--sparkle-coral)]" />
                <span className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{check}</span>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white/72 p-5 shadow-[var(--sparkle-shadow-sm)]">
          <Lightbulb aria-hidden="true" className="size-7 text-[var(--sparkle-coral)]" />
          <h2 className="mt-3 font-[family-name:var(--font-playfair)] text-2xl font-semibold text-[var(--sparkle-plum-deep)]">
            Good enough beats fancy
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            A bright, consistent setup helps every future upload. If your photo clearly shows the shape, color, stones,
            and label clues, you are on the right track.
          </p>
          <p className="mt-4 inline-flex items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[rgba(238,44,155,0.2)] bg-[var(--sparkle-blush-bg)] px-3 py-2 text-xs font-bold text-[var(--sparkle-plum)]">
            <Sparkles aria-hidden="true" className="size-4" />
            Any clean, well-lit light box can work.
          </p>
        </article>
      </div>
    </section>
  );
}
