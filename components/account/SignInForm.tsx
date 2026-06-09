"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { KeyRound, Mail } from "lucide-react";
import { getSparkleFinderOAuthRedirectTo } from "@/lib/sparkle-finder/oauth-redirect";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";

type SignInFormProps = {
  nextPath?: string | null;
};

export function SignInForm({ nextPath = "/" }: SignInFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const safeNextPath = safeSparkleFinderNextPath(nextPath);

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage("Sparkle Finder could not sign you in with those credentials.");
        setIsSubmitting(false);
        return;
      }

      window.location.assign(`/auth/post-login?next=${encodeURIComponent(safeNextPath)}`);
    } catch {
      setErrorMessage("Sparkle Finder sign-in is not configured in this environment.");
      setIsSubmitting(false);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const supabase = createClient();
      const redirectTo = getSparkleFinderOAuthRedirectTo(safeNextPath, window.location.origin);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setErrorMessage("Google sign-in could not be started. Please try again.");
        setIsSubmitting(false);
      }
    } catch {
      setErrorMessage("Google sign-in is not configured in this environment.");
      setIsSubmitting(false);
    }
  }

  return (
    <form
      aria-label="Sparkle Finder sign-in form"
      className="grid gap-4 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-[var(--sparkle-paper)] p-5 shadow-[var(--sparkle-shadow-sm)]"
      onSubmit={handlePasswordSignIn}
    >
      <div className="flex items-start gap-3">
        <KeyRound aria-hidden="true" className="mt-1 size-5 text-[var(--sparkle-coral)]" />
        <div>
          <h2 className="text-lg font-bold text-[var(--sparkle-plum-deep)]">Sign in</h2>
          <p className="mt-1 text-sm leading-6 text-[var(--sparkle-ink-muted)]">
            Use your email and password, or continue with Google if your account uses Google sign-in.
          </p>
        </div>
      </div>

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

      <label className="grid gap-2 text-sm font-bold text-[var(--sparkle-plum-deep)]">
        Password
        <input autoComplete="current-password" className={inputClassName} name="password" required type="password" />
      </label>

      {errorMessage ? (
        <p className="rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white p-3 text-sm font-semibold leading-6 text-[var(--sparkle-plum-deep)]">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] bg-[var(--sparkle-plum)] px-5 text-sm font-bold text-white disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          <Mail aria-hidden="true" className="size-4" />
          Sign in
        </button>
        <button
          className="inline-flex min-h-11 items-center justify-center rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border-strong)] bg-white px-5 text-sm font-bold text-[var(--sparkle-plum-deep)] disabled:opacity-60"
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
          type="button"
        >
          Continue with Google
        </button>
      </div>

      <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
        New to Sparkle Finder?{" "}
        <Link
          className="font-bold text-[var(--sparkle-plum-deep)] underline-offset-4 hover:underline"
          href="/auth/sign-up"
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
