export type SparkleFinderCopyViolation = {
  phrase: string;
  index: number;
  match: string;
};

const BANNED_COPY_PATTERNS: Array<{ phrase: string; pattern: RegExp }> = [
  { phrase: "buy, sell", pattern: /\bbuy\s*,\s*sell\b/i },
  { phrase: "buy and sell", pattern: /\bbuy\s+(?:\/|and)\s+sell\b/i },
  { phrase: "buy/sell", pattern: /\bbuy\s*\/\s*sell\b/i },
  { phrase: "marketplace", pattern: /\bmarketplace\b/i },
  { phrase: "customer-to-customer", pattern: /\bcustomer\s*(?:-to-|to\s*)customer\b/i },
  { phrase: "customer trading", pattern: /\bcustomer\s+trading\b/i },
  { phrase: "official bomb party partner", pattern: /\bofficial\s+bomb\s+party\s+partners?\b/i },
  { phrase: "official bomb party partnership", pattern: /\bofficial\s+bomb\s+party\s+partnership\b/i },
  { phrase: "official bomb party finder", pattern: /\bofficial\s+bomb\s+party\s+(?:finder|app|platform|hub|tool|service)\b/i },
  { phrase: "bomb party partnership", pattern: /\bbomb\s+party\s+partnership\b/i },
  { phrase: "amethyst", pattern: /\bamethyst\b/i },
  { phrase: "rarity score", pattern: /\brarity\s+(?:score|scoring|rank|ranking|rating|grade)\b/i },
  { phrase: "annual silver plan", pattern: /\bannual\s+silver\s+(?:plan|membership|subscription)\b/i },
  { phrase: "annual silver membership", pattern: /\bannual\s+silver\s+membership\b/i },
  { phrase: "yearly silver plan", pattern: /\byearly\s+silver\s+(?:plan|membership|subscription)\b/i },
  { phrase: "unlimited ai", pattern: /\bunlimited\s+ai\b/i },
  { phrase: "open-ended nic-nac chat", pattern: /\bopen\s*-\s*ended\s+nic\s*-\s*nac\s+(?:chat|search|conversation|assistant)\b/i },
  { phrase: "open-ended nic-nac search", pattern: /\bopen\s*-\s*ended\s+nic\s*-\s*nac\s+search\b/i },
  { phrase: "social feed", pattern: /\bsocial\s+feed\b/i },
  { phrase: "message board", pattern: /\bmessage\s+board\b/i },
];

export function findSparkleFinderCopyViolations(copy: string): SparkleFinderCopyViolation[] {
  return BANNED_COPY_PATTERNS.flatMap(({ phrase, pattern }) => {
    const match = pattern.exec(copy);

    if (!match) {
      return [];
    }

    return [
      {
        phrase,
        index: match.index,
        match: match[0],
      },
    ];
  }).sort((left, right) => left.index - right.index || left.phrase.localeCompare(right.phrase));
}
