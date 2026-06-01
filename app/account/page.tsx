import Link from "next/link";
import { cookies } from "next/headers";
import { LogIn } from "lucide-react";
import { AccountPreferences } from "@/components/account/AccountPreferences";
import { SilverStatusPanel } from "@/components/account/SilverStatusPanel";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName } from "@/lib/sparkle-finder/auth";

export default async function AccountPage() {
  const cookieStore = await cookies();
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });

  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      {renderAccountPageContent(accountState)}
    </>
  );
}

export function renderAccountPageContent(accountState: CurrentSparkleFinderAccountState, now?: Date) {
  if (accountState.status !== "authenticated") {
    return (
      <main className="min-h-screen bg-[var(--sparkle-shell)] px-5 py-8 sm:px-8 lg:px-10">
        <section className="mx-auto grid w-full max-w-3xl gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-6 shadow-[var(--sparkle-shadow-sm)]">
          <div className="flex items-start gap-3">
            <LogIn aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
            <div>
              <h1 className="text-2xl font-bold text-[var(--sparkle-plum-deep)]">
                Sign in to manage your Sparkle Finder account
              </h1>
              <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                Account controls, Silver trial details, profile basics, and communication preferences are only shown
                after verified server auth.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white"
              href="/auth/sign-in"
            >
              Sign in
            </Link>
            <Link
              className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-5 text-sm font-bold text-[var(--sparkle-plum-deep)]"
              href="/auth/sign-up"
            >
              Create account
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--sparkle-shell)] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <section className="grid gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--sparkle-coral)]">Account</p>
          <h1 className="text-3xl font-bold text-[var(--sparkle-plum-deep)]">Sparkle Finder account</h1>
          <p className="max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Manage the signed-in profile, privacy choices, and Silver access attached to verified account data.
          </p>
        </section>

        <SilverStatusPanel accountState={accountState} now={now} />
        <AccountPreferences accountState={accountState} />
      </div>
    </main>
  );
}
