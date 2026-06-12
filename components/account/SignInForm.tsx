"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { KeyRound, Loader2, Mail } from "lucide-react";
import { getSparkleFinderOAuthRedirectTo } from "@/lib/sparkle-finder/oauth-redirect";
import { safeSparkleFinderNextPath } from "@/lib/sparkle-finder/safe-redirect";
import { createClient } from "@/lib/supabase/client";

const inputClassName =
  "min-h-11 rounded-[var(--sparkle-radius-sm)] border border-[var(--sparkle-border)] bg-white px-3 text-sm font-normal text-[var(--sparkle-ink)]";
const buttonClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--sparkle-radius-sm)] px-5 text-sm font-bold transition active:translate-y-px disabled:cursor-wait disabled:opacity-70";

type SignInFormProps = {
  nextPath?: string | null;
};

export function SignInForm({ nextPath = "/" }: SignInFormProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitMode, setSubmitMode] = useState<"password" | "google" | null>(null);
  const safeNextPath = safeSparkleFinderNextPath(nextPath);
  const signUpHref = safeNextPath === "/" ? "/auth/sign-up" : `/auth/sign-up?next=${encodeURIComponent(safeNextPath)}`;
  const isSubmitting = submitMode !== null;

  async function handlePasswordSignIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage(null);
    setSubmitMode("password");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setErrorMessage("Sparkle Finder could not sign you in with those credentials.");
        setSubmitMode(null);
        return;
      }

      window.location.assign(`/auth/post-login?next=${encodeURIComponent(safeNextPath)}`);
    } catch {
      setErrorMessage("Sparkle Finder sign-in is not configured in this environment.");
      setSubmitMode(null);
    }
  }

  async function handleGoogleSignIn() {
    setErrorMessage(null);
    setSubmitMode("google");

    try {
      const supabase = createClient();
      const redirectTo = getSparkleFinderOAuthRedirectTo(safeNextPath, window.location.origin);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });

      if (error) {
        setErrorMessage("Google sign-in could not be started. Please try again.");
        setSubmitMode(null);
      }
    } catch {
      setErrorMessage("Google sign-in is not configured in this environment.");
      setSubmitMode(null);
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
          aria-busy={submitMode === "password"}
          className={`${buttonClassName} bg-[var(--sparkle-plum)] text-white`}
          disabled={isSubmitting}
          type="submit"
        >
          {submitMode === "password" ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : <Mail aria-hidden="true" className="size-4" />}
          {submitMode === "password" ? "Signing in..." : "Sign in"}
        </button>
        <button
          aria-busy={submitMode === "google"}
          className={`${buttonClassName} border border-[var(--sparkle-border-strong)] bg-white text-[var(--sparkle-plum-deep)]`}
          disabled={isSubmitting}
          onClick={handleGoogleSignIn}
          type="button"
        >
          {submitMode === "google" ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
          {submitMode === "google" ? "Opening Google..." : "Continue with Google"}
        </button>
      </div>

      <p className="text-sm leading-6 text-[var(--sparkle-ink-muted)]">
        New to Sparkle Finder?{" "}
        <Link
          className="font-bold text-[var(--sparkle-plum-deep)] underline-offset-4 hover:underline"
          href={signUpHref}
        >
          Create an account
        </Link>
      </p>
    </form>
  );
}
