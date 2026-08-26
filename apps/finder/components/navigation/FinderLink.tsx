import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

type FinderLinkProps = LinkProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href">;

export function FinderLink({ href, rel, target, ...props }: FinderLinkProps) {
  const opensOutsideFinder = isExternalWebHref(href);

  return (
    <Link
      {...props}
      href={href}
      rel={rel ?? (opensOutsideFinder ? "noopener noreferrer" : undefined)}
      target={target ?? (opensOutsideFinder ? "_blank" : undefined)}
    />
  );
}

export function isExternalWebHref(href: LinkProps["href"]): boolean {
  if (typeof href !== "string") {
    return false;
  }

  try {
    const url = new URL(href);

    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
