import type { SparkleFinderCustomerMemory } from "../customer-memory";

export type FinderNicNacToolIntent =
  | "memory"
  | "collection"
  | "showcase"
  | "catalog"
  | "studio"
  | "availability"
  | "profile"
  | "rep_discovery";

export function getFinderNicNacToolIntentsForText(text: string): FinderNicNacToolIntent[] {
  const normalized = text.toLowerCase();
  const intents: FinderNicNacToolIntent[] = [];
  const add = (intent: FinderNicNacToolIntent) => {
    if (!intents.includes(intent)) {
      intents.push(intent);
    }
  };
  const hasAny = (patterns: RegExp[]) => patterns.some((pattern) => pattern.test(normalized));

  if (
    hasAny([
      /\bremember\b/,
      /\bi collect\b/,
      /\bmy style\b/,
      /\bi (love|like|prefer|hate)\b/,
      /\balways\b/,
      /\bcurrent hunt\b/,
      /\bhunting\b/,
      /\bfavorite reps?\b/,
      /\bfavourite reps?\b/,
      /\bbuy from\b/,
    ])
  ) {
    add("memory");
  }

  if (
    hasAny([
      /\bfavorite reps?\b/,
      /\bfavourite reps?\b/,
      /\bmy rep\b/,
      /\bfind .*rep\b/,
      /\brep near me\b/,
      /\blive show\b/,
      /\bnext live\b/,
      /\bwho has\b/,
      /\bbuy from\b/,
      /\bkelli\b/,
      /\blindsey\b/,
      /\blindsay\b/,
    ])
  ) {
    add("rep_discovery");
  }

  if (hasAny([/\b(upload|missing|label|photo|picture|image|studio)\b/])) {
    add("studio");
  }

  if (hasAny([/\badd\b/, /\bown\b/, /\bowned\b/, /\bcollection\b/, /\bwishlist\b/, /\bwatchlist\b/, /\blooking for\b/, /\biso\b/])) {
    add("collection");
  }

  if (hasAny([/\bshowcase\b/, /\bpublic\b/, /\bprivate\b/, /\breveal story\b/, /\brarest\b/])) {
    add("showcase");
  }

  if (hasAny([/\bsearch\b/, /\blibrary\b/, /\bitem number\b/, /\b[A-Z]{1,4}\d{3,}\b/i])) {
    add("catalog");
  }

  if (hasAny([/\bfind this\b/, /\bwho has\b/, /\blead\b/, /\bavailability\b/])) {
    add("availability");
  }

  if (hasAny([/\bprofile\b/, /\bbio\b/, /\btiktok\b/, /\bdisplay name\b/])) {
    add("profile");
  }

  return intents.length ? intents : ["memory"];
}

export function summarizeFinderNicNacMemoryHints(
  memories: Pick<SparkleFinderCustomerMemory, "summary">[],
): string[] {
  return memories
    .map((memory) => memory.summary.trim())
    .filter(Boolean)
    .slice(0, 4);
}
