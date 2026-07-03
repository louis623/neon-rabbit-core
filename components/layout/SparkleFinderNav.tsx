import Link from "next/link";
import { BookOpen, Home, LogOut, Menu, Search, UserRound } from "lucide-react";
import { SparkleFinderLogo } from "@/components/brand/SparkleFinderLogo";
import { getLocalDevAuthState, isSparkleFinderSignedIn } from "@/lib/sparkle-finder/auth";
import { getSparkleFinderNavStatusLabel } from "@/lib/sparkle-finder/account-service";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";

const navItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Find", href: "/#find-a-piece", icon: Search },
];

type SparkleFinderNavProps = {
  accountState?: SparkleFinderAccountState;
  variant?: "app" | "public";
};

export function SparkleFinderNav({ accountState = getLocalDevAuthState(), variant = "app" }: SparkleFinderNavProps = {}) {
  const isSignedIn = isSparkleFinderSignedIn(accountState);
  const accountLabel = accountState.status === "anonymous" ? "Sign In" : getSparkleFinderNavStatusLabel(accountState);
  const accountHref = isSignedIn ? "/account" : "/auth/sign-in";
  const innerClassName =
    variant === "public"
      ? "mx-auto flex min-h-[5.05rem] w-full max-w-[112rem] items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10 lg:py-0"
      : "mx-auto flex min-h-[5.05rem] w-full max-w-[112rem] flex-col gap-3 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-10 lg:py-0";

  return (
    <header className="sparkle-finder-nav-shell" data-smoke="nav">
      <div className={innerClassName}>
        <SparkleFinderLogo />
        {variant === "public" ? (
          <nav aria-label="Sparkle Finder public navigation">
            <Link aria-label="Sign In" className="sparkle-finder-nav-link px-3" href="/auth/sign-in">
              <UserRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
              <span>Sign In</span>
            </Link>
          </nav>
        ) : (
          <>
            <nav aria-label="Sparkle Finder primary navigation" className="hidden lg:block">
              <ul className="flex items-center gap-3">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <li key={item.label}>
                      <Link aria-label={item.label} className="sparkle-finder-nav-link px-3" href={item.href}>
                        <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
                <li>
                  <Link aria-label="Account" className="sparkle-finder-nav-link px-3" href={accountHref}>
                    <UserRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                    <span>{accountLabel}</span>
                  </Link>
                </li>
              </ul>
            </nav>
            <details className="sparkle-finder-mobile-menu lg:hidden">
              <summary>
                <Menu aria-hidden="true" className="size-5" strokeWidth={1.8} />
                <span>Menu</span>
              </summary>
              <nav aria-label="Sparkle Finder mobile navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link href={item.href} key={item.label}>
                      <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
                <Link href={accountHref}>
                  <UserRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                  <span>{accountLabel}</span>
                </Link>
                {isSignedIn ? (
                  <Link href="/auth/sign-out">
                    <LogOut aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                    <span>Log Out</span>
                  </Link>
                ) : null}
              </nav>
            </details>
          </>
        )}
      </div>
    </header>
  );
}
