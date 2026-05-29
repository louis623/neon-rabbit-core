import Link from "next/link";
import { Gem, LogIn, Search } from "lucide-react";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  createNoCredentialSupabaseAuthBoundary,
  getLocalDevAuthState,
} from "@/lib/sparkle-finder/auth";

export default function SignInPage() {
  const localFreeAccount = getLocalDevAuthState("free");
  const localSilverAccount = getLocalDevAuthState("silver");
  const supabaseBoundary = createNoCredentialSupabaseAuthBoundary();

  return (
    <>
      <SparkleFinderNav accountState={getLocalDevAuthState("anonymous")} />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)] px-5 py-10 sm:px-8">
        <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div className="grid gap-5">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
              Sparkle Finder account
            </p>
            <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              Sign in for local preview access
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
              This development build uses fixture accounts, so no production credentials are needed. Free preview keeps
              browsing available after sign-in, while Silver preview opens collection tools and focused Nic-Nac requests.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
                href="/auth/preview/free"
              >
                <LogIn aria-hidden="true" className="size-4" />
                Continue as {localFreeAccount.displayName}
              </Link>
              <Link
                className="inline-flex h-11 items-center gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-[var(--sparkle-paper)] px-5 text-sm font-bold text-[var(--sparkle-plum-deep)]"
                href="/auth/preview/silver"
              >
                <Gem aria-hidden="true" className="size-4" />
                Preview {localSilverAccount.displayName}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
            <div className="flex items-start gap-3">
              <Search aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
              <div>
                <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Account states</h2>
                <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                  Anonymous visitors see the public homepage and are prompted before opening hub tools.
                </p>
              </div>
            </div>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-3 border-t border-[var(--sparkle-border)] pt-3">
                <dt className="font-bold text-[var(--sparkle-plum-deep)]">Free preview</dt>
                <dd className="text-[var(--sparkle-ink-muted)]">{localFreeAccount.status}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--sparkle-border)] pt-3">
                <dt className="font-bold text-[var(--sparkle-plum-deep)]">Silver preview</dt>
                <dd className="text-[var(--sparkle-ink-muted)]">{localSilverAccount.status}</dd>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-[var(--sparkle-border)] pt-3">
                <dt className="font-bold text-[var(--sparkle-plum-deep)]">Supabase boundary</dt>
                <dd className="text-[var(--sparkle-ink-muted)]">
                  {supabaseBoundary.isConfigured ? "configured" : "placeholder"}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      </main>
    </>
  );
}
