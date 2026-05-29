import { BookOpen, Gem, ShoppingBag, UserRound, UsersRound, Video } from "lucide-react";
import { SparkleFinderLogo } from "@/components/brand/SparkleFinderLogo";

const navItems = [
  { label: "Library", href: "#library", icon: BookOpen },
  { label: "Live Shows", href: "#live-shows", icon: Video },
  { label: "Rep Boards", href: "#rep-boards", icon: UsersRound },
  { label: "Diamonds & Unicorns", href: "#diamonds-unicorns", icon: Gem },
  { label: "Shop", href: "#shop", icon: ShoppingBag },
  { label: "Account", href: "#account", icon: UserRound },
];

export function SparkleFinderNav() {
  return (
    <header className="sparkle-finder-nav-shell">
      <div className="mx-auto flex min-h-[5.75rem] w-full max-w-7xl flex-col gap-4 px-5 py-4 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:gap-8 lg:py-0">
        <SparkleFinderLogo />
        <nav aria-label="Sparkle Finder primary navigation" className="overflow-x-auto">
          <ul className="flex min-w-max items-center gap-3">
            {navItems.map((item) => {
              const Icon = item.icon;

              return (
                <li key={item.label}>
                  <a aria-label={item.label} className="sparkle-finder-nav-link px-3" href={item.href}>
                    <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
