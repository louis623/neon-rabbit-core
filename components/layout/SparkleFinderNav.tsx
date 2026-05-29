import Link from "next/link";
import { BookOpen, Gem, ShoppingBag, UserRound, UsersRound, Video } from "lucide-react";
import { SparkleFinderLogo } from "@/components/brand/SparkleFinderLogo";
import { getLocalDevAuthState } from "@/lib/sparkle-finder/auth";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";

const navItems = [
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Live Shows", href: "/live-shows", icon: Video },
  { label: "Rep Boards", href: "/rep-boards", icon: UsersRound },
  { label: "Diamonds & Unicorns", href: "/diamonds-unicorns", icon: Gem },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
];

type SparkleFinderNavProps = {
  accountState?: SparkleFinderAccountState;
};

export function SparkleFinderNav({ accountState = getLocalDevAuthState() }: SparkleFinderNavProps = {}) {
  const accountLabel = getAccountLabel(accountState);

  return (
    <header className="sparkle-finder-nav-shell" data-smoke="nav">
      <div className="mx-auto flex min-h-[5.75rem] w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-0">
        <SparkleFinderLogo />
        <nav aria-label="Sparkle Finder primary navigation" className="overflow-x-auto">
          <ul className="flex min-w-max items-center gap-3">
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
              <Link aria-label="Account" className="sparkle-finder-nav-link px-3" href="/auth/sign-in">
                <UserRound aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                <span>{accountLabel}</span>
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}

function getAccountLabel(accountState: SparkleFinderAccountState): string {
  if (accountState.status === "anonymous") {
    return "Guest";
  }

  return accountState.tier === "silver" ? "Silver" : "Free";
}
