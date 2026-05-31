export type SparkleFinderCopyViolation = {
  phrase: string;
  index: number;
  match: string;
};

type SparkleFinderCopyRule = {
  phrase: string;
  pattern: RegExp;
  allowComplianceContext?: boolean;
};

const BANNED_COPY_RULES: SparkleFinderCopyRule[] = [
  { phrase: "buy, sell", pattern: /\bbuy\s*,\s*sell\b/i },
  { phrase: "buy and sell", pattern: /\bbuy\s+(?:\/|and)\s+sell\b/i },
  { phrase: "buy/sell", pattern: /\bbuy\s*\/\s*sell\b/i },
  { phrase: "marketplace", pattern: /(?<!not a jewelry )\bmarketplace\b/i },
  { phrase: "customer-to-customer", pattern: /\bcustomer\s*(?:-to-|to\s*)customer\b/i },
  { phrase: "customer trading", pattern: /\bcustomer\s+trading\b/i },
  { phrase: "best ever", pattern: /\bbest\s+ever\b/i, allowComplianceContext: true },
  { phrase: "guaranteed", pattern: /\bguaranteed\b/i, allowComplianceContext: true },
  { phrase: "perfect for everyone", pattern: /\bperfect\s+for\s+everyone\b/i, allowComplianceContext: true },
  { phrase: "official bomb party gear", pattern: /\bofficial\s+bomb\s+party\s+gear\b/i },
  { phrase: "official bomb party partner", pattern: /\bofficial\s+bomb\s+party\s+partners?\b/i },
  { phrase: "official bomb party partnership", pattern: /\bofficial\s+bomb\s+party\s+partnership\b/i },
  { phrase: "official bomb party finder", pattern: /\bofficial\s+bomb\s+party\s+(?:finder|app|platform|hub|tool|service)\b/i },
  { phrase: "bomb party partnership", pattern: /\bbomb\s+party\s+partnership\b/i },
  { phrase: "must-have", pattern: /\bmust\s*-\s*have\b|\b(?:a|an|is|are|this|these)\s+must\s+have\b/i, allowComplianceContext: true },
  { phrase: "buy now", pattern: /\bbuy\s+now\b/i },
  { phrase: "live price", pattern: /\blive\s+prices?\b|\b(?:now|today|currently)\s+(?:only\s+)?\$[0-9]+(?:\.[0-9]{2})?\b/i, allowComplianceContext: true },
  { phrase: "copied retailer review", pattern: /\bcopied\s+(?:retailer\s+)?reviews?\b|\bretailer\s+review\s*:/i, allowComplianceContext: true },
  { phrase: "review count", pattern: /\b[0-9][0-9,]*\s+(?:customer\s+)?reviews?\b|\breview\s+count\b/i, allowComplianceContext: true },
  { phrase: "star rating", pattern: /\brated\s+[0-9](?:\.[0-9])?\s+out\s+of\s+5\s+stars?\b|\b[0-9](?:\.[0-9])?\s*(?:\/|out\s+of)\s*5\s+stars?\b|\bstar\s+ratings?\b|\bratings?\b/i, allowComplianceContext: true },
  { phrase: "image source", pattern: /\bimage\s+source\s*:/i, allowComplianceContext: true },
  { phrase: "retailer image", pattern: /\bretailer\s+(?:images?|photos?)\b|\b(?:amazon|target|walmart|etsy)\s+retailer\s+(?:images?|photos?)\b/i, allowComplianceContext: true },
  { phrase: "exact product pick", pattern: /\bexact\s+product\s+picks?\b/i, allowComplianceContext: true },
  { phrase: "exact product selection", pattern: /\bexact\s+product\s+selections?\b/i, allowComplianceContext: true },
  { phrase: "amazon product url", pattern: /https?:\/\/(?:www\.)?amazon\.[^\s/]+\/(?:[^?\s#]+\/)?(?:dp|gp\/product)\/[A-Z0-9]{10}\b/i },
  { phrase: "amazon affiliate url", pattern: /https?:\/\/amzn\.to\/[^\s]+/i },
  { phrase: "walmart product url", pattern: /https?:\/\/(?:www\.)?walmart\.com\/ip\/[^\s]+/i },
  { phrase: "target product url", pattern: /https?:\/\/(?:www\.)?target\.com\/p\/[^\s]+/i },
  { phrase: "etsy product url", pattern: /https?:\/\/(?:www\.)?etsy\.com\/listing\/[^\s]+/i },
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
  const seenPhrases = new Set<string>();

  return BANNED_COPY_RULES.flatMap(({ phrase, pattern, allowComplianceContext }) => {
    return findPatternMatches(pattern, copy).flatMap((match) => {
      if (allowComplianceContext && isComplianceContext(copy, match.index)) {
        return [];
      }

      if (seenPhrases.has(phrase)) {
        return [];
      }

      seenPhrases.add(phrase);

      return [
        {
          phrase,
          index: match.index,
          match: match.text,
        },
      ];
    });
  }).sort((left, right) => left.index - right.index || left.phrase.localeCompare(right.phrase));
}

function findPatternMatches(pattern: RegExp, copy: string): Array<{ index: number; text: string }> {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const globalPattern = new RegExp(pattern.source, flags);
  const matches: Array<{ index: number; text: string }> = [];

  for (const match of copy.matchAll(globalPattern)) {
    if (match.index !== undefined) {
      matches.push({ index: match.index, text: match[0] });
    }
  }

  return matches;
}

function isComplianceContext(copy: string, matchIndex: number): boolean {
  const sentence = getSentenceAtIndex(copy, matchIndex);

  return /\b(?:do\s+not|does\s+not|don't|not\s+call|never\s+call|avoid|prohibit(?:ed)?|should\s+not|must\s+not)\b/i.test(sentence);
}

function getSentenceAtIndex(copy: string, matchIndex: number): string {
  const sentenceStart = getSentenceStart(copy, matchIndex);
  const sentenceEnd = copy.indexOf(".", matchIndex);

  return copy.slice(sentenceStart, sentenceEnd === -1 ? undefined : sentenceEnd + 1);
}

function getSentenceStart(copy: string, matchIndex: number): number {
  return Math.max(copy.lastIndexOf(".", matchIndex - 1), copy.lastIndexOf("\n", matchIndex - 1)) + 1;
}
