/* global React, ReactDOM */
const { useState, useEffect, useMemo, useRef } = React;

const {
  TweaksPanel, useTweaks,
  TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakColor, TweakText, TweakButton, TweakNumber
} = window;

const DEFAULTS = window.TRADE_TWEAK_DEFAULTS;

// ============================================================
// Preset combos (shared with homepage)
// ============================================================
const PRESETS = {
  editorial: {
    sparkleLevel: "subtle", bgTreatment: "clean", cardSurface: "matte",
    textureOverlay: "none", buttonEnergy: "calm", ctaEmphasis: "standard",
    tradeFlair: "clean", cursorEffect: "default", saturation: 100,
    bgTone: "lavender", primaryColor: "#480DDF", accentColor: "#D209E3",
  },
  softGlam: {
    sparkleLevel: "glittery", bgTreatment: "mesh", cardSurface: "glass",
    textureOverlay: "sparkle", buttonEnergy: "bouncy", ctaEmphasis: "pulse",
    tradeFlair: "tier-glow", cursorEffect: "default", saturation: 110,
    bgTone: "lavender", primaryColor: "#480DDF", accentColor: "#D209E3",
  },
  sparkleParty: {
    sparkleLevel: "maximum", bgTreatment: "confetti", cardSurface: "glass",
    textureOverlay: "sparkle", buttonEnergy: "bouncy", ctaEmphasis: "pulse",
    tradeFlair: "holo-unicorn", cursorEffect: "sparkle", saturation: 130,
    bgTone: "warm", primaryColor: "#5C0EFF", accentColor: "#FF1AC2",
  },
  maximum: {
    sparkleLevel: "maximum", bgTreatment: "aurora", cardSurface: "holographic",
    textureOverlay: "sparkle", buttonEnergy: "wiggle", ctaEmphasis: "pulse",
    tradeFlair: "holo-unicorn", cursorEffect: "sparkle", saturation: 150,
    bgTone: "neon", primaryColor: "#3300FF", accentColor: "#FF00CC",
  },
};

const TONES = {
  lavender: { bg: "#E8DFF5", elevated: "#F2EBFA", deep: "#DCD0EE" },
  warm:     { bg: "#FFF0E8", elevated: "#FFF7F1", deep: "#FFE2D0" },
  cool:     { bg: "#E0EBFF", elevated: "#EEF3FF", deep: "#CFDFFF" },
  paper:    { bg: "#FAF7F2", elevated: "#FFFFFF", deep: "#F0EAE0" },
  midnight: { bg: "#1A0F2E", elevated: "#241640", deep: "#100828" },
  neon:     { bg: "#FFE6FA", elevated: "#FFF0FD", deep: "#FFD1F2" },
};

const FONTS = {
  vend: '"Vend Sans", "Inter", system-ui, sans-serif',
  serif: '"Fraunces", "Domine", Georgia, serif',
  italiana: '"Italiana", "Playfair Display", serif',
  bubbly: '"Quicksand", "Nunito", system-ui, sans-serif',
  chunky: '"Archivo Black", "Inter", sans-serif',
};

// ============================================================
// Sample listings
// ============================================================
const COLLECTIONS = ["Citrine Sun", "Estate Halo", "Velvet Hour", "Holiday Gift", "November Unicorns", "Diamond Territory"];
const TYPES = ["Ring", "Necklace", "Earrings", "Bracelet"];
const MATERIALS = [
  "Sterling silver, lab-grown stones",
  "Nickel-free brass, triple-plated",
  "Gold vermeil, freshwater pearl",
  "Sterling silver, natural sapphire",
  "Triple-plated gold, cubic zirconia",
];
const STONES = ["Citrine", "Amethyst", "Sapphire", "Pearl", "Opal", "Diamond accent", "Topaz", "Rose quartz", "Moonstone"];

const PIECE_NAMES = [
  "The Celeste Ring", "Velvet Halo Pendant", "Estate Sapphire Cluster", "Pearl Drop Studs",
  "Citrine Sun Pendant", "Rose Quartz Band", "Amethyst Halo Ring", "Opal Tide Necklace",
  "Moonstone Cuff", "Topaz Trinity Ring", "Diamond Whisper Studs", "Sapphire Cascade",
  "Lavender Mist Pendant", "Aurora Stack Set", "Crescent Cuff", "Iridescent Halo Ring",
  "Sun-Catcher Studs", "Ember Drop Earrings", "Velvet Knot Band", "Starlight Pendant",
  "Petal Cluster Earrings", "Midnight Halo Ring", "Sea Glass Pendant", "Honey Drop Studs",
  "Garnet Bloom Band", "Twilight Pearl Drops", "Halo Shimmer Ring", "Gilded Bough Necklace",
  "Frostbite Stud Set", "Blush Cascade Bracelet"
];

function buildSamples(count) {
  // First 2 unicorn, next 3 diamond, rest everyday — enough rares to feel meaningful
  const out = [];
  for (let i = 0; i < count; i++) {
    let tier = "everyday";
    if (i < 2) tier = "unicorn";
    else if (i < 6) tier = "diamond";
    const collection = COLLECTIONS[i % COLLECTIONS.length];
    const type = TYPES[i % TYPES.length];
    const material = MATERIALS[i % MATERIALS.length];
    const stone = STONES[i % STONES.length];
    const baseMsrp = tier === "unicorn" ? 480 : tier === "diamond" ? 220 : 70;
    const msrp = baseMsrp + ((i * 17) % 90);
    out.push({
      id: i + 1,
      name: PIECE_NAMES[i % PIECE_NAMES.length] + (i >= PIECE_NAMES.length ? " · No. " + (Math.floor(i / PIECE_NAMES.length) + 1) : ""),
      tier, collection, type, material, stone, msrp,
      glyph: PIECE_NAMES[i % PIECE_NAMES.length].charAt(4) || PIECE_NAMES[i % PIECE_NAMES.length].charAt(0),
      size: type === "Ring" ? ["6", "7", "8", "9"][i % 4] : null,
      special: i % 5 === 0 ? "Limited run — only 200 made" : null,
    });
  }
  return out;
}

// ============================================================
// Sparkle FX (shared)
// ============================================================
function SparkleFx({ level }) {
  const counts = { none: 0, subtle: 8, glittery: 24, maximum: 60 };
  const n = counts[level] || 0;
  const sparkles = useMemo(() => {
    return Array.from({ length: n }, (_, i) => ({
      left: Math.random() * 100,
      delay: Math.random() * 4,
      duration: 3 + Math.random() * 3,
      size: 0.5 + Math.random() * 1.2,
    }));
  }, [n]);
  if (!n) return null;
  return (
    <div className="hp-fx-layer" aria-hidden="true">
      {sparkles.map((s, i) => (
        <span key={i} className="hp-fx-sparkle" style={{
          left: `${s.left}%`,
          bottom: -20,
          animationDelay: `${s.delay}s`,
          animationDuration: `${s.duration}s`,
          transform: `scale(${s.size})`,
        }} />
      ))}
    </div>
  );
}

// ============================================================
// Header (shared with homepage — locked dark)
// ============================================================
function Header({ businessName }) {
  return (
    <header className="hp-header">
      <div className="hp-header-inner">
        <button className="hp-burger" aria-label="Menu">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" />
          </svg>
        </button>
        <div className="hp-brand">
          <div className="hp-brand-name slot" data-slot="business name">{businessName}</div>
          <div className="hp-brand-sub">Live jewelry reveals</div>
        </div>
        <a href="#" className="hp-shop-btn">Shop ↗</a>
      </div>
    </header>
  );
}

// ============================================================
// Ticker (shared with homepage)
// ============================================================
function Ticker({ topText }) {
  const items = topText.split("|").map(s => s.trim()).filter(Boolean);
  const trades = [
    { name: "Citrine Sun Pendant", price: "$148", tier: "unicorn" },
    { name: "Rose Quartz Band", price: "$98", tier: "diamond" },
    { name: "Amethyst Halo Ring", price: "$118", tier: "" },
    { name: "Pearl Drop Studs", price: "$48", tier: "" },
    { name: "Estate Sapphire Cluster", price: "$220", tier: "unicorn" },
  ];
  return (
    <div className="hp-ticker">
      <div className="hp-ticker-row">
        <span className="hp-ticker-label">Announcements</span>
        <div className="hp-ticker-track">
          {[...items, ...items, ...items].map((it, i) => (
            <span key={i} className="hp-ticker-item"><span className="dot" />{it}</span>
          ))}
        </div>
      </div>
      <div className="hp-ticker-row reverse">
        <span className="hp-ticker-label">Trade Board</span>
        <div className="hp-ticker-track">
          {[...trades, ...trades, ...trades].map((tr, i) => (
            <a key={i} href="#" className="hp-ticker-trade">
              <span className={`pip ${tr.tier}`} />
              {tr.name} · {tr.price}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// LRQ rail (sticky, side column)
// ============================================================
function LRQRail({ live }) {
  if (!live) {
    return (
      <aside className="tp-lrq-rail">
        <div className="tp-lrq-head">
          <span className="ofs-dot" />
          <span>Live Reveal Queue</span>
        </div>
        <div className="tp-lrq-meta">No show running right now. Browse the trade board — when you find something, tap "I Want This."</div>
        <div className="tp-lrq-stats">
          <div>
            <strong>Tue · 8pm</strong>
            Next show
          </div>
          <div>
            <strong>CST</strong>
            Time zone
          </div>
        </div>
      </aside>
    );
  }
  return (
    <aside className="tp-lrq-rail">
      <div className="tp-lrq-head">
        <span className="live-dot" />
        <span>Live Reveal Queue</span>
      </div>
      <div className="tp-lrq-meta">Currently revealing on TikTok Live. Watch the stream and watch your spot.</div>
      <div className="tp-lrq-list">
        <div className="tp-lrq-row now">
          <span className="pos">1</span>
          <div>
            <div className="label">Unboxing Now</div>
            <div className="name slot" data-slot="customer">Jamie L.</div>
          </div>
          <span style={{ fontSize: 16 }}>✦</span>
        </div>
        <div className="tp-lrq-row">
          <span className="pos">2</span>
          <div>
            <div className="label">On Deck</div>
            <div className="name slot" data-slot="customer">Priya M.</div>
          </div>
        </div>
        <div className="tp-lrq-row">
          <span className="pos">3</span>
          <div>
            <div className="label">Up Next</div>
            <div className="name slot" data-slot="customer">Devon R.</div>
          </div>
        </div>
        <div className="tp-lrq-row">
          <span className="pos">4</span>
          <div>
            <div className="label">In Queue</div>
            <div className="name slot" data-slot="customer">Sam T.</div>
          </div>
        </div>
        <div className="tp-lrq-row">
          <span className="pos">5</span>
          <div>
            <div className="label">In Queue</div>
            <div className="name slot" data-slot="customer">Carla J.</div>
          </div>
        </div>
      </div>
      <div className="tp-lrq-stats">
        <div>
          <strong>14</strong>
          Revealed tonight
        </div>
        <div>
          <strong>5</strong>
          In queue
        </div>
      </div>
    </aside>
  );
}

// ============================================================
// Mobile drawer
// ============================================================
function MobileDrawer({ live }) {
  const [open, setOpen] = useState(false);
  if (!live) return null;
  return (
    <div className={`tp-drawer ${open ? "open" : ""}`}>
      <div className="tp-drawer-bar" onClick={() => setOpen(o => !o)}>
        <div className="tp-drawer-bar-left">
          <span className="live-dot" />
          <span>LIVE NOW · 14 revealed · 5 in queue</span>
        </div>
        <span className="tp-drawer-chev">▾</span>
      </div>
      <div className="tp-drawer-body">
        <div className="tp-drawer-body-inner">
          <div className="tp-lrq-row now">
            <span className="pos">1</span>
            <div>
              <div className="label">Unboxing Now</div>
              <div className="name">Jamie L.</div>
            </div>
            <span style={{ fontSize: 14 }}>✦</span>
          </div>
          <div className="tp-lrq-row">
            <span className="pos">2</span>
            <div>
              <div className="label">On Deck</div>
              <div className="name">Priya M.</div>
            </div>
          </div>
          <div className="tp-lrq-row">
            <span className="pos">3</span>
            <div>
              <div className="label">Up Next</div>
              <div className="name">Devon R.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Hero
// ============================================================
function TradeHero({ repName, businessName }) {
  return (
    <section className="tp-hero">
      <div className="tp-hero-inner">
        <div className="tp-hero-eyebrow">Trade Board</div>
        <h1 className="tp-hero-title slot" data-slot="trade hero title">Pieces ready to trade.</h1>
        <p className="tp-hero-sub slot" data-slot="trade hero sub">
          Got a reveal that's not your style? Browse what <span className="slot" data-slot="rep name">{repName}</span> has on the board. Find one you love, send a request, and trade one-for-one. No money, no fuss.
        </p>
      </div>
    </section>
  );
}

// ============================================================
// Filter bar
// ============================================================
function Filters({ style, activeType, setActiveType }) {
  if (style === "sidebar") {
    return null; // sidebar style handled inline in board layout — keep the demo simple
  }
  if (style === "dropdowns") {
    return (
      <div className="tp-filters style-dropdowns">
        <div className="tp-filters-row">
          <button className="tp-filter-drop">Collection <span className="chev">▾</span></button>
          <button className="tp-filter-drop">Type <span className="chev">▾</span></button>
          <button className="tp-filter-drop">Material <span className="chev">▾</span></button>
          <button className="tp-filter-drop">MSRP <span className="chev">▾</span></button>
          <button className="tp-filter-drop tp-filter-sort">Newest first ↓</button>
        </div>
      </div>
    );
  }
  return (
    <div className="tp-filters style-pills">
      <div className="tp-filters-row">
        <button
          className={`tp-filter-pill ${activeType === "all" ? "active" : ""}`}
          onClick={() => setActiveType("all")}
        >All <span className="count">30</span></button>
        <button
          className={`tp-filter-pill ${activeType === "Ring" ? "active" : ""}`}
          onClick={() => setActiveType("Ring")}
        >Rings</button>
        <button
          className={`tp-filter-pill ${activeType === "Necklace" ? "active" : ""}`}
          onClick={() => setActiveType("Necklace")}
        >Necklaces</button>
        <button
          className={`tp-filter-pill ${activeType === "Earrings" ? "active" : ""}`}
          onClick={() => setActiveType("Earrings")}
        >Earrings</button>
        <button
          className={`tp-filter-pill ${activeType === "Bracelet" ? "active" : ""}`}
          onClick={() => setActiveType("Bracelet")}
        >Bracelets</button>
        <span className="tp-filter-divider" />
        <button className="tp-filter-pill">Unicorn ✦</button>
        <button className="tp-filter-pill">Diamond</button>
        <button className="tp-filter-pill">Under $100</button>
        <button className="tp-filter-pill">$100–$250</button>
        <button className="tp-filter-pill">$250+</button>
        <button className="tp-filter-sort">Newest first ↓</button>
      </div>
    </div>
  );
}

// ============================================================
// Trade card (compact)
// ============================================================
function TradeCard({ piece, onTap, repName, tierVisible }) {
  const showTier = piece.tier !== "everyday" || tierVisible === "all";
  const tierLabel = piece.tier === "unicorn" ? "Unicorn" : piece.tier === "diamond" ? "Diamond" : "Everyday";
  return (
    <article className={`tp-card ${piece.tier}`} onClick={() => onTap(piece)}>
      <div className="tp-card-photo slot" data-slot="jewelry photo">
        {showTier && (
          <span className={`tp-card-tier ${piece.tier}`}>
            <span className="pip" />
            {tierLabel}
          </span>
        )}
        <div className="photo-glyph">{piece.glyph}</div>
      </div>
      <div className="tp-card-body">
        <div className="tp-card-collection">{piece.collection}</div>
        <h3 className="tp-card-name slot" data-slot="design name">{piece.name}</h3>
        <div className="tp-card-meta">
          <span>{piece.type}{piece.size ? ` · Size ${piece.size}` : ""}</span>
          <span className="tp-card-msrp">MSRP <strong>${piece.msrp}</strong></span>
        </div>
        <div className="tp-card-rep slot" data-slot="brand separation">
          Offered by <strong>{repName}</strong>, an Independent Bomb Party Representative.
        </div>
      </div>
    </article>
  );
}

// ============================================================
// Expanded card (modal overlay)
// ============================================================
function ExpandedCard({ piece, onClose, onWantThis, repName }) {
  if (!piece) return null;
  const tierLabel = piece.tier === "unicorn" ? "Unicorn Magic" : piece.tier === "diamond" ? "Diamond Territory" : "Everyday Sparkle";
  return (
    <div className="tp-card-expand-mask" onClick={onClose}>
      <div className="tp-card-expand" onClick={(e) => e.stopPropagation()}>
        <button className="tp-card-close" onClick={onClose} aria-label="Close">×</button>
        <div className="tp-card-expand-photo slot" data-slot="jewelry photo">
          <div className="photo-glyph">{piece.glyph}</div>
        </div>
        <div className="tp-card-expand-body">
          <span className={`tp-card-tier ${piece.tier} tp-card-expand-tier`}>
            <span className="pip" />
            {tierLabel}
          </span>
          <div className="tp-card-expand-collection">{piece.collection} Collection</div>
          <h2 className="tp-card-expand-name slot" data-slot="design name">{piece.name}</h2>
          <p className="tp-card-expand-desc slot" data-slot="description">
            A {piece.type.toLowerCase()} from the {piece.collection} collection, featuring a {piece.stone.toLowerCase()} centerpiece. {piece.special ? piece.special + ". " : ""}This piece was revealed on a recent live show and is now available for one-for-one trade.
          </p>
          <dl className="tp-card-expand-specs">
            <div>
              <dt>Type</dt>
              <dd>{piece.type}{piece.size ? ` · Size ${piece.size}` : ""}</dd>
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
              <dd>${piece.msrp}</dd>
            </div>
          </dl>
          <div className="tp-card-expand-box slot" data-slot="reveal box photo">
            <div className="thumb">BOX</div>
            <div>Reveal box specs printed on label · {piece.material} · {piece.stone}{piece.special ? " · " + piece.special : ""}</div>
          </div>
          <div className="tp-card-expand-rep slot" data-slot="brand separation">
            Offered by <strong>{repName}</strong>, an Independent Bomb Party Representative. Trade is solely between you and {repName}.
          </div>
          <button className="tp-card-expand-cta" onClick={() => onWantThis(piece)}>
            I Want This
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Request sheet (bottom sheet form / success)
// ============================================================
function RequestSheet({ piece, onClose, onSubmit, success, repName }) {
  const [name, setName] = useState("");
  const [offering, setOffering] = useState("");
  const [agreed, setAgreed] = useState(false);
  if (!piece && !success) return null;
  if (success) {
    return (
      <div className="tp-sheet-mask" onClick={onClose}>
        <div className="tp-sheet success" onClick={(e) => e.stopPropagation()}>
          <button className="tp-sheet-close" onClick={onClose} aria-label="Close">×</button>
          <div className="tp-sheet-handle" />
          <div className="tp-sheet-success-icon">✓</div>
          <h3 className="tp-sheet-success-title">Request sent.</h3>
          <p className="tp-sheet-success-body">
            <strong>{repName}</strong> will review your trade after the show and follow up by message. The piece is now off the board.
          </p>
          <p className="tp-sheet-success-legal">
            This trade agreement is solely between you and <strong>{repName}</strong>, an Independent Bomb Party Representative. Neon Rabbit (the platform provider) is not a party to this trade and does not verify item condition, authenticity, or value. MSRP is self-reported by the rep.
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="tp-sheet-mask" onClick={onClose}>
      <div className="tp-sheet" onClick={(e) => e.stopPropagation()}>
        <button className="tp-sheet-close" onClick={onClose} aria-label="Close">×</button>
        <div className="tp-sheet-handle" />
        <div className="tp-sheet-eyebrow">Trade Request</div>
        <h3 className="tp-sheet-title">{piece.name}</h3>
        <div className="tp-sheet-piece">
          {piece.collection} · {piece.type} · MSRP <strong>${piece.msrp}</strong>
        </div>
        <form
          className="tp-sheet-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!agreed || !name || !offering) return;
            onSubmit();
          }}
        >
          <div className="tp-sheet-field">
            <label>Your name</label>
            <input
              type="text"
              placeholder="As shown on your reveal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="tp-sheet-field">
            <label>What you're offering to trade</label>
            <textarea
              placeholder="Describe the piece you got revealed — design name if you remember it, type, color, anything that helps."
              value={offering}
              onChange={(e) => setOffering(e.target.value)}
              required
            />
          </div>
          <label className="tp-sheet-consent">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
            />
            <span>
              I understand trades are <strong>as-is</strong>, condition and value are not verified by the platform, and MSRP is self-reported. This agreement is between me and the rep — not Neon Rabbit. I accept all risk.
            </span>
          </label>
          <button
            type="submit"
            className="tp-sheet-submit"
            disabled={!agreed || !name || !offering}
          >
            Submit trade request
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// Empty state
// ============================================================
function EmptyState({ repName }) {
  return (
    <div className="tp-empty">
      <div className="tp-empty-glyph">✦</div>
      <h3 className="tp-empty-title">Trade board's empty right now.</h3>
      <p className="tp-empty-sub">
        <strong>{repName}</strong> stocks the board during live shows. Catch the next reveal — there'll be plenty to trade by the end of the night.
      </p>
      <div className="tp-empty-next">
        <span className="live-dot" />
        Next show: Tue, Nov 12 · 8:00 PM CST
      </div>
    </div>
  );
}

// ============================================================
// FAQ
// ============================================================
const FAQS = [
  {
    q: "How does a trade actually work?",
    a: "When you don't love your reveal, you find a piece on the board that you do love and request it. The rep already has your unwanted piece (it was revealed on their show) — after the show ends, they review your request and ship the board piece to you. One-for-one. No money changes hands."
  },
  {
    q: "Can I add cash if the piece I want is worth more?",
    a: "Up to the rep. Some allow it, some don't. The platform doesn't process payments — anything beyond the trade itself is a private arrangement between you and the rep."
  },
  {
    q: "Why did the piece I wanted disappear?",
    a: "Someone else requested it before you did, or the rep took it down. Pieces vanish from the board the second a request is submitted. If a request is denied later, the piece reappears."
  },
  {
    q: "What are Unicorn Magic and Diamond Territory tiers?",
    a: "Bomb Party marks pieces by rarity. Unicorn Magic are the rarest and most sought-after reveals. Diamond Territory are higher-end pieces with actual diamonds. Everyday Sparkle is the standard — most reveals fall here."
  },
  {
    q: "Are MSRP values verified?",
    a: "No. MSRP is the price printed on the Bomb Party reveal box and is self-reported by the rep. The platform does not verify it. Trade at your own discretion."
  },
  {
    q: "How fast does the rep respond?",
    a: "Most reps batch trade requests after their show ends — usually within 24 hours. You'll get a message from the rep directly."
  },
];

function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <section className="tp-faq" id="faq">
      <h2>Trade rules.</h2>
      <p className="tp-faq-sub">The short version. Read once, trade forever.</p>
      {FAQS.map((f, i) => (
        <div key={i} className={`tp-faq-item ${open === i ? "open" : ""}`}>
          <div className="tp-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
            <span>{f.q}</span>
            <span className="chev">+</span>
          </div>
          <div className="tp-faq-a">
            <div className="tp-faq-a-inner">{f.a}</div>
          </div>
        </div>
      ))}
    </section>
  );
}

// ============================================================
// Footer (shared)
// ============================================================
function Footer({ businessName }) {
  return (
    <footer className="hp-footer">
      <div className="hp-footer-inner">
        <div>
          <div className="hp-footer-brand slot" data-slot="business name">{businessName}</div>
          <p className="hp-footer-tag">Live jewelry reveals every Tuesday at 8pm CST. Real pieces, real sparkle.</p>
          <div className="hp-footer-socials">
            <a href="#" className="hp-footer-social">TT</a>
            <a href="#" className="hp-footer-social">FB</a>
            <a href="#" className="hp-footer-social">IG</a>
            <a href="#" className="hp-footer-social">YT</a>
          </div>
        </div>
        <div className="hp-footer-col">
          <h4>Shop</h4>
          <ul>
            <li><a href="Trade.html">Trade Board</a></li>
            <li><a href="#">Bomb Party Catalog</a></li>
            <li><a href="#">Pre-orders</a></li>
            <li><a href="#">Past shows</a></li>
          </ul>
        </div>
        <div className="hp-footer-col">
          <h4>About</h4>
          <ul>
            <li><a href="Homepage.html">Home</a></li>
            <li><a href="#">My story</a></li>
            <li><a href="#">Join the team</a></li>
            <li><a href="#">FAQ</a></li>
          </ul>
        </div>
        <div className="hp-footer-col slot" data-slot="optional 4th column">
          <h4>Hosting Soon</h4>
          <ul>
            <li><a href="#">Halloween Spook-tacular · Oct 29</a></li>
            <li><a href="#">Holiday Gift Guide · Nov 24</a></li>
            <li><a href="#">Year-end Sparkle · Dec 17</a></li>
          </ul>
        </div>
      </div>
      <div className="hp-footer-bottom">
        <div className="legal-row">
          <span>© 2026 {businessName} · Powered by Sparkle Suite</span>
          <span><a href="#">Privacy</a> · <a href="#">Terms</a> · <a href="#">Accessibility</a></span>
        </div>
        <p>
          {businessName} is operated by an independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC.
          This site is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC. All product names,
          trademarks, and registered trademarks are property of their respective owners. Live show schedules subject to change. Trade Board
          listings are sold by the rep and not by Bomb Party LLC.
        </p>
      </div>
    </footer>
  );
}

// ============================================================
// Thumper launcher (shared)
// ============================================================
function Thumper() {
  return (
    <div className="hp-thumper">
      <button className="hp-thumper-btn" aria-label="Open Thumper">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 12a8 8 0 0 1-11.5 7.2L3 21l1.8-6.5A8 8 0 1 1 21 12z" />
        </svg>
        <span className="spark" />
      </button>
    </div>
  );
}

// ============================================================
// App
// ============================================================
function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);
  const [expanded, setExpanded] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [success, setSuccess] = useState(false);
  const [activeType, setActiveType] = useState("all");

  // Tweak: open the request form on demand (cycles thru: closed → form → success)
  useEffect(() => {
    if (t.demoSheet === "form") {
      // open form for a sample piece
      const samples = buildSamples(t.cardCount);
      setRequesting(samples[0]);
      setSuccess(false);
      setExpanded(null);
    } else if (t.demoSheet === "success") {
      setRequesting({ id: 0 });
      setSuccess(true);
      setExpanded(null);
    } else {
      setRequesting(null);
      setSuccess(false);
    }
    // eslint-disable-next-line
  }, [t.demoSheet, t.cardCount]);

  // Apply tokens
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
    root.style.setProperty("--hp-heading-weight", t.headingWeight);
    root.style.setProperty("--hp-saturation", (t.saturation || 100) / 100);
    root.style.setProperty("--ticker-speed", t.tickerSpeed);
  }, [t]);

  // Apply body classes
  useEffect(() => {
    const body = document.body;
    body.className = "tradepage";
    if (t.showSlots) body.classList.add("slots-on");
    if (t.bgTreatment === "mesh") body.classList.add("bg-mesh");
    if (t.bgTreatment === "confetti") body.classList.add("fx-confetti");
    if (t.bgTreatment === "aurora") body.classList.add("fx-aurora");
    if (t.cardSurface === "glass") body.classList.add("surface-glass");
    if (t.cardSurface === "holographic") body.classList.add("fx-holographic");
    if (t.textureOverlay === "grain") body.classList.add("tex-grain");
    if (t.textureOverlay === "sparkle") body.classList.add("tex-sparkle");
    if (t.buttonEnergy === "bouncy") body.classList.add("btn-bouncy");
    if (t.buttonEnergy === "wiggle") body.classList.add("btn-wiggle");
    if (t.ctaEmphasis === "pulse") body.classList.add("cta-pulse");
    if (t.tradeFlair === "holo-unicorn") body.classList.add("holo-unicorn");
    if (t.cursorEffect === "sparkle") body.classList.add("cursor-sparkle");
    if (t.density === "compact") body.classList.add("density-compact");
    if (t.density === "spacious") body.classList.add("density-spacious");
    if (t.shapeRadius === "sharp") body.classList.add("shape-sharp");
    if (t.shapeRadius === "soft") body.classList.add("shape-soft");
  }, [t]);

  const applyPreset = (p) => {
    const presetVals = PRESETS[p];
    if (!presetVals) return;
    setTweak({ preset: p, ...presetVals });
  };

  const samples = useMemo(() => buildSamples(t.cardCount), [t.cardCount]);
  const filtered = activeType === "all" ? samples : samples.filter(s => s.type === activeType);
  const live = t.liveState === "live";
  const isEmpty = t.contentState === "empty";

  return (
    <>
      <SparkleFx level={t.sparkleLevel} />

      <div className="hp-saturate">
        <Header businessName={t.businessName} />

        {t.showTicker && <Ticker topText={t.tickerTopText} />}

        <MobileDrawer live={live} />

        {t.showHero && <TradeHero repName={t.repName} businessName={t.businessName} />}

        <section className="tp-board">
          <div className={`tp-board-inner ${live ? "" : "no-lrq"}`}>
            {live && <LRQRail live={live} />}
            <div>
              <Filters style={t.filterStyle} activeType={activeType} setActiveType={setActiveType} />
              {isEmpty ? (
                <div className="tp-grid-wrap"><EmptyState repName={t.repName} /></div>
              ) : (
                <div className="tp-grid-wrap">
                  <div className={`tp-grid aspect-${t.cardAspect}`}>
                    {filtered.map((piece) => (
                      <TradeCard
                        key={piece.id}
                        piece={piece}
                        onTap={(p) => setExpanded(p)}
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
            All listings are offered by <strong>{t.repName}</strong>, an Independent Bomb Party Representative. Trades are private agreements between you and the rep. Bomb Party® is a registered trademark of Bomb Party LLC. This trade board is not endorsed by, affiliated with, or operated by Bomb Party LLC. MSRP values are self-reported and not verified by the platform.
          </div>
        )}

        {t.showFooter && <Footer businessName={t.businessName} />}
      </div>

      {t.showThumper && <Thumper />}

      <ExpandedCard
        piece={expanded}
        onClose={() => setExpanded(null)}
        onWantThis={(p) => { setExpanded(null); setRequesting(p); setSuccess(false); }}
        repName={t.repName}
      />

      <RequestSheet
        piece={requesting}
        onClose={() => { setRequesting(null); setSuccess(false); setTweak("demoSheet", "closed"); }}
        onSubmit={() => setSuccess(true)}
        success={success}
        repName={t.repName}
      />

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Tweaks" subtitle="Tune the trade board" defaultWidth={380}>
        <TweakSection title="Trade board" subtitle="Page-specific behavior">
          <TweakRadio
            label="Live state"
            value={t.liveState}
            onChange={(v) => setTweak("liveState", v)}
            options={[
              { value: "live", label: "Live show" },
              { value: "offline", label: "Offline" },
            ]}
          />
          <TweakRadio
            label="Content"
            value={t.contentState}
            onChange={(v) => setTweak("contentState", v)}
            options={[
              { value: "populated", label: "Populated" },
              { value: "empty", label: "Empty" },
            ]}
          />
          <TweakSlider
            label="Number of listings"
            value={t.cardCount}
            onChange={(v) => setTweak("cardCount", v)}
            min={6} max={30} step={2}
          />
          <TweakRadio
            label="Card aspect"
            value={t.cardAspect}
            onChange={(v) => setTweak("cardAspect", v)}
            options={[
              { value: "portrait", label: "Portrait 4:5" },
              { value: "square", label: "Square" },
            ]}
          />
          <TweakRadio
            label="Tier labels"
            value={t.tierVisibility}
            onChange={(v) => setTweak("tierVisibility", v)}
            options={[
              { value: "rare", label: "Rare only" },
              { value: "all", label: "All tiers" },
            ]}
          />
          <TweakSelect
            label="Filter bar style"
            value={t.filterStyle}
            onChange={(v) => setTweak("filterStyle", v)}
            options={[
              { value: "pills", label: "Horizontal pills" },
              { value: "dropdowns", label: "Dropdowns" },
            ]}
          />
          <TweakRadio
            label="Demo: request sheet"
            value={t.demoSheet}
            onChange={(v) => setTweak("demoSheet", v)}
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
              { value: "editorial", label: "Editorial" },
              { value: "softGlam", label: "Soft Glam" },
              { value: "sparkleParty", label: "Sparkle Party" },
              { value: "maximum", label: "Maximum" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Sparkle & motion">
          <TweakRadio
            label="Sparkle level"
            value={t.sparkleLevel}
            onChange={(v) => setTweak("sparkleLevel", v)}
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
            onChange={(v) => setTweak("buttonEnergy", v)}
            options={[
              { value: "calm", label: "Calm" },
              { value: "bouncy", label: "Bouncy" },
              { value: "wiggle", label: "Wiggle" },
            ]}
          />
          <TweakRadio
            label="CTA emphasis"
            value={t.ctaEmphasis}
            onChange={(v) => setTweak("ctaEmphasis", v)}
            options={[
              { value: "standard", label: "Standard" },
              { value: "pulse", label: "Pulse" },
            ]}
          />
          <TweakSlider
            label="Ticker speed"
            value={t.tickerSpeed}
            onChange={(v) => setTweak("tickerSpeed", v)}
            min={0.3} max={3} step={0.1}
          />
        </TweakSection>

        <TweakSection title="Background & texture">
          <TweakSelect
            label="Background treatment"
            value={t.bgTreatment}
            onChange={(v) => setTweak("bgTreatment", v)}
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
            onChange={(v) => setTweak("cardSurface", v)}
            options={[
              { value: "matte", label: "Matte" },
              { value: "glass", label: "Glass" },
              { value: "holographic", label: "Holographic" },
            ]}
          />
          <TweakSelect
            label="Texture overlay"
            value={t.textureOverlay}
            onChange={(v) => setTweak("textureOverlay", v)}
            options={[
              { value: "none", label: "None" },
              { value: "grain", label: "Grain" },
              { value: "sparkle", label: "Sparkle dust" },
            ]}
          />
          <TweakRadio
            label="Cursor effect"
            value={t.cursorEffect}
            onChange={(v) => setTweak("cursorEffect", v)}
            options={[
              { value: "default", label: "Default" },
              { value: "sparkle", label: "Sparkle ✦" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Color">
          <TweakSelect
            label="Background tone"
            value={t.bgTone}
            onChange={(v) => setTweak("bgTone", v)}
            options={[
              { value: "lavender", label: "Lavender (Amethyst)" },
              { value: "warm", label: "Warm peach" },
              { value: "cool", label: "Cool blue" },
              { value: "paper", label: "Paper" },
              { value: "neon", label: "Neon pink" },
              { value: "midnight", label: "Midnight" },
            ]}
          />
          <TweakColor
            label="Primary"
            value={t.primaryColor}
            onChange={(v) => setTweak("primaryColor", v)}
          />
          <TweakColor
            label="Accent"
            value={t.accentColor}
            onChange={(v) => setTweak("accentColor", v)}
          />
          <TweakSlider
            label="Saturation"
            value={t.saturation}
            onChange={(v) => setTweak("saturation", v)}
            min={50} max={180} step={5}
            unit="%"
          />
        </TweakSection>

        <TweakSection title="Typography & shape">
          <TweakSelect
            label="Heading font"
            value={t.headingFont}
            onChange={(v) => setTweak("headingFont", v)}
            options={[
              { value: "vend", label: "Vend Sans (default)" },
              { value: "serif", label: "Editorial serif" },
              { value: "italiana", label: "Glam serif" },
              { value: "bubbly", label: "Bubbly rounded" },
              { value: "chunky", label: "Chunky display" },
            ]}
          />
          <TweakSlider
            label="Heading weight"
            value={t.headingWeight}
            onChange={(v) => setTweak("headingWeight", v)}
            min={300} max={900} step={100}
          />
          <TweakRadio
            label="Corner radius"
            value={t.shapeRadius}
            onChange={(v) => setTweak("shapeRadius", v)}
            options={[
              { value: "sharp", label: "Sharp" },
              { value: "default", label: "Default" },
              { value: "soft", label: "Soft" },
            ]}
          />
          <TweakRadio
            label="Density"
            value={t.density}
            onChange={(v) => setTweak("density", v)}
            options={[
              { value: "compact", label: "Compact" },
              { value: "regular", label: "Regular" },
              { value: "spacious", label: "Spacious" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Section visibility">
          <TweakToggle label="Ticker" value={t.showTicker} onChange={(v) => setTweak("showTicker", v)} />
          <TweakToggle label="Page hero" value={t.showHero} onChange={(v) => setTweak("showHero", v)} />
          <TweakToggle label="FAQ" value={t.showFaq} onChange={(v) => setTweak("showFaq", v)} />
          <TweakToggle label="Brand separation note" value={t.showLegal} onChange={(v) => setTweak("showLegal", v)} />
          <TweakToggle label="Footer" value={t.showFooter} onChange={(v) => setTweak("showFooter", v)} />
          <TweakToggle label="Thumper launcher" value={t.showThumper} onChange={(v) => setTweak("showThumper", v)} />
        </TweakSection>

        <TweakSection title="Copy sandbox">
          <TweakText label="Rep name" value={t.repName} onChange={(v) => setTweak("repName", v)} />
          <TweakText label="Business name" value={t.businessName} onChange={(v) => setTweak("businessName", v)} />
          <TweakText label="Ticker top row" value={t.tickerTopText} onChange={(v) => setTweak("tickerTopText", v)} />
        </TweakSection>

        <TweakSection title="Slot inspector">
          <TweakToggle label="Show edit slots overlay" value={t.showSlots} onChange={(v) => setTweak("showSlots", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
