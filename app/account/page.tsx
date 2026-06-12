import Link from "next/link";
import { cookies } from "next/headers";
import { LogIn } from "lucide-react";
import { AccountPreferences } from "@/components/account/AccountPreferences";
import { RepBadge } from "@/components/account/RepBadge";
import { SilverStatusPanel } from "@/components/account/SilverStatusPanel";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { getAccountCompletionState } from "@/lib/sparkle-finder/account-completion";
import {
  getCurrentSparkleFinderAccount,
  type CurrentSparkleFinderAccountState,
} from "@/lib/sparkle-finder/account-service";
import { parseSparkleFinderAuthMode, sparkleFinderAuthCookieName } from "@/lib/sparkle-finder/auth";
import type { SparkleSuiteRepIdentity } from "@/lib/sparkle-finder/types";

type AccountSearchParams = Record<string, string | string[] | undefined>;
type AccountNotice = {
  tone: "success" | "error";
  title: string;
  body: string;
};

type AccountPageProps = {
  searchParams?: AccountSearchParams | Promise<AccountSearchParams>;
};

export default async function AccountPage({ searchParams }: AccountPageProps = {}) {
  const cookieStore = await cookies();
  const resolvedSearchParams = await searchParams;
  const authMode = parseSparkleFinderAuthMode(cookieStore.get(sparkleFinderAuthCookieName)?.value);
  const accountState = await getCurrentSparkleFinderAccount({ localPreviewAuthMode: authMode });

  return (
    <>
      <SparkleFinderNav accountState={accountState} />
      {renderAccountPageContent(accountState, undefined, getAccountNotice(resolvedSearchParams))}
    </>
  );
}

export function renderAccountPageContent(accountState: CurrentSparkleFinderAccountState, now?: Date, notice?: AccountNotice | null) {
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

  const completion = getAccountCompletionState(accountState);

  return (
    <main className="min-h-screen bg-[var(--sparkle-shell)] px-5 py-8 sm:px-8 lg:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-5">
        <section className="grid gap-2">
          <p className="text-sm font-bold uppercase tracking-wide text-[var(--sparkle-coral)]">Account</p>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold text-[var(--sparkle-plum-deep)]">Sparkle Finder account</h1>
            <RepBadge repIdentity={getSelfFacingRepIdentity(accountState)} />
          </div>
          <p className="max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Manage the signed-in profile, privacy choices, and Silver access attached to verified account data.
          </p>
        </section>

        {notice ? <AccountNoticePanel notice={notice} /> : null}
        {!completion.isComplete ? <AccountCompletionPanel /> : null}
        <SilverStatusPanel accountState={accountState} now={now} />
        <AccountPreferences accountState={accountState} />
      </div>
    </main>
  );
}

function AccountNoticePanel({ notice }: { notice: AccountNotice }) {
  const className =
    notice.tone === "success"
      ? "border-[var(--sparkle-border)] bg-white text-[var(--sparkle-plum-deep)]"
      : "border-[var(--sparkle-coral)] bg-white text-[var(--sparkle-plum-deep)]";

  return (
    <section className={`grid gap-1 rounded-[var(--sparkle-radius-sm)] border p-4 shadow-[var(--sparkle-shadow-sm)] ${className}`}>
      <h2 className="text-base font-bold">{notice.title}</h2>
      <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">{notice.body}</p>
    </section>
  );
}

function getAccountNotice(searchParams: AccountSearchParams | undefined): AccountNotice | null {
  const message = firstParamValue(searchParams?.message);
  const error = firstParamValue(searchParams?.error);

  if (message === "profile_saved") {
    return {
      tone: "success",
      title: "Profile saved",
      body: "Your Sparkle Finder profile basics were updated.",
    };
  }

  if (message === "preferences_saved") {
    return {
      tone: "success",
      title: "Preferences saved",
      body: "Your Sparkle Finder communication preferences were updated.",
    };
  }

  if (message === "silver_trial_ended") {
    return {
      tone: "success",
      title: "Silver trial ended",
      body: "Your account is now on Free access. You can continue Silver from billing when you are ready.",
    };
  }

  if (error === "missing_display_name") {
    return {
      tone: "error",
      title: "Display name needed",
      body: "Add a display name before saving your profile basics.",
    };
  }

  if (error === "profile_update_failed") {
    return {
      tone: "error",
      title: "Profile was not saved",
      body: "Sparkle Finder could not save those profile basics. Please check the fields and try again.",
    };
  }

  if (error === "preferences_update_failed") {
    return {
      tone: "error",
      title: "Preferences were not saved",
      body: "Sparkle Finder could not save those communication preferences. Please try again.",
    };
  }

  if (error === "account_unavailable") {
    return {
      tone: "error",
      title: "Account unavailable",
      body: "Sparkle Finder could not verify the signed-in account. Please sign out and sign back in.",
    };
  }

  return null;
}

function firstParamValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function AccountCompletionPanel() {
  return (
    <section className="grid gap-2 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
      <h2 className="text-xl font-bold text-[var(--sparkle-plum-deep)]">Complete your Sparkle Finder account</h2>
      <p className="max-w-3xl text-sm leading-6 text-[var(--sparkle-ink-muted)]">
        Google sign-in created your secure login. Add the remaining details needed for trial protection, account support, and privacy acknowledgment.
      </p>
    </section>
  );
}

function getSelfFacingRepIdentity(accountState: CurrentSparkleFinderAccountState): SparkleSuiteRepIdentity | undefined {
  if (accountState.repIdentity) {
    return accountState.repIdentity;
  }

  if (!accountState.repEntitlement) {
    return undefined;
  }

  return {
    sparkleSuiteRepId: accountState.repEntitlement.sparkleSuiteRepId,
    businessName: accountState.repEntitlement.businessName,
    publicDiscoveryEnabled: accountState.repEntitlement.publicDiscoveryEnabled,
  };
}
