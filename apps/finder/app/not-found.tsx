import Link from "next/link";
import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import { SparkleFinderFooter } from "@/components/layout/SparkleFinderFooter";
import { SparkleFinderLogo } from "@/components/brand/SparkleFinderLogo";
import { createUnavailableShowcaseMetadata } from "@/lib/sparkle-finder/showcase-metadata";

export const metadata: Metadata = createUnavailableShowcaseMetadata();

export default function NotFound() {
  return (
    <>
      <main className="mx-auto grid min-h-[75vh] w-full max-w-[42rem] place-content-center gap-6 px-5 py-12 text-center">
        <SparkleFinderLogo />
        <section className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-7 shadow-[var(--sparkle-shadow-sm)]">
          <Sparkles aria-hidden="true" className="mx-auto size-9 text-[var(--sparkle-rose)]" />
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-[var(--sparkle-coral)]">Page unavailable</p>
          <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-4xl font-semibold text-[var(--sparkle-plum-deep)]">
            This page isn&apos;t available.
          </h1>
          <p className="mx-auto mt-3 max-w-lg text-base leading-7 text-[var(--sparkle-ink-muted)]">
            The page may be private or unavailable, or the address may have been mistyped.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link className="inline-flex min-h-11 items-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white" href="/">
              Go to Sparkle Finder
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-5 text-sm font-bold text-[var(--sparkle-plum)]" href="/collectors">
              Browse collectors
            </Link>
            <Link className="inline-flex min-h-11 items-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] px-5 text-sm font-bold text-[var(--sparkle-plum)]" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      </main>
      <SparkleFinderFooter />
    </>
  );
}
