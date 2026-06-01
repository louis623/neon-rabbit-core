/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

const {
  TweaksPanel, useTweaks,
  TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakColor, TweakText
} = window;

const DEFAULTS = window.TRADE_TWEAK_DEFAULTS || {
  repName: "Sasha Rivera",
  businessName: "Sparkle by Sasha",
  liveState: "live",
  contentState: "populated",
  cardCount: 18,
  cardAspect: "square",
  tierVisibility: "rare",
  filterStyle: "dropdowns",
  demoSheet: "closed",
  showTicker: true,
  showHero: true,
  showFaq: true,
  showLegal: true,
  showFooter: true,
  showNicNac: true,
  tickerTopText: "Trade board open now | Item-for-item only | Same collection + same jewelry type | Birthday pieces can trade across months",
  tradeHeroTitle: "Trade for the piece you wanted to love.",
  tradeHeroSub: "This board is for item-for-item swaps only. Requests must stay within the same collection and the same jewelry type, with no pay-the-difference and no credit payouts.",
  primaryColor: "#5C0EFF",
  accentColor: "#FF1AC2",
  bgTone: "lavender",
  headingFont: "italiana",
  bodyFont: "inter",
  headingWeight: 600,
  shapeRadius: "soft",
  density: "regular",
  saturation: 90,
  preset: "amethyst",
  sparkleLevel: "glittery",
  bgTreatment: "confetti",
  cardSurface: "holographic",
  textureOverlay: "sparkle",
  buttonEnergy: "calm",
  ctaEmphasis: "standard",
  tradeFlair: "holo-unicorn",
  cursorEffect: "sparkle",
  tickerSpeed: 0.6,
  showSlots: false,
};

const CONTENT = window.AMETHYST_TRADE_TEMPLATE_DATA || {};
const BOOTSTRAP_LISTINGS = Array.isArray(window.AMETHYST_TRADE_BOARD_LISTINGS)
  ? window.AMETHYST_TRADE_BOARD_LISTINGS
  : [];
const TRADE_REQUEST_ENDPOINT = "/api/amethyst/trade-requests";
const TRADE_BOARD_ENDPOINT = "/api/amethyst/trade-board";
const TRADE_BOARD_REFRESH_MS = 45_000;
const DEFAULT_TRADE_REQUEST_ERROR = "We couldn't submit that request. Please try again.";

function isExternalHref(href) {
  return /^https?:\/\//.test(href || "");
}

function linkProps(href) {
  return isExternalHref(href)
    ? { href, target: "_blank", rel: "noreferrer noopener" }
    : { href: href || "#" };
}

const FOOTER_LINKS = CONTENT.footerLinks || {};
const FOOTER_SOCIALS = CONTENT.socialLinks || [];
const FOOTER_COLUMN = CONTENT.footerColumn || { title: "Trade Notes", links: [] };
const FAQ_CONTENT = CONTENT.faqAnswers || {};
const TRADE_RULES = CONTENT.tradeRules || [];
const HOME_HREF = FOOTER_LINKS.home || "/amethyst/Homepage.html";
const TRADE_BOARD_HREF = FOOTER_LINKS.tradeBoard || "/amethyst/Trade.html";
const JOIN_HREF = FOOTER_LINKS.joinTeam || "/amethyst/Join.html";
const SHOP_HREF = CONTENT.shopUrl || FOOTER_LINKS.catalog || "#";

const PRESETS = {
  amethyst: {
    sparkleLevel: "glittery", bgTreatment: "confetti", cardSurface: "holographic",
    textureOverlay: "sparkle", buttonEnergy: "calm", ctaEmphasis: "standard",
    tradeFlair: "holo-unicorn", cursorEffect: "sparkle", saturation: 130,
    bgTone: "lavender", primaryColor: "#5C0EFF", accentColor: "#FF1AC2",
    headingFont: "italiana", bodyFont: "inter", headingWeight: 600,
  },
  sparkle_suite_morganite: {
    sparkleLevel: "subtle", bgTreatment: "suite-paper", cardSurface: "warm-paper",
    textureOverlay: "none", buttonEnergy: "suite-lift", ctaEmphasis: "standard",
    tradeFlair: "soft-pink-lift", cursorEffect: "default", saturation: 104,
    bgTone: "suiteBlush", primaryColor: "#ee2c9b", accentColor: "#ff4cae",
    headingFont: "playfair", bodyFont: "dmSans", headingWeight: 500,
  },
  black_diamond: {
    sparkleLevel: "glittery", bgTreatment: "black-velvet", cardSurface: "dark-metallic",
    textureOverlay: "sparkle", buttonEnergy: "diamond-lift", ctaEmphasis: "standard",
    tradeFlair: "cyan-diamond", cursorEffect: "default", saturation: 112,
    bgTone: "blackDiamond", primaryColor: "#d4af37", accentColor: "#00d9ff",
    headingFont: "playfair", bodyFont: "dmSans", headingWeight: 600,
  },
  rose_gold: {
    sparkleLevel: "subtle", bgTreatment: "rose-gold-paper", cardSurface: "pearl-rose",
    textureOverlay: "none", buttonEnergy: "rose-gold-lift", ctaEmphasis: "standard",
    tradeFlair: "champagne-rose", cursorEffect: "default", saturation: 108,
    bgTone: "roseGold", primaryColor: "#e04f73", accentColor: "#f5c66d",
    headingFont: "playfair", bodyFont: "dmSans", headingWeight: 600,
  },
  garnet: {
    sparkleLevel: "subtle", bgTreatment: "garnet-shell", cardSurface: "blush-shell",
    textureOverlay: "none", buttonEnergy: "garnet-lift", ctaEmphasis: "standard",
    tradeFlair: "ruby-polish", cursorEffect: "default", saturation: 112,
    bgTone: "garnet", primaryColor: "#B91C1C", accentColor: "#920000",
    headingFont: "boska", bodyFont: "switzer", headingWeight: 600,
  },
  amber: {
    sparkleLevel: "subtle", bgTreatment: "amber-paper", cardSurface: "sunlit-pearl",
    textureOverlay: "none", buttonEnergy: "amber-pop", ctaEmphasis: "standard",
    tradeFlair: "citrine-glow", cursorEffect: "default", saturation: 116,
    bgTone: "amber", primaryColor: "#F97316", accentColor: "#761A00",
    headingFont: "melodrama", bodyFont: "nunito", headingWeight: 600,
  },
  velvet: {
    sparkleLevel: "glittery", bgTreatment: "velvet-orchid", cardSurface: "plush-orchid",
    textureOverlay: "sparkle", buttonEnergy: "velvet-lift", ctaEmphasis: "standard",
    tradeFlair: "orchid-gloss", cursorEffect: "default", saturation: 110,
    bgTone: "velvet", primaryColor: "#9333EA", accentColor: "#6300B9",
    headingFont: "bitter", bodyFont: "archivo", headingWeight: 600,
  },
  rose_quartz: {
    sparkleLevel: "glittery", bgTreatment: "quartz-paper", cardSurface: "pink-quartz",
    textureOverlay: "sparkle", buttonEnergy: "quartz-pop", ctaEmphasis: "standard",
    tradeFlair: "pink-spark", cursorEffect: "default", saturation: 114,
    bgTone: "roseQuartz", primaryColor: "#E879F9", accentColor: "#63146E",
    headingFont: "sharpie", bodyFont: "ranade", headingWeight: 600,
  },
};

const TONES = {
  lavender: { bg: "#E8DFF5", elevated: "#F2EBFA", deep: "#DCD0EE" },
  warm: { bg: "#FFF0E8", elevated: "#FFF7F1", deep: "#FFE2D0" },
  cool: { bg: "#E0EBFF", elevated: "#EEF3FF", deep: "#CFDFFF" },
  paper: { bg: "#FAF7F2", elevated: "#FFFFFF", deep: "#F0EAE0" },
  midnight: { bg: "#1A0F2E", elevated: "#241640", deep: "#100828" },
  neon: { bg: "#FFE6FA", elevated: "#FFF0FD", deep: "#FFD1F2" },
  suiteBlush: { bg: "#fcf8f6", elevated: "#fffefd", deep: "#f6ede8" },
  blackDiamond: { bg: "#080808", elevated: "#15110f", deep: "#030303" },
  roseGold: { bg: "#fff5f6", elevated: "#fffafa", deep: "#ffe8ec" },
  garnet: { bg: "#FFE5DD", elevated: "#fff8f5", deep: "#ffd0c4" },
  amber: { bg: "#FAFAFA", elevated: "#fffaf5", deep: "#ffe4cf" },
  velvet: { bg: "#FFE8FF", elevated: "#fff7ff", deep: "#f7c9ff" },
  roseQuartz: { bg: "#FAFAFA", elevated: "#fff7ff", deep: "#ffd8ff" },
};

const FONTS = {
  vend: '"Vend Sans", "Inter", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  serif: '"Fraunces", "Domine", Georgia, serif',
  italiana: '"Italiana", "Playfair Display", serif',
  playfair: '"Playfair Display", Georgia, serif',
  dmSans: '"DM Sans", "Inter", system-ui, sans-serif',
  boska: '"Boska", "Playfair Display", Georgia, serif',
  switzer: '"Switzer", "DM Sans", "Inter", system-ui, sans-serif',
  melodrama: '"Melodrama", "Playfair Display", Georgia, serif',
  nunito: '"Nunito", "DM Sans", system-ui, sans-serif',
  bitter: '"Bitter", Georgia, serif',
  archivo: '"Archivo", "DM Sans", system-ui, sans-serif',
  sharpie: '"Sharpie", "Quicksand", system-ui, sans-serif',
  ranade: '"Ranade", "Nunito", system-ui, sans-serif',
  bubbly: '"Quicksand", "Nunito", system-ui, sans-serif',
  chunky: '"Archivo Black", "Inter", sans-serif',
};

const COLLECTIONS = ["OG", "Birthday", "Spring Luxe", "Simply Studded", "Market Fresh", "Stacks"];
const TYPES = ["Ring", "Necklace", "Earrings", "Bracelet", "Pendant", "Stack"];
const MATERIALS = [
  "Sterling silver",
  "Triple-plated gold",
  "Nickel-free brass",
  "Gold vermeil",
  "Mixed alloy plating",
  "Silver-tone finish",
];
const STONES = ["Amethyst", "Opal", "Pearl", "Moonstone", "Citrine", "Topaz"];
const PIECE_NAMES = [
  "Halo Bloom Ring",
  "Velvet Hour Necklace",
  "Petal Drop Earrings",
  "Crescent Bracelet",
  "North Star Pendant",
  "Aurora Stack",
  "Lavender Tide Ring",
  "Birthday Spark Necklace",
  "Moon Petal Earrings",
  "Golden Glow Bracelet",
  "Starlight Pendant",
  "Rose Halo Stack",
];

const LIVE_QUEUE_NAMES = [
  "Jamie L.", "Priya M.", "Devon R.", "Carla J.", "Sophie A.", "Monique T.",
  "Riley B.", "Harper V.", "Tasha W.", "Megan C.", "Bailey H.", "Jordan P.",
  "Lindsey F.", "Cassie N.", "Avery D.", "Noelle K.", "Rae S.", "Mira T.",
  "Joelle G.", "Kelsey B.", "Danielle R.", "Heather M.", "Brittany J.", "Tori C.",
  "Amber L.", "Sadie P.", "Lauren E.", "Robin A.", "Faith D.", "Nicole V.",
];

const LIVE_QUEUE_ENTRIES = LIVE_QUEUE_NAMES.map((name, index) => ({
  position: index + 1,
  label:
    index === 0
      ? "Unboxing Now"
      : index === 1
        ? "On Deck"
        : index === 2
          ? "Up Next"
          : "In Queue",
  name,
  highlight: index === 0,
  marker: index === 0 ? "?" : "",
}));

function buildSamples(count) {
  const out = [];
  for (let i = 0; i < count; i++) {
    let tier = "everyday";
    if (i === 0) tier = "unicorn";
    else if (i === 1) tier = "diamond";

    const collection = COLLECTIONS[i % COLLECTIONS.length];
    const type = TYPES[i % TYPES.length];
    const material = MATERIALS[i % MATERIALS.length];
    const stone = STONES[i % STONES.length];
    const msrpBase = collection === "Birthday" ? 42 : collection === "OG" ? 39 : 48;
    out.push({
      id: i + 1,
      name: PIECE_NAMES[i % PIECE_NAMES.length] + (i >= PIECE_NAMES.length ? ` ${Math.floor(i / PIECE_NAMES.length) + 1}` : ""),
      tier,
      collection,
      type,
      material,
      stone,
      msrp: msrpBase + ((i * 7) % 18),
      size: type === "Ring" ? ["6", "7", "8", "9"][i % 4] : null,
      note: tier === "diamond"
        ? "Rare diamond listing - still item-for-item only."
        : tier === "unicorn"
          ? "Rare unicorn listing."
          : "Standard trade-board listing.",
      glyph: PIECE_NAMES[i % PIECE_NAMES.length].charAt(0),
      photoUrl: null,
    });
  }
  return out;
}

function normalizeBootstrapPiece(piece, index) {
  if (!piece || typeof piece !== "object") return null;

  const safeName = typeof piece.name === "string" && piece.name.trim()
    ? piece.name.trim()
    : `Trade Listing ${index + 1}`;
  const safeType = typeof piece.type === "string" && piece.type.trim()
    ? piece.type.trim()
    : "Jewelry";
  const safeTier = piece.tier === "diamond" || piece.tier === "unicorn" ? piece.tier : "everyday";
  const safeMsrp = typeof piece.msrp === "number" ? piece.msrp : null;

  return {
    id: piece.id || `bootstrap-${index + 1}`,
    name: safeName,
    collection: typeof piece.collection === "string" && piece.collection.trim()
      ? piece.collection.trim()
      : "Collection pending",
    type: safeType,
    material: typeof piece.material === "string" && piece.material.trim()
      ? piece.material.trim()
      : "Material pending",
    stone: typeof piece.stone === "string" && piece.stone.trim()
      ? piece.stone.trim()
      : "Stone pending",
    msrp: safeMsrp,
    size: typeof piece.size === "string" && piece.size.trim() ? piece.size.trim() : null,
    note: typeof piece.note === "string" && piece.note.trim()
      ? piece.note.trim()
      : "Item-for-item only. Requests must stay within the same collection and the same jewelry type.",
    glyph: typeof piece.glyph === "string" && piece.glyph.trim()
      ? piece.glyph.trim().charAt(0).toUpperCase()
      : safeName.charAt(0).toUpperCase(),
    tier: safeTier,
    photoUrl: typeof piece.photoUrl === "string" && piece.photoUrl.trim() ? piece.photoUrl.trim() : null,
  };
}

const EMPTY_FILTER_STATE = {
  collection: "all",
  type: "all",
  rarity: "all",
  material: "all",
  size: "all",
};

function getInitialTradeFilters() {
  if (typeof window === "undefined") {
    return EMPTY_FILTER_STATE;
  }

  const requestedCollection = new URLSearchParams(window.location.search).get("collection");
  if (!requestedCollection) {
    return EMPTY_FILTER_STATE;
  }

  return {
    ...EMPTY_FILTER_STATE,
    collection: requestedCollection,
  };
}

function deriveTradeBoardFilterOptions(listings) {
  const collections = new Set();
  const types = new Set();
  const materials = new Set();
  const sizes = new Set();
  const rarityTags = new Set();

  listings.forEach((listing) => {
    if (listing.collection) collections.add(listing.collection);
    if (listing.type) types.add(listing.type);
    if (listing.material) materials.add(listing.material);
    if (listing.size) sizes.add(listing.size);
    if (listing.tier === "diamond" || listing.tier === "unicorn") {
      rarityTags.add(listing.tier);
    }
  });

  const sortValues = (values) => [...values].sort((left, right) => left.localeCompare(right));

  return {
    collections: sortValues(collections),
    types: sortValues(types),
    materials: sortValues(materials),
    sizes: sortValues(sizes),
    rarityTags: sortValues(rarityTags),
  };
}

function filterCollectionOptions(collections, collectionSearch) {
  const query = collectionSearch.trim().toLowerCase();
  if (!query) return collections;
  return collections.filter((collection) => collection.toLowerCase().includes(query));
}

function filterTradeBoardListings(listings, filters) {
  return listings.filter((listing) => {
    if (filters.collection !== "all" && listing.collection !== filters.collection) return false;
    if (filters.type !== "all" && listing.type !== filters.type) return false;
    if (filters.rarity !== "all" && listing.tier !== filters.rarity) return false;
    if (filters.material !== "all" && listing.material !== filters.material) return false;
    if (filters.size !== "all" && listing.size !== filters.size) return false;
    return true;
  });
}

async function submitTradeRequestRequest(payload) {
  const response = await fetch(TRADE_REQUEST_ENDPOINT, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = new Error(body?.error || DEFAULT_TRADE_REQUEST_ERROR);
    error.code = body?.code || null;
    throw error;
  }

  return body;
}

async function fetchTradeBoardListings() {
  const response = await fetch(TRADE_BOARD_ENDPOINT, {
    headers: { accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) return null;
  const body = await response.json().catch(() => null);
  return Array.isArray(body?.listings) ? body.listings : null;
}

function countActiveTradeBoardFilters(filters) {
  return Object.values(filters).filter((value) => value !== "all").length;
}

function rarityLabel(rarity) {
  if (rarity === "diamond") return "Diamond";
  if (rarity === "unicorn") return "Unicorn";
  return "Everyday";
}

function SparkleFx({ level }) {
  const counts = { none: 0, subtle: 8, glittery: 24, maximum: 60 };
  const n = counts[level] || 0;
  const sparkles = useMemo(() => {
    return Array.from({ length: n }, () => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3,
      size: 0.5 + Math.random() * 1.2,
    }));
  }, [n]);

  if (!n) return null;

  return (
    <div className="hp-fx-layer" aria-hidden="true">
      {sparkles.map((sparkle, index) => (
        <span
          key={index}
          className="hp-fx-sparkle"
          style={{
            left: `${sparkle.left}%`,
            bottom: -20,
            animationDelay: `${sparkle.delay}s`,
            animationDuration: `${sparkle.duration}s`,
            transform: `scale(${sparkle.size})`,
          }}
        />
      ))}
    </div>
  );
}

function Header({ businessName }) {
  return (
    <header className="hp-header">
      <div className="hp-header-inner">
        <nav className="hp-header-nav" aria-label="Primary">
          <a {...linkProps(HOME_HREF)} className="hp-header-link">Home</a>
          <a {...linkProps(TRADE_BOARD_HREF)} className="hp-header-link" aria-current="page">Trade Board</a>
          <a {...linkProps(JOIN_HREF)} className="hp-header-link">Join Team</a>
        </nav>
        <div className="hp-brand">
          <div className="hp-brand-name slot" data-slot="business name">{businessName}</div>
          <div className="hp-brand-sub">Live jewelry reveals</div>
        </div>
        <a {...linkProps(SHOP_HREF)} className="hp-shop-btn">Shop -&gt;</a>
      </div>
    </header>
  );
}

function Ticker({ topText }) {
  const items = topText.split("|").map((item) => item.trim()).filter(Boolean);
  const trades = [
    { name: "OG Halo Bloom Ring", meta: "Ring / OG", tier: "" },
    { name: "Birthday Spark Necklace", meta: "Necklace / Birthday", tier: "" },
    { name: "North Star Pendant", meta: "Pendant / Spring Luxe", tier: "unicorn" },
    { name: "Aurora Stack", meta: "Stack / Stacks", tier: "diamond" },
  ];

  return (
    <div className="hp-ticker" aria-label="Customer site updates">
      <div className="hp-ticker-sr">
        <p>Announcements: {items.join("; ")}</p>
        <a {...linkProps(TRADE_BOARD_HREF)}>Browse current trade board highlights</a>
      </div>
      <div className="hp-ticker-row">
        <span className="hp-ticker-label">Announcements</span>
        <div className="hp-ticker-track" aria-hidden="true">
          {[...items, ...items, ...items].map((item, index) => (
            <span key={index} className="hp-ticker-item"><span className="dot" />{item}</span>
          ))}
        </div>
      </div>
      <div className="hp-ticker-row reverse">
        <span className="hp-ticker-label">Trade Board</span>
        <div className="hp-ticker-track" aria-hidden="true">
          {[...trades, ...trades, ...trades].map((trade, index) => (
            <a key={index} {...linkProps(TRADE_BOARD_HREF)} className="hp-ticker-trade">
              <span className={`pip ${trade.tier}`} />
              {trade.name} - {trade.meta}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveQueueStrip({ live, onOpen }) {
  if (!live) {
    return (
      <section className="hp-trade-preview">
        <div className="hp-trade-preview-inner">
          <div className="hp-trade-preview-head">
            <span className="live-dot" style={{ background: "var(--fg-muted)" }} />
            <span>Live Reveal Queue</span>
          </div>
          <div className="hp-trade-preview-items" style={{ color: "var(--fg-muted)" }}>
            No live queue right now. Check back Tuesday at 8pm CST.
          </div>
          <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ?</button>
        </div>
      </section>
    );
  }

  return (
    <section className="hp-trade-preview">
      <div className="hp-trade-preview-inner">
        <div className="hp-trade-preview-head">
          <span className="live-dot" />
          <span>Live Reveal Queue</span>
        </div>
        <div className="hp-trade-preview-items">
          {LIVE_QUEUE_ENTRIES.slice(0, 2).map((entry) => (
            <button key={entry.position} type="button" onClick={onOpen} className="hp-trade-preview-pill">
              <span className="pos">{entry.position}</span>
              <span className="meta">
                <span className="label">{entry.label}</span>
                <span className="name">{entry.name}</span>
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ?</button>
      </div>
    </section>
  );
}

function LiveQueueModal({ open, onClose, live }) {
  if (!open) return null;

  return (
    <div className="hp-queue-modal-mask" onClick={onClose}>
      <div className="hp-queue-modal" onClick={(event) => event.stopPropagation()}>
        <div className="hp-queue-modal-head">
          <div>
            <div className="hp-queue-modal-eyebrow">Live Reveal Queue</div>
            <h2 className="hp-queue-modal-title">
              {live ? "Full queue for tonight's reveal." : "Queue opens when the live starts."}
            </h2>
          </div>
          <button type="button" className="hp-queue-modal-close" onClick={onClose} aria-label="Close queue">
            &times;
          </button>
        </div>
        {live ? (
          <div className="hp-queue-modal-list">
            {LIVE_QUEUE_ENTRIES.map((entry) => (
              <div key={entry.position} className={`hp-queue-modal-row ${entry.highlight ? "now" : ""}`}>
                <span className="pos">{entry.position}</span>
                <div className="meta">
                  <span className="label">{entry.label}</span>
                  <span className="name">{entry.name}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="hp-queue-modal-empty">
            No live queue right now. Check back Tuesday at 8pm CST.
          </div>
        )}
      </div>
    </div>
  );
}

function TradeHero({ tweakRepName, tweakHeroTitle, tweakHeroSub }) {
  return (
    <section className="tp-hero">
      <div className="tp-hero-inner">
        <div className="tp-hero-eyebrow">Trade Board</div>
        <h1 className="tp-hero-title slot" data-slot="trade hero title">{tweakHeroTitle}</h1>
        <p className="tp-hero-sub slot" data-slot="trade hero sub">
          {tweakHeroSub} Browse what <span className="slot" data-slot="rep name">{tweakRepName}</span> has available, then request the closest fit you love.
        </p>
        <div className="tp-card-rep">
          Matching is based on same collection and same jewelry type. Bomb Party MSRP can stay visible for context, but it does not drive eligibility.
        </div>
      </div>
    </section>
  );
}

function RulesStrip() {
  return (
    <section className="tp-filters tp-rules-strip">
      <div className="tp-filters-row">
        {TRADE_RULES.map((rule, index) => (
          <span key={index} className="tp-filter-pill">{rule}</span>
        ))}
      </div>
    </section>
  );
}

function Filters({
  style,
  listings,
  filters,
  setFilters,
  collectionSearch,
  setCollectionSearch,
  secondaryOpen,
  setSecondaryOpen,
}) {
  const options = useMemo(() => deriveTradeBoardFilterOptions(listings), [listings]);
  const visibleCollections = useMemo(
    () => filterCollectionOptions(options.collections, collectionSearch),
    [options.collections, collectionSearch],
  );
  const activeFilterCount = countActiveTradeBoardFilters(filters);

  const setFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setFilters(EMPTY_FILTER_STATE);
    setCollectionSearch("");
  };

  return (
    <div className={`tp-filters style-${style}`}>
      <div className="tp-filters-topline">
        <div>
          <div className="tp-mobile-filter-cue">Search or filter the board</div>
          <div className="tp-filter-results">
            <strong>{listings.length}</strong> available pieces
          </div>
        </div>
        <div className="tp-filter-actions">
          {activeFilterCount > 0 && (
            <button type="button" className="tp-filter-link" onClick={clearFilters}>
              Clear filters
            </button>
          )}
          <button
            type="button"
            className={`tp-filter-toggle ${secondaryOpen ? "active" : ""}`}
            onClick={() => setSecondaryOpen((open) => !open)}
            aria-expanded={secondaryOpen}
            aria-controls="trade-filter-panel"
          >
            More filters
            {activeFilterCount > 0 && <span className="tp-filter-badge">{activeFilterCount}</span>}
          </button>
        </div>
      </div>

      <div className="tp-filters-row tp-filters-row-primary">
        <button
          type="button"
          className={`tp-filter-pill ${filters.type === "all" ? "active" : ""}`}
          onClick={() => setFilter("type", "all")}
        >
          All types
        </button>
        {options.types.map((type) => (
          <button
            key={type}
            type="button"
            className={`tp-filter-pill ${filters.type === type ? "active" : ""}`}
            onClick={() => setFilter("type", type)}
          >
            {type}
          </button>
        ))}
      </div>

      <div className="tp-filters-row tp-filters-row-primary">
        <button
          type="button"
          className={`tp-filter-pill ${filters.rarity === "all" ? "active" : ""}`}
          onClick={() => setFilter("rarity", "all")}
        >
          All rarity
        </button>
        {options.rarityTags.map((rarity) => (
          <button
            key={rarity}
            type="button"
            className={`tp-filter-pill ${filters.rarity === rarity ? "active" : ""}`}
            onClick={() => setFilter("rarity", rarity)}
          >
            {rarityLabel(rarity)}
          </button>
        ))}
      </div>

      {secondaryOpen && (
        <div className="tp-filter-panel" id="trade-filter-panel">
          <div className="tp-filter-group">
            <div className="tp-filter-group-head">
              <h3>Collection</h3>
              <span>Search or browse</span>
            </div>
            <input
              type="search"
              value={collectionSearch}
              onChange={(event) => setCollectionSearch(event.target.value)}
              placeholder="Search collections"
              className="tp-filter-search"
            />
            <div className="tp-filter-chip-grid">
              <button
                type="button"
                className={`tp-filter-chip ${filters.collection === "all" ? "active" : ""}`}
                onClick={() => setFilter("collection", "all")}
              >
                All collections
              </button>
              {visibleCollections.map((collection) => (
                <button
                  key={collection}
                  type="button"
                  className={`tp-filter-chip ${filters.collection === collection ? "active" : ""}`}
                  onClick={() => setFilter("collection", collection)}
                >
                  {collection}
                </button>
              ))}
            </div>
          </div>

          <div className="tp-filter-grid">
            <div className="tp-filter-group">
              <div className="tp-filter-group-head">
                <h3>Material</h3>
                <span>Secondary filter</span>
              </div>
              <div className="tp-filter-chip-grid">
                <button
                  type="button"
                  className={`tp-filter-chip ${filters.material === "all" ? "active" : ""}`}
                  onClick={() => setFilter("material", "all")}
                >
                  All materials
                </button>
                {options.materials.map((material) => (
                  <button
                    key={material}
                    type="button"
                    className={`tp-filter-chip ${filters.material === material ? "active" : ""}`}
                    onClick={() => setFilter("material", material)}
                  >
                    {material}
                  </button>
                ))}
              </div>
            </div>

            {options.sizes.length > 0 && (
              <div className="tp-filter-group">
                <div className="tp-filter-group-head">
                  <h3>Size</h3>
                  <span>When applicable</span>
                </div>
                <div className="tp-filter-chip-grid">
                  <button
                    type="button"
                    className={`tp-filter-chip ${filters.size === "all" ? "active" : ""}`}
                    onClick={() => setFilter("size", "all")}
                  >
                    All sizes
                  </button>
                  {options.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      className={`tp-filter-chip ${filters.size === size ? "active" : ""}`}
                      onClick={() => setFilter("size", size)}
                    >
                      Size {size}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function TradeCard({ piece, onTap, repName, tierVisible }) {
  const showTier = piece.tier !== "everyday" || tierVisible === "all";
  const tierLabel = piece.tier === "unicorn" ? "Unicorn" : piece.tier === "diamond" ? "Diamond" : "Everyday";

  return (
    <article className={`tp-card ${piece.tier}`} onClick={() => onTap(piece)}>
      <div className={`tp-card-photo slot ${piece.photoUrl ? "has-photo" : ""}`} data-slot="jewelry photo">
        {showTier && (
          <span className={`tp-card-tier ${piece.tier}`}>
            <span className="pip" />
            {tierLabel}
          </span>
        )}
        {piece.photoUrl ? (
          <img className="tp-card-photo-img" src={piece.photoUrl} alt={piece.name} />
        ) : (
          <div className="photo-glyph">{piece.glyph}</div>
        )}
      </div>
      <div className="tp-card-body">
        <div className="tp-card-collection">{piece.collection}</div>
        <h3 className="tp-card-name slot" data-slot="design name">{piece.name}</h3>
        <div className="tp-card-meta">
          <span>{piece.type}{piece.size ? ` - Size ${piece.size}` : ""}</span>
          <span className="tp-card-msrp">Bomb Party MSRP <strong>{piece.msrp === null ? "TBD" : `$${piece.msrp}`}</strong></span>
        </div>
        <div className="tp-card-material">{piece.material}</div>
        <div className="tp-card-rep slot" data-slot="brand separation">
          Offered by <strong>{repName}</strong>, an Independent Bomb Party Representative.
        </div>
      </div>
    </article>
  );
}

function ExpandedCard({ piece, onClose, onWantThis, repName }) {
  if (!piece) return null;

  const tierLabel = piece.tier === "unicorn"
    ? "Unicorn"
    : piece.tier === "diamond"
      ? "Diamond"
      : "Everyday";

  return (
    <div className="tp-card-expand-mask" onClick={onClose}>
      <div className="tp-card-expand" onClick={(event) => event.stopPropagation()}>
        <button className="tp-card-close" onClick={onClose} aria-label="Close">&times;</button>
        <div className={`tp-card-expand-photo slot ${piece.photoUrl ? "has-photo" : ""}`} data-slot="jewelry photo">
          {piece.photoUrl ? (
            <img className="tp-card-expand-photo-img" src={piece.photoUrl} alt={piece.name} />
          ) : (
            <div className="photo-glyph">{piece.glyph}</div>
          )}
        </div>
        <div className="tp-card-expand-body">
          <span className={`tp-card-tier ${piece.tier} tp-card-expand-tier`}>
            <span className="pip" />
            {tierLabel}
          </span>
          <div className="tp-card-expand-collection">{piece.collection} collection</div>
          <h2 className="tp-card-expand-name slot" data-slot="design name">{piece.name}</h2>
          <p className="tp-card-expand-desc slot" data-slot="description">
            This {piece.type.toLowerCase()} can be requested as an item-for-item trade if your offered piece stays within the same collection and the same jewelry type.
          </p>
          <dl className="tp-card-expand-specs">
            <div>
              <dt>Collection</dt>
              <dd>{piece.collection}</dd>
            </div>
            <div>
              <dt>Jewelry type</dt>
              <dd>{piece.type}{piece.size ? ` - Size ${piece.size}` : ""}</dd>
            </div>
            <div>
              <dt>Material</dt>
              <dd>{piece.material}</dd>
            </div>
            <div>
              <dt>Main stone</dt>
              <dd>{piece.stone}</dd>
            </div>
            <div>
              <dt>Bomb Party MSRP</dt>
              <dd>{piece.msrp === null ? "TBD" : `$${piece.msrp}`} (reference only)</dd>
            </div>
          </dl>
          <div className="tp-card-expand-box slot" data-slot="reveal box photo">
            <div className="thumb">BOX</div>
            <div>{piece.note}</div>
          </div>
          <div className="tp-card-expand-rep slot" data-slot="brand separation">
            Offered by <strong>{repName}</strong>, an Independent Bomb Party Representative. No money difference and no credit are part of this board.
          </div>
          <button className="tp-card-expand-cta" onClick={() => onWantThis(piece)}>
            Request this trade
            <span>?</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function RequestSheet({ piece, onClose, onSubmit, success, pending, error, repName }) {
  const [name, setName] = useState("");
  const [offering, setOffering] = useState("");

  useEffect(() => {
    setName("");
    setOffering("");
  }, [piece?.id, success]);

  const trimmedName = name.trim();
  const trimmedOffering = offering.trim();
  const canSubmit = Boolean(trimmedName && trimmedOffering && !pending);

  if (!piece && !success) return null;

  if (success) {
    return (
      <div className="tp-sheet-mask" onClick={pending ? undefined : onClose}>
        <div className="tp-sheet success" onClick={(event) => event.stopPropagation()}>
          <button className="tp-sheet-close" onClick={onClose} aria-label="Close" disabled={pending}>&times;</button>
          <div className="tp-sheet-handle" />
          <div className="tp-sheet-success-icon">&#10003;</div>
          <h3 className="tp-sheet-success-title">Request sent.</h3>
          <p className="tp-sheet-success-body">
            <strong>{repName}</strong> will review your match after the show and follow up directly.
          </p>
          <p className="tp-sheet-success-legal">
            This trade is solely between you and <strong>{repName}</strong>, an Independent Bomb Party Representative. The platform does not verify condition, authenticity, or value.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tp-sheet-mask" onClick={pending ? undefined : onClose}>
      <div className="tp-sheet" onClick={(event) => event.stopPropagation()}>
        <button className="tp-sheet-close" onClick={onClose} aria-label="Close" disabled={pending}>&times;</button>
        <div className="tp-sheet-handle" />
        <div className="tp-sheet-eyebrow">Trade Request</div>
        <h3 className="tp-sheet-title">{piece.name}</h3>
        <div className="tp-sheet-piece">
          {piece.collection} - {piece.type}{piece.size ? ` - Size ${piece.size}` : ""}
        </div>
        <p className="tp-sheet-helper">
          Keep it simple. Tell <strong>{repName}</strong> what piece you revealed and the closest details you know.
        </p>
        <form
          className="tp-sheet-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSubmit) return;
            onSubmit({
              listingId: piece.id,
              customerName: trimmedName,
              customerDescription: trimmedOffering,
            });
          }}
        >
          <div className="tp-sheet-field">
            <label>Your name</label>
            <input
              type="text"
              placeholder="As shown on your reveal"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
          </div>
          <div className="tp-sheet-field">
            <label>Describe your revealed piece</label>
            <textarea
              placeholder="Collection, jewelry type, and any details you know."
              value={offering}
              onChange={(event) => setOffering(event.target.value)}
              required
            />
          </div>
          {error && (
            <div className="tp-sheet-error" role="alert">
              {error}
            </div>
          )}
          <button type="submit" className="tp-sheet-submit" disabled={!canSubmit}>
            {pending ? "Submitting..." : "Submit trade request"}
          </button>
        </form>
      </div>
    </div>
  );
}

function EmptyState({ repName }) {
  return (
    <div className="tp-empty">
      <div className="tp-empty-glyph">?</div>
      <h3 className="tp-empty-title">Trade board is empty right now.</h3>
      <p className="tp-empty-sub">
        <strong>{repName}</strong> adds listings after live reveals. Check back after the next show for fresh one-for-one trade options.
      </p>
      <div className="tp-empty-next">
        <span className="live-dot" />
        Next show: Tuesday - 8:00 PM CST
      </div>
    </div>
  );
}

function NoMatchesState({ onClear }) {
  return (
    <div className="tp-empty">
      <div className="tp-empty-glyph">?</div>
      <h3 className="tp-empty-title">No listings match these filters.</h3>
      <p className="tp-empty-sub">
        Try a different collection, jewelry type, rarity tag, or material mix to widen the board again.
      </p>
      <button type="button" className="tp-empty-reset" onClick={onClear}>
        Clear filters
      </button>
    </div>
  );
}

const FAQS = [
  {
    q: "How does a trade actually work?",
    a: FAQ_CONTENT.howTradeWorks || "Find a board piece you love, send a request, and the rep reviews the swap after the show.",
  },
  {
    q: "Can I add cash if the piece I want is worth more?",
    a: FAQ_CONTENT.cashDifference || "No. This board does not support pay-the-difference trades.",
  },
  {
    q: "Do I get credit if the piece I want has a lower MSRP?",
    a: FAQ_CONTENT.tradeCredit || "No. There is no credit or payout path on this board.",
  },
  {
    q: "How are trades matched?",
    a: FAQ_CONTENT.matchingRules || "Trades should stay within the same collection and the same jewelry type.",
  },
  {
    q: "Does Bomb Party MSRP decide whether a trade is even?",
    a: FAQ_CONTENT.msrp || "No. MSRP is for display only and is not the basis for trade parity.",
  },
  {
    q: "Are diamonds and unicorns allowed?",
    a: FAQ_CONTENT.rarePieces || "Yes, but they are expected to be rare edge-case listings.",
  },
  {
    q: "How fast does the rep respond?",
    a: FAQ_CONTENT.responseTime || "Most reps review requests after the live show ends.",
  },
];

function Faq() {
  const [open, setOpen] = useState(0);

  return (
    <section className="tp-faq" id="faq">
      <h2>Trade rules.</h2>
      <p className="tp-faq-sub">The short version. Read once, trade cleanly.</p>
      {FAQS.map((faq, index) => (
        <div key={index} className={`tp-faq-item ${open === index ? "open" : ""}`}>
          <div className="tp-faq-q" onClick={() => setOpen(open === index ? -1 : index)}>
            <span>{faq.q}</span>
            <span className="chev">+</span>
          </div>
          <div className="tp-faq-a">
            <div className="tp-faq-a-inner">{faq.a}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

function Footer({ businessName }) {
  return (
    <footer className="hp-footer">
      <div className="hp-footer-inner">
        <div>
          <div className="hp-footer-brand slot" data-slot="business name">{businessName}</div>
          <p className="hp-footer-tag">{CONTENT.footerTagline || "Live jewelry reveals every Tuesday at 8pm CST. Real pieces, real sparkle."}</p>
          <div className="hp-footer-socials">
            {FOOTER_SOCIALS.map((social) => (
              <a key={social.shortLabel} {...linkProps(social.href)} className="hp-footer-social">{social.shortLabel}</a>
            ))}
          </div>
        </div>
        <div className="hp-footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a {...linkProps(TRADE_BOARD_HREF)}>Trade Board</a></li>
            <li><a {...linkProps(FOOTER_LINKS.catalog || "#")}>Bomb Party Catalog</a></li>
            <li><a {...linkProps(FOOTER_LINKS.preOrders || "#")}>Pre-orders</a></li>
            <li><a {...linkProps(FOOTER_LINKS.pastShows || HOME_HREF)}>Past shows</a></li>
          </ul>
        </div>
        <div className="hp-footer-col">
          <h4>About</h4>
          <ul>
            <li><a {...linkProps(HOME_HREF)}>Home</a></li>
            <li><a {...linkProps(JOIN_HREF)}>Join Team</a></li>
            <li><a {...linkProps(FOOTER_LINKS.faq || "#faq")}>FAQ</a></li>
            <li><a {...linkProps(FOOTER_LINKS.privacy || "#faq")}>Privacy</a></li>
          </ul>
        </div>
        <div className="hp-footer-col slot" data-slot="optional 4th column">
          <h4>{FOOTER_COLUMN.title || "Trade Notes"}</h4>
          <ul>
            {(FOOTER_COLUMN.links || []).map((link) => (
              <li key={link.label}><a {...linkProps(link.href)}>{link.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="hp-footer-bottom">
        <div className="legal-row">
          <span>&copy; 2026 {businessName} - Powered by Sparkle Suite</span>
          <span>
            <a {...linkProps(FOOTER_LINKS.privacy || "#faq")}>Privacy</a> -{" "}
            <a {...linkProps(FOOTER_LINKS.terms || "#faq")}>Terms</a> -{" "}
            <a {...linkProps(FOOTER_LINKS.accessibility || "#faq")}>Accessibility</a>
          </span>
        </div>
        <p>{CONTENT.legalDisclaimer || "Trades are private agreements between the customer and the rep. Bomb Party MSRP is shown for reference only and does not drive trade eligibility."}</p>
      </div>
    </footer>
  );
}

function NicNac() {
  return (
    <div className="hp-nic-nac">
      <button className="hp-nic-nac-btn" aria-label="Open Nic-Nac">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
        </svg>
        <span className="spark" />
      </button>
    </div>
  );
}

function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);
  const [expanded, setExpanded] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [success, setSuccess] = useState(false);
  const [requestPending, setRequestPending] = useState(false);
  const [requestError, setRequestError] = useState("");
  const [submittedListingIds, setSubmittedListingIds] = useState([]);
  const [liveListings, setLiveListings] = useState(BOOTSTRAP_LISTINGS);
  const [filters, setFilters] = useState(getInitialTradeFilters);
  const [collectionSearch, setCollectionSearch] = useState("");
  const [secondaryFiltersOpen, setSecondaryFiltersOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);

  const bootstrappedListings = useMemo(
    () => liveListings.map(normalizeBootstrapPiece).filter(Boolean),
    [liveListings],
  );
  const samples = useMemo(() => {
    if (bootstrappedListings.length > 0) {
      return bootstrappedListings.slice(0, t.cardCount);
    }

    return buildSamples(t.cardCount);
  }, [bootstrappedListings, t.cardCount]);
  const availableSamples = useMemo(
    () => samples.filter((piece) => !submittedListingIds.includes(piece.id)),
    [samples, submittedListingIds],
  );
  const filtered = useMemo(
    () => filterTradeBoardListings(availableSamples, filters),
    [availableSamples, filters],
  );

  useEffect(() => {
    if (t.demoSheet === "form") {
      setRequesting(availableSamples[0] || null);
      setSuccess(false);
      setRequestError("");
      setExpanded(null);
    } else if (t.demoSheet === "success") {
      setRequesting({ id: 0, name: "Saved sample request" });
      setSuccess(true);
      setRequestError("");
      setExpanded(null);
    } else {
      setRequesting(null);
      setSuccess(false);
      setRequestError("");
    }
  }, [availableSamples, t.demoSheet]);

  useEffect(() => {
    const root = document.documentElement;
    const tone = TONES[t.bgTone] || TONES.lavender;
    root.style.setProperty("--hp-primary", t.primaryColor);
    root.style.setProperty("--hp-accent", t.accentColor);
    root.style.setProperty("--hp-bg", tone.bg);
    root.style.setProperty("--hp-bg-elevated", tone.elevated);
    root.style.setProperty("--bg-deep", tone.deep);
    root.style.setProperty("--primary", t.primaryColor);
    root.style.setProperty("--accent", t.accentColor);
    root.style.setProperty("--hp-display-font", FONTS[t.headingFont] || FONTS.vend);
    root.style.setProperty("--hp-body-font", FONTS[t.bodyFont] || FONTS.vend);
    root.style.setProperty("--hp-heading-weight", t.headingWeight);
    root.style.setProperty("--hp-saturation", (t.saturation || 100) / 100);
    root.style.setProperty("--ticker-speed", t.tickerSpeed);
  }, [t]);

  useEffect(() => {
    const body = document.body;
    body.className = "tradepage";
    if (t.showSlots) body.classList.add("slots-on");
    if (t.bgTreatment === "mesh") body.classList.add("bg-mesh");
    if (t.bgTreatment === "confetti") body.classList.add("fx-confetti");
    if (t.bgTreatment === "aurora") body.classList.add("fx-aurora");
    if (t.bgTreatment === "suite-paper") body.classList.add("bg-suite-paper");
    if (t.bgTreatment === "black-velvet") body.classList.add("bg-black-velvet");
    if (t.bgTreatment === "rose-gold-paper") body.classList.add("bg-rose-gold-paper");
    if (t.bgTreatment === "garnet-shell") body.classList.add("bg-garnet-shell");
    if (t.bgTreatment === "amber-paper") body.classList.add("bg-amber-paper");
    if (t.bgTreatment === "velvet-orchid") body.classList.add("bg-velvet-orchid");
    if (t.bgTreatment === "quartz-paper") body.classList.add("bg-quartz-paper");
    if (t.cardSurface === "glass") body.classList.add("surface-glass");
    if (t.cardSurface === "holographic") body.classList.add("fx-holographic");
    if (t.cardSurface === "warm-paper") body.classList.add("surface-warm-paper");
    if (t.cardSurface === "dark-metallic") body.classList.add("surface-dark-metallic");
    if (t.cardSurface === "pearl-rose") body.classList.add("surface-pearl-rose");
    if (t.cardSurface === "blush-shell") body.classList.add("surface-blush-shell");
    if (t.cardSurface === "sunlit-pearl") body.classList.add("surface-sunlit-pearl");
    if (t.cardSurface === "plush-orchid") body.classList.add("surface-plush-orchid");
    if (t.cardSurface === "pink-quartz") body.classList.add("surface-pink-quartz");
    if (t.textureOverlay === "grain") body.classList.add("tex-grain");
    if (t.textureOverlay === "sparkle") body.classList.add("tex-sparkle");
    if (t.buttonEnergy === "bouncy") body.classList.add("btn-bouncy");
    if (t.buttonEnergy === "wiggle") body.classList.add("btn-wiggle");
    if (t.buttonEnergy === "suite-lift") body.classList.add("btn-suite-lift");
    if (t.buttonEnergy === "diamond-lift") body.classList.add("btn-diamond-lift");
    if (t.buttonEnergy === "rose-gold-lift") body.classList.add("btn-rose-gold-lift");
    if (t.buttonEnergy === "garnet-lift") body.classList.add("btn-garnet-lift");
    if (t.buttonEnergy === "amber-pop") body.classList.add("btn-amber-pop");
    if (t.buttonEnergy === "velvet-lift") body.classList.add("btn-velvet-lift");
    if (t.buttonEnergy === "quartz-pop") body.classList.add("btn-quartz-pop");
    if (t.ctaEmphasis === "pulse") body.classList.add("cta-pulse");
    if (t.tradeFlair === "holo-unicorn") body.classList.add("holo-unicorn");
    if (t.tradeFlair === "soft-pink-lift") body.classList.add("soft-pink-lift");
    if (t.tradeFlair === "cyan-diamond") body.classList.add("cyan-diamond");
    if (t.tradeFlair === "champagne-rose") body.classList.add("champagne-rose");
    if (t.tradeFlair === "ruby-polish") body.classList.add("ruby-polish");
    if (t.tradeFlair === "citrine-glow") body.classList.add("citrine-glow");
    if (t.tradeFlair === "orchid-gloss") body.classList.add("orchid-gloss");
    if (t.tradeFlair === "pink-spark") body.classList.add("pink-spark");
    if (t.cursorEffect === "sparkle") body.classList.add("cursor-sparkle");
    if (t.density === "compact") body.classList.add("density-compact");
    if (t.density === "spacious") body.classList.add("density-spacious");
    if (t.shapeRadius === "sharp") body.classList.add("shape-sharp");
    if (t.shapeRadius === "soft") body.classList.add("shape-soft");
    if (queueOpen) body.classList.add("modal-open");
  }, [queueOpen, t]);

  const refreshTradeBoardListings = async () => {
    const listings = await fetchTradeBoardListings();
    if (listings) setLiveListings(listings);
  };

  useEffect(() => {
    const refreshIfVisible = () => {
      if (document.visibilityState === "hidden") return;
      void refreshTradeBoardListings();
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void refreshTradeBoardListings();
      }
    };

    refreshIfVisible();
    document.addEventListener("visibilitychange", refreshWhenVisible);
    window.addEventListener("focus", refreshIfVisible);
    const intervalId = window.setInterval(refreshIfVisible, TRADE_BOARD_REFRESH_MS);

    return () => {
      document.removeEventListener("visibilitychange", refreshWhenVisible);
      window.removeEventListener("focus", refreshIfVisible);
      window.clearInterval(intervalId);
    };
  }, []);

  const applyPreset = (presetName) => {
    const presetValues = PRESETS[presetName];
    if (!presetValues) return;
    setTweak({ preset: presetName, ...presetValues });
  };

  const live = t.liveState === "live";
  const isEmpty = t.contentState === "empty";
  const showNoMatches = !isEmpty && availableSamples.length > 0 && filtered.length === 0;
  const clearFilters = () => {
    setFilters(EMPTY_FILTER_STATE);
    setCollectionSearch("");
  };
  const handleTradeRequestSubmit = async (payload) => {
    setRequestPending(true);
    setRequestError("");

    try {
      await submitTradeRequestRequest(payload);
      await refreshTradeBoardListings();
      setSubmittedListingIds((current) =>
        current.includes(payload.listingId) ? current : [...current, payload.listingId],
      );
      setSuccess(true);
    } catch (error) {
      const isUnavailable =
        error?.code === "REQUEST_ALREADY_EXISTS" || error?.code === "LISTING_NOT_FOUND";
      if (isUnavailable) {
        setSubmittedListingIds((current) =>
          current.includes(payload.listingId) ? current : [...current, payload.listingId],
        );
      }
      setRequestError(error?.message || DEFAULT_TRADE_REQUEST_ERROR);
    } finally {
      setRequestPending(false);
    }
  };

  return (
    <>
      <SparkleFx level={t.sparkleLevel} />

      <div className="hp-saturate">
        <Header businessName={t.businessName} />
        {t.showTicker && <Ticker topText={t.tickerTopText} />}
        <LiveQueueStrip live={live} onOpen={() => setQueueOpen(true)} />
        {t.showHero && (
          <TradeHero
            tweakRepName={t.repName}
            tweakHeroTitle={t.tradeHeroTitle}
            tweakHeroSub={t.tradeHeroSub}
          />
        )}

        <RulesStrip />

        <section className="tp-board">
          <div className="tp-board-inner no-lrq">
            <div>
              <Filters
                style={t.filterStyle}
                listings={availableSamples}
                filters={filters}
                setFilters={setFilters}
                collectionSearch={collectionSearch}
                setCollectionSearch={setCollectionSearch}
                secondaryOpen={secondaryFiltersOpen}
                setSecondaryOpen={setSecondaryFiltersOpen}
              />
              {isEmpty ? (
                <div className="tp-grid-wrap"><EmptyState repName={t.repName} /></div>
              ) : showNoMatches ? (
                <div className="tp-grid-wrap"><NoMatchesState onClear={clearFilters} /></div>
              ) : (
                <div className="tp-grid-wrap">
                  <div className={`tp-grid aspect-${t.cardAspect}`}>
                    {filtered.map((piece) => (
                      <TradeCard
                        key={piece.id}
                        piece={piece}
                        onTap={(selectedPiece) => setExpanded(selectedPiece)}
                        repName={t.repName}
                        tierVisible={t.tierVisibility}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {t.showFaq && <Faq />}

        {t.showLegal && (
          <div className="tp-legal slot" data-slot="brand separation footer">
            {CONTENT.legalDisclaimer || "Trades are private agreements between the customer and the rep. Bomb Party MSRP is shown for reference only and does not drive trade eligibility."}
          </div>
        )}

        {t.showFooter && <Footer businessName={t.businessName} />}
      </div>

      {t.showNicNac && <NicNac />}

      <LiveQueueModal open={queueOpen} onClose={() => setQueueOpen(false)} live={live} />

      <ExpandedCard
        piece={expanded}
        onClose={() => setExpanded(null)}
        onWantThis={(piece) => {
          setExpanded(null);
          setRequesting(piece);
          setSuccess(false);
          setRequestError("");
        }}
        repName={t.repName}
      />

      <RequestSheet
        piece={requesting}
        onClose={() => {
          if (requestPending) return;
          setRequesting(null);
          setSuccess(false);
          setRequestError("");
          setTweak("demoSheet", "closed");
        }}
        onSubmit={handleTradeRequestSubmit}
        success={success}
        pending={requestPending}
        error={requestError}
        repName={t.repName}
      />

      <TweaksPanel title="Tweaks" subtitle="Tune the trade board" defaultWidth={380}>
        <TweakSection title="Trade board" subtitle="Page-specific behavior">
          <TweakRadio
            label="Live state"
            value={t.liveState}
            onChange={(value) => setTweak("liveState", value)}
            options={[
              { value: "live", label: "Live show" },
              { value: "offline", label: "Offline" },
            ]}
          />
          <TweakRadio
            label="Content"
            value={t.contentState}
            onChange={(value) => setTweak("contentState", value)}
            options={[
              { value: "populated", label: "Populated" },
              { value: "empty", label: "Empty" },
            ]}
          />
          <TweakSlider
            label="Number of listings"
            value={t.cardCount}
            onChange={(value) => setTweak("cardCount", value)}
            min={6}
            max={30}
            step={2}
          />
          <TweakRadio
            label="Card aspect"
            value={t.cardAspect}
            onChange={(value) => setTweak("cardAspect", value)}
            options={[
              { value: "portrait", label: "Portrait 4:5" },
              { value: "square", label: "Square" },
            ]}
          />
          <TweakRadio
            label="Tier labels"
            value={t.tierVisibility}
            onChange={(value) => setTweak("tierVisibility", value)}
            options={[
              { value: "rare", label: "Rare only" },
              { value: "all", label: "All tiers" },
            ]}
          />
          <TweakSelect
            label="Filter bar style"
            value={t.filterStyle}
            onChange={(value) => setTweak("filterStyle", value)}
            options={[
              { value: "pills", label: "Horizontal pills" },
              { value: "dropdowns", label: "Dropdowns" },
            ]}
          />
          <TweakRadio
            label="Demo: request sheet"
            value={t.demoSheet}
            onChange={(value) => setTweak("demoSheet", value)}
            options={[
              { value: "closed", label: "Closed" },
              { value: "form", label: "Form" },
              { value: "success", label: "Success" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Flamboyance presets" subtitle="Snap a whole vibe in one click">
          <TweakRadio
            label="Preset"
            value={t.preset}
            onChange={applyPreset}
            options={[
              { value: "amethyst", label: "Amethyst" },
              { value: "sparkle_suite_morganite", label: "Sparkle Suite/Morganite" },
              { value: "black_diamond", label: "Black Diamond" },
              { value: "rose_gold", label: "Rose Gold" },
              { value: "garnet", label: "Garnet" },
              { value: "amber", label: "Amber" },
              { value: "velvet", label: "Velvet" },
              { value: "rose_quartz", label: "Rose Quartz" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Sparkle & motion">
          <TweakRadio
            label="Sparkle level"
            value={t.sparkleLevel}
            onChange={(value) => setTweak("sparkleLevel", value)}
            options={[
              { value: "none", label: "None" },
              { value: "subtle", label: "Subtle" },
              { value: "glittery", label: "Glittery" },
              { value: "maximum", label: "Max" },
            ]}
          />
          <TweakRadio
            label="Button energy"
            value={t.buttonEnergy}
            onChange={(value) => setTweak("buttonEnergy", value)}
            options={[
              { value: "calm", label: "Calm" },
              { value: "bouncy", label: "Bouncy" },
              { value: "wiggle", label: "Wiggle" },
            ]}
          />
          <TweakSlider
            label="Ticker speed"
            value={t.tickerSpeed}
            onChange={(value) => setTweak("tickerSpeed", value)}
            min={0.3}
            max={3}
            step={0.1}
          />
        </TweakSection>

        <TweakSection title="Background & texture">
          <TweakSelect
            label="Background treatment"
            value={t.bgTreatment}
            onChange={(value) => setTweak("bgTreatment", value)}
            options={[
              { value: "clean", label: "Clean" },
              { value: "mesh", label: "Gradient mesh" },
              { value: "confetti", label: "Confetti dots" },
              { value: "aurora", label: "Aurora hero" },
            ]}
          />
          <TweakSelect
            label="Card surface"
            value={t.cardSurface}
            onChange={(value) => setTweak("cardSurface", value)}
            options={[
              { value: "matte", label: "Matte" },
              { value: "glass", label: "Glass" },
              { value: "holographic", label: "Holographic" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Color">
          <TweakSelect
            label="Background tone"
            value={t.bgTone}
            onChange={(value) => setTweak("bgTone", value)}
            options={[
              { value: "lavender", label: "Lavender" },
              { value: "warm", label: "Warm peach" },
              { value: "cool", label: "Cool blue" },
              { value: "paper", label: "Paper" },
              { value: "neon", label: "Neon pink" },
              { value: "midnight", label: "Midnight" },
            ]}
          />
          <TweakColor label="Primary" value={t.primaryColor} onChange={(value) => setTweak("primaryColor", value)} />
          <TweakColor label="Accent" value={t.accentColor} onChange={(value) => setTweak("accentColor", value)} />
        </TweakSection>

        <TweakSection title="Typography & shape">
          <TweakSelect
            label="Heading font"
            value={t.headingFont}
            onChange={(value) => setTweak("headingFont", value)}
            options={[
              { value: "vend", label: "Vend Sans" },
              { value: "serif", label: "Editorial serif" },
              { value: "italiana", label: "Glam serif" },
              { value: "bubbly", label: "Rounded" },
              { value: "chunky", label: "Chunky display" },
            ]}
          />
          <TweakSlider
            label="Heading weight"
            value={t.headingWeight}
            onChange={(value) => setTweak("headingWeight", value)}
            min={300}
            max={900}
            step={100}
          />
        </TweakSection>

        <TweakSection title="Section visibility">
          <TweakToggle label="Ticker" value={t.showTicker} onChange={(value) => setTweak("showTicker", value)} />
          <TweakToggle label="Page hero" value={t.showHero} onChange={(value) => setTweak("showHero", value)} />
          <TweakToggle label="FAQ" value={t.showFaq} onChange={(value) => setTweak("showFaq", value)} />
          <TweakToggle label="Brand separation note" value={t.showLegal} onChange={(value) => setTweak("showLegal", value)} />
          <TweakToggle label="Footer" value={t.showFooter} onChange={(value) => setTweak("showFooter", value)} />
          <TweakToggle label="Nic-Nac launcher" value={t.showNicNac} onChange={(value) => setTweak("showNicNac", value)} />
        </TweakSection>

        <TweakSection title="Copy sandbox">
          <TweakText label="Rep name" value={t.repName} onChange={(value) => setTweak("repName", value)} />
          <TweakText label="Business name" value={t.businessName} onChange={(value) => setTweak("businessName", value)} />
          <TweakText label="Ticker text" value={t.tickerTopText} onChange={(value) => setTweak("tickerTopText", value)} />
          <TweakText label="Hero title" value={t.tradeHeroTitle} onChange={(value) => setTweak("tradeHeroTitle", value)} />
          <TweakText label="Hero sub" value={t.tradeHeroSub} onChange={(value) => setTweak("tradeHeroSub", value)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
