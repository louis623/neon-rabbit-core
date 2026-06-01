import Link from "next/link";
import { BookOpen, ShoppingBag, UserRound, UsersRound, Video } from "lucide-react";
import { SparkleFinderLogo } from "@/components/brand/SparkleFinderLogo";
import { getLocalDevAuthState } from "@/lib/sparkle-finder/auth";
import { getSparkleFinderNavStatusLabel } from "@/lib/sparkle-finder/account-service";
import type { SparkleFinderAccountState } from "@/lib/sparkle-finder/auth";

const navItems = [
  { label: "Library", href: "/library", icon: BookOpen },
  { label: "Live Shows", href: "/live-shows", icon: Video },
  { label: "Rep Boards", href: "/rep-boards", icon: UsersRound },
  { label: "Shop", href: "/shop", icon: ShoppingBag },
];

type SparkleFinderNavProps = {
  accountState?: SparkleFinderAccountState;
};

export function SparkleFinderNav({ accountState = getLocalDevAuthState() }: SparkleFinderNavProps = {}) {
  const accountLabel = getSparkleFinderNavStatusLabel(accountState);

  return (
    <header className="sparkle-finder-nav-shell" data-smoke="nav">
      <div className="mx-auto flex min-h-[5.05rem] w-full max-w-[112rem] flex-col gap-3 px-5 py-3 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-6 lg:px-10 lg:py-0">
        <SparkleFinderLogo />
        <nav aria-label="Sparkle Finder primary navigation" className="-mx-2 overflow-x-auto px-2 pb-1 lg:mx-0 lg:px-0 lg:pb-0">
          <ul className="flex min-w-max items-center gap-2 lg:gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <Link aria-label={item.label} className="sparkle-finder-nav-link px-2.5 sm:px-3" href={item.href}>
                    <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </Link>
                </li>
              );
            })}
            <li>
              <Link aria-label="Account" className="sparkle-finder-nav-link px-2.5 sm:px-3" href="/auth/sign-in">
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
