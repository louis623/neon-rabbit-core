import Link from "next/link";

type SparkleFinderLogoProps = {
  className?: string;
};

export function SparkleFinderLogo({ className = "" }: SparkleFinderLogoProps) {
  return (
    <Link
      aria-label="Sparkle Finder by Sparkle Suite home"
      className={`sparkle-finder-logo ${className}`.trim()}
      href="/"
    >
      <span aria-hidden="true" className="sparkle-finder-seal">
        <span className="sparkle-finder-seal__letters">SF</span>
      </span>
      <span className="sparkle-finder-logo__wordmark">
        <span className="sparkle-finder-logo__name">Sparkle Finder</span>
        <span className="sparkle-finder-logo__byline">by Sparkle Suite</span>
      </span>
    </Link>
  );
}
