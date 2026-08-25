import Link from "next/link";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { getLocalDevAuthState } from "@/lib/sparkle-finder/auth";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { requestPasswordReset } from "./actions";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";
const buttonClassName =
  "inline-flex min-h-11 w-fit items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-70";

type ForgotPasswordPageProps = {
  searchParams?: Promise<ForgotPasswordSearchParams> | ForgotPasswordSearchParams;
};

type ForgotPasswordSearchParams = Record<string, string | string[] | undefined>;

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps = {}) {
  return renderForgotPasswordPageContent(await Promise.resolve(searchParams ?? {}));
}

export function renderForgotPasswordPageContent(searchParams: ForgotPasswordSearchParams = {}) {
  const nextPath = safeSparkleFinderNextPath(getSearchParam(searchParams.next) ?? "/");
  const notice = getForgotPasswordNotice(getSearchParam(searchParams.message), getSearchParam(searchParams.error));
  const signInHref = nextPath === "/" ? "/auth/sign-in" : `/auth/sign-in?next=${encodeURIComponent(nextPath)}`;

  return (
    <>
      <SparkleFinderNav accountState={getLocalDevAuthState("anonymous")} variant="public" />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)] px-5 py-10 sm:px-8">
        <section className="mx-auto grid max-w-3xl gap-6">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)] underline-offset-4 hover:underline"
            href={signInHref}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            Back to sign in
          </Link>

          <form
            action={requestPasswordReset}
            aria-label="Sparkle Finder password reset request form"
            className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
          >
            <div className="flex items-start gap-3">
              <KeyRound aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
                  Account recovery
                </p>
                <h1 className="mt-2 font-[family-name:var(--font-playfair)] text-3xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
                  Reset your Sparkle Finder password
                </h1>
                <p className="mt-2 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                  Enter your account email and Sparkle Finder will send a reset link if that email is on file.
                </p>
              </div>
            </div>

            <input name="next" type="hidden" value={nextPath} />

            {notice ? (
              <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm font-semibold leading-6 text-[var(--sparkle-plum-deep)]">
                {notice}
              </p>
            ) : null}

            <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
              Email
              <input
                autoComplete="email"
                className={inputClassName}
                name="email"
                placeholder="you@example.com"
                required
                type="email"
              />
            </label>

            <button className={`${buttonClassName} bg-[var(--sparkle-plum)] text-white`} type="submit">
              <Mail aria-hidden="true" className="size-4" />
              Email reset link
            </button>
          </form>
        </section>
      </main>
    </>
  );
}

function getSearchParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function getForgotPasswordNotice(message: string | undefined, error: string | undefined): string | null {
  if (message === "check_email") {
    return "Check your email for a Sparkle Finder password reset link. If you do not see it, check spam or try again.";
  }

  if (error === "missing_email") {
    return "Enter the email address for your Sparkle Finder account.";
  }

  if (error === "reset_failed") {
    return "Sparkle Finder could not send that reset email. Try again in a moment or use Google if your account uses Google sign-in.";
  }

  return null;
}
