import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { SignupForm } from "@/components/account/SignupForm";
import { SparkleFinderNav } from "@/components/layout/SparkleFinderNav";
import { getLocalDevAuthState } from "@/lib/sparkle-finder/auth";

export default function SignUpPage() {
  return (
    <>
      <SparkleFinderNav accountState={getLocalDevAuthState("anonymous")} />
      <main className="min-h-screen bg-[var(--sparkle-warm-bg)] px-5 py-10 sm:px-8">
        <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
          <div className="grid gap-5">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--sparkle-coral)]">
              Sparkle Finder account
            </p>
            <h1 className="font-[family-name:var(--font-playfair)] text-4xl font-semibold leading-tight text-[var(--sparkle-plum-deep)]">
              Start your 45-day Silver trial
            </h1>
            <p className="max-w-2xl text-base leading-7 text-[var(--sparkle-ink-muted)]">
              Create one Sparkle Finder account for the jewelry library, rep availability, and Silver collector tools.
              Your first 45 days include Silver access while the paid membership path is being connected.
            </p>
            <div className="grid gap-3 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]">
              <div className="flex items-start gap-3">
                <Sparkles aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
                <div>
                  <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">What Silver starts with</h2>
                  <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
                    Profile and collection tools, focused Nic-Nac requests, and a smoother way to follow the pieces
                    you care about.
                  </p>
                </div>
              </div>
              <Link
                className="inline-flex w-fit items-center gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)] underline-offset-4 hover:underline"
                href="/auth/sign-in"
              >
                Already have an account?
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
            </div>
          </div>

          <SignupForm />
        </section>
      </main>
    </>
  );
}
