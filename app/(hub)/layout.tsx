import { cookies } from "next/headers";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  isSparkleFinderSignedIn,
  parseSparkleFinderAuthMode,
  sparkleFinderAuthCookieName,
} from "@/lib/sparkle-finder/auth";
import { getCurrentSparkleFinderAccount } from "@/lib/sparkle-finder/account-service";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";
import Link from "next/link";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);

  return renderHubChrome(children, await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode }));
}

export function renderHubChrome(children: React.ReactNode, accountState: SparkleFinderAccountState) {
  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)]">
        <div className="mx-auto max-w-[112rem] px-5 py-8 sm:px-8 lg:px-10">
          {isSparkleFinderSignedIn(accountState) ? children : <HubSignInWall />}
        </div>
      </main>
    </>
  );
}

function HubSignInWall() {
  return (
    <section className="mx-auto grid max-w-3xl gap-5 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)] sm:p-8">
      <div className="grid gap-3">
        <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">Account needed</p>
        <h1 className="font-serif text-3xl font-semibold text-[var(--sparkle-plum-deep)]">
          Sign in to open Sparkle Finder
        </h1>
        <p className="max-w-2xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
          Free accounts can browse the library and follow rep availability. Silver preview accounts can also see
          collection and Nic-Nac request tools in local development.
        </p>
      </div>
      <Link
        className="inline-flex h-11 w-fit items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
        href="/auth/sign-in"
      >
        Continue to sign in
      </Link>
    </section>
  );
}
