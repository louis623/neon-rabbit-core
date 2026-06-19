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
  { phrase: "marketplace", pattern: /\bmarketplace\b/i, allowComplianceContext: true },
  { phrase: "customer marketplace", pattern: /\bcustomer\s+marketplace\b/i, allowComplianceContext: true },
  { phrase: "customer-to-customer", pattern: /\bcustomer\s*(?:-to-|to\s*)customer\b/i, allowComplianceContext: true },
  { phrase: "customer trading", pattern: /\bcustomer\s+trading\b/i, allowComplianceContext: true },
  { phrase: "trade with this collector", pattern: /\btrade\s+with\s+this\s+collector\b/i, allowComplianceContext: true },
  { phrase: "buy from this member", pattern: /\bbuy(?:ing)?\s+from\s+(?:this\s+)?members?\b/i, allowComplianceContext: true },
  { phrase: "sell your jewelry", pattern: /\bsell(?:ing)?\s+(?:your\s+)?jewelry\b/i, allowComplianceContext: true },
  { phrase: "message seller", pattern: /\bmessage\s+seller\b/i, allowComplianceContext: true },
  { phrase: "friend request", pattern: /\bfriend\s+requests?\b/i, allowComplianceContext: true },
  { phrase: "dm me", pattern: /\bdm\s+me\b|\bdms?\b/i, allowComplianceContext: true },
  { phrase: "escrow", pattern: /\bescrow\b/i, allowComplianceContext: true },
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
  { phrase: "amazon product url", pattern: /https?:\/\/(?:www\.)?amazon\.[^\s/]+\/(?:[^?\s#]+\/)?(?:dp|gp\/product)\/[A-Z0-9]{10}\b[^\s]*[?&]tag=/i },
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
  const sentenceStart = getSentenceStart(copy, matchIndex);
  const sentence = getSentenceAtIndex(copy, matchIndex);
  const localMatchIndex = matchIndex - sentenceStart;
  const clause = getClauseAtIndex(sentence, localMatchIndex);

  return [
    /\bdo\s+not\s+(?:use|request|arrange|suggest|add|create)\b/i,
    /\b(?:Sparkle Finder|this service|the app|this app|the platform)\s+does\s+not\s+(?:make|process|provide|manufacture|sell|ship|warrant|guarantee)\b/i,
    /\bdon't\s+(?:use|request|arrange|suggest|add|create)\b/i,
    /\bdo\s+not\s+call\s+products?\s+(?:guaranteed|perfect\s+for\s+everyone|must\s*-\s*have)\b/i,
    /\bnot\s+call\s+products?\s+(?:guaranteed|perfect\s+for\s+everyone|must\s*-\s*have)\b/i,
    /\bnot\s+a\s+jewelry\s+marketplace\b/i,
    /\bnot\s+an?\s+escrow\s+(?:or\s+fulfillment\s+)?service\b/i,
    /\bnot\s+an?\s+fulfillment\s+(?:or\s+escrow\s+)?service\b/i,
    /\b(?:is|are)\s+prohibit(?:ed)?\b/i,
    /\bshould\s+not\s+(?:use|request|arrange|suggest|add|create|call)\b/i,
    /\bmust\s+not\s+(?:use|request|arrange|suggest|add|create)\b/i,
    /\bno\b(?=.*\bcan\s+be\s+guaranteed\b)/i,
  ].some((pattern) => pattern.test(clause)) || isSupportedSurfaceDisclaimer(sentence, localMatchIndex);
}

function isSupportedSurfaceDisclaimer(sentence: string, localMatchIndex: number): boolean {
  const supportMatch =
    /\b(?:Sparkle Finder|this service|the app|this app|the platform)\s+does\s+not\s+support\s+/i.exec(sentence);

  if (!supportMatch) {
    return false;
  }

  const supportListStart = supportMatch.index + supportMatch[0].length;
  const allowedSurfacePattern =
    /\b(?:DMs?|friend requests?|customer-to-customer(?:\s+jewelry)?\s+trading|customer-to-customer marketplace workflows?|customer marketplace features|escrow|payment|fulfillment|disputes|buying from members|selling your jewelry|message seller workflows?)\b/gi;

  for (const surfaceMatch of sentence.slice(supportListStart).matchAll(allowedSurfacePattern)) {
    if (surfaceMatch.index === undefined) {
      continue;
    }

    const surfaceStart = supportListStart + surfaceMatch.index;
    const surfaceEnd = surfaceStart + surfaceMatch[0].length;

    if (localMatchIndex >= surfaceStart && localMatchIndex < surfaceEnd) {
      return true;
    }
  }

  return false;
}

function getSentenceAtIndex(copy: string, matchIndex: number): string {
  const sentenceStart = getSentenceStart(copy, matchIndex);
  const sentenceEnd = findNextBoundary(copy, matchIndex, /[.?!\n]/g);

  return copy.slice(sentenceStart, sentenceEnd === -1 ? undefined : sentenceEnd + 1);
}

function getSentenceStart(copy: string, matchIndex: number): number {
  return findPreviousBoundary(copy, matchIndex, /[.?!\n]/g) + 1;
}

function getClauseAtIndex(sentence: string, localMatchIndex: number): string {
  const beforeMatch = sentence.slice(0, localMatchIndex);
  const clauseStart = findPreviousBoundary(beforeMatch, beforeMatch.length, /[;\n]|,\s+(?=(?:use|try|open|join|visit)\b)/gi) + 1;
  const clauseEnd = findNextClauseBoundary(sentence, localMatchIndex);

  return sentence.slice(clauseStart, clauseEnd === -1 ? undefined : clauseEnd);
}

function findPreviousBoundary(copy: string, endIndex: number, pattern: RegExp): number {
  let boundary = -1;
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);

  for (const match of copy.slice(0, endIndex).matchAll(globalPattern)) {
    if (match.index !== undefined) {
      boundary = match.index;
    }
  }

  return boundary;
}

function findNextBoundary(copy: string, startIndex: number, pattern: RegExp): number {
  const globalPattern = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
  const match = globalPattern.exec(copy.slice(startIndex));

  return match?.index === undefined ? -1 : startIndex + match.index;
}

function findNextClauseBoundary(sentence: string, localMatchIndex: number): number {
  const afterMatch = sentence.slice(localMatchIndex);
  const semicolonEnd = afterMatch.search(/[;\n]/);
  const commaEnd = afterMatch.search(/,\s+(?=(?:use|try|open|join|visit)\b)/i);
  const clauseEndCandidates = [semicolonEnd, commaEnd]
    .filter((index) => index !== -1)
    .map((index) => localMatchIndex + index);
  const clauseEnd = clauseEndCandidates.length > 0 ? Math.min(...clauseEndCandidates) : sentence.length;

  return clauseEnd;
}
