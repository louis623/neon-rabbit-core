/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

// Read tweaks panel components from the global scope (loaded from tweaks-panel.jsx)
const {
  TweaksPanel, useTweaks,
  TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakColor, TweakText, TweakButton, TweakNumber
} = window;

// ============================================================
// Default tweak values — wrapped in EDITMODE markers for persistence
// ============================================================
// Tweak defaults are bootstrapped from the Next app so the locked export can
// read structured rep data without changing layout or motion behavior.
const DEFAULTS = window.HOMEPAGE_TWEAK_DEFAULTS || {
  repName: "Rep Name",
  businessName: "Show Name",
  tagline: "Live jewelry reveals every Tuesday - joy you can hold.",
  heroHeadline: "Real jewelry. Live reveals. Pure sparkle.",
  heroSub: "I'm Rep Name - every Tuesday at 8pm CST I open Bomb Party boxes live and you watch what's inside, real time.",
  buttonStyle: "sparkle",
  tickerVariant: "dual",
  nicNacStyle: "square",
  showTicker: true,
  showLrq: true,
  showHero: true,
  showEvents: true,
  showWibp: true,
  showAbout: true,
  showSignup: true,
  showJoinCta: true,
  showFooter: true,
  showNicNac: true,
  eventCount: 2,
  lrqState: "live",
  tickerTopText: "Live tonight - 8pm CST | Use code AMETHYST15 | Pre-orders close Friday | New Unicorn drops Tuesday",
  primaryColor: "#5C0EFF",
  accentColor: "#FF1AC2",
  bgTone: "lavender",
  headingFont: "italiana",
  bodyFont: "inter",
  headingWeight: 600,
  shapeRadius: "soft",
  density: "regular",
  saturation: 130,
  preset: "sparkleParty",
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
const CONTENT = window.AMETHYST_HOMEPAGE_TEMPLATE_DATA || {};
const DEFAULT_HOMEPAGE_EVENTS = [
  {
    id: "default-homepage-event-1",
    title: "Unicorn Magic Drop",
    description: "Main live reveal",
    eventTime: "2099-11-12T20:00:00.000Z",
    durationMinutes: 60,
    featured: true,
    codes: [
      { code: "UNICORN15", desc: "15% off Unicorn tier boxes" },
      { code: "FREESHIP75", desc: "Free shipping on orders $75+" },
    ],
    collections: [
      { label: "Citrine Sun Series", href: "/amethyst/Trade.html?collection=Citrine%20Sun%20Series" },
      { label: "Holiday Gift Guide", href: "/amethyst/Trade.html?collection=Holiday%20Gift%20Guide" },
    ],
    platforms: [
      { kind: "tt", label: "Join me on TikTok", href: "#" },
      { kind: "fb", label: "Watch on Facebook Live", href: "#" },
    ],
  },
  {
    id: "default-homepage-event-2",
    title: "Saturday Sparkle Brunch",
    description: "Weekend bonus show",
    eventTime: "2099-11-16T13:00:00.000Z",
    durationMinutes: 60,
    featured: false,
    codes: [{ code: "BRUNCH10", desc: "10% off Saturday show purchases" }],
    collections: [
      { label: "Diamond Territory", href: "/amethyst/Trade.html?collection=Diamond%20Territory" },
    ],
    platforms: [
      { kind: "tt", label: "Join me on TikTok", href: "#" },
    ],
  },
];
const HOMEPAGE_EVENT_PAYLOAD = Array.isArray(window.AMETHYST_HOMEPAGE_EVENTS) && window.AMETHYST_HOMEPAGE_EVENTS.length > 0
  ? window.AMETHYST_HOMEPAGE_EVENTS
  : DEFAULT_HOMEPAGE_EVENTS;

function isExternalHref(href) {
  return /^https?:\/\//.test(href || "");
}

function linkProps(href) {
  return isExternalHref(href)
    ? { href, target: "_blank", rel: "noreferrer noopener" }
    : { href: href || "#" };
}

function getShopHref() {
  return CONTENT.streamLinks?.shop || "#";
}

function getTradeBoardHref() {
  return CONTENT.footerLinks?.tradeBoard || "/amethyst/Trade.html";
}

function getWatchHref() {
  return CONTENT.streamLinks?.watch || CONTENT.streamLinks?.tiktok || "#";
}

function getJoinTeamHref() {
  return CONTENT.joinTeamUrl || "/amethyst/Join.html";
}

function getUnsubscribeHref() {
  return CONTENT.footerLinks?.unsubscribe || "/amethyst/Unsubscribe.html";
}

function getPlatformHref(platform) {
  return CONTENT.streamLinks?.[platform] || getWatchHref();
}

function getSocialHref(shortLabel) {
  return CONTENT.socialLinks?.find((link) => link.shortLabel === shortLabel)?.href || "#";
}

function getAboutMediaSlot(index) {
  return CONTENT.aboutMediaSlots?.[index] || null;
}

function aboutMediaStyle(slot) {
  if (!slot?.mediaUrl) return undefined;
  return {
    backgroundImage: `linear-gradient(rgba(14, 8, 32, 0.24), rgba(14, 8, 32, 0.52)), url("${slot.mediaUrl}")`,
    backgroundPosition: "center",
    backgroundSize: "cover",
  };
}

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
      ? "Unboxing now"
      : index === 1
        ? "On deck"
        : index === 2
          ? "Up next"
          : "In queue",
  name,
  highlight: index === 0,
}));

// ============================================================
// Preset combos
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
  sparkle_suite_morganite: {
    sparkleLevel: "subtle", bgTreatment: "suite-paper", cardSurface: "warm-paper",
    textureOverlay: "none", buttonEnergy: "suite-lift", ctaEmphasis: "standard",
    tradeFlair: "soft-pink-lift", cursorEffect: "default", saturation: 104,
    bgTone: "suiteBlush", primaryColor: "#ee2c9b", accentColor: "#ff4cae",
    headingFont: "playfair", bodyFont: "dmSans", headingWeight: 500,
  },
  maximum: {
    sparkleLevel: "maximum", bgTreatment: "aurora", cardSurface: "holographic",
    textureOverlay: "sparkle", buttonEnergy: "wiggle", ctaEmphasis: "pulse",
    tradeFlair: "holo-unicorn", cursorEffect: "sparkle", saturation: 150,
    bgTone: "neon", primaryColor: "#3300FF", accentColor: "#FF00CC",
  },
};

// ============================================================
// Color tone palettes
// ============================================================
const TONES = {
  lavender: { bg: "#E8DFF5", elevated: "#F2EBFA", deep: "#DCD0EE" },
  warm:     { bg: "#FFF0E8", elevated: "#FFF7F1", deep: "#FFE2D0" },
  cool:     { bg: "#E0EBFF", elevated: "#EEF3FF", deep: "#CFDFFF" },
  paper:    { bg: "#FAF7F2", elevated: "#FFFFFF", deep: "#F0EAE0" },
  midnight: { bg: "#1A0F2E", elevated: "#241640", deep: "#100828" },
  neon:     { bg: "#FFE6FA", elevated: "#FFF0FD", deep: "#FFD1F2" },
  suiteBlush: { bg: "#fcf8f6", elevated: "#fffefd", deep: "#f6ede8" },
};

const FONTS = {
  vend: '"Vend Sans", "Inter", system-ui, sans-serif',
  inter: '"Inter", system-ui, sans-serif',
  serif: '"Fraunces", "Domine", Georgia, serif',
  italiana: '"Italiana", "Playfair Display", serif',
  playfair: '"Playfair Display", Georgia, serif',
  dmSans: '"DM Sans", "Inter", system-ui, sans-serif',
  bubbly: '"Quicksand", "Nunito", system-ui, sans-serif',
  chunky: '"Archivo Black", "Inter", sans-serif',
};

// ============================================================
// LRQ rail
// ============================================================
function LRQRail({ state }) {
  if (state === "offline") {
    return (
      <div className="hp-lrq">
        <div className="hp-lrq-inner">
          <div className="hp-lrq-title" style={{ color: "var(--fg-muted)" }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--fg-muted)" }} />
            Live Reveal Queue
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>Show ended — see you next Tuesday at 8pm CST.</div>
        </div>
      </div>
    );
  }
  if (state === "loading") {
    return (
      <div className="hp-lrq">
        <div className="hp-lrq-inner">
          <div className="hp-lrq-title">
            <span className="live-dot" />
            Live Reveal Queue
          </div>
          <div style={{ fontSize: 13, color: "var(--fg-muted)" }}>Loading queue…</div>
        </div>
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="hp-lrq">
        <div className="hp-lrq-inner">
          <div className="hp-lrq-title">
            <span className="live-dot" />
            Live Reveal Queue
          </div>
          <div style={{ fontSize: 13, color: "var(--fg)", fontWeight: 600 }}>✦ Ready to Reveal! ✦</div>
        </div>
      </div>
    );
  }
  return (
    <div className="hp-lrq">
      <div className="hp-lrq-inner">
        <div className="hp-lrq-title">
          <span className="live-dot" />
          Live Reveal Queue
        </div>
        <div className="hp-lrq-items">
          <div className="hp-lrq-item">
            <span className="pos">1</span>
            <span className="label">Currently Unboxing</span>
            <span className="name slot" data-slot="customer name">Jamie L.</span>
          </div>
          <div className="hp-lrq-item on-deck">
            <span className="pos">2</span>
            <span className="label">On Deck</span>
            <span className="name slot" data-slot="customer name">Priya M.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Hero (HE2)
// ============================================================
function Hero({ t }) {
  return (
    <section className="hp-hero">
      <div className="hp-hero-media placeholder slot" data-slot="hero photo" />
      <div className="hp-hero-inner">
        <div>
          <div className="hp-hero-eyebrow">Live Tuesdays · 8pm CST</div>
          <h1 className="hp-hero-headline slot" data-slot="hero headline">
            {t.heroHeadline.split(/(?<=[.!?])\s+/).map((line, i) => (
              <span key={i} style={{ display: 'block' }}>{line}</span>
            ))}
          </h1>
          <p className="hp-hero-sub slot" data-slot="hero sub">{t.heroSub}</p>
          <div className="hp-hero-ctas">
            <a {...linkProps(getTradeBoardHref())} className="hp-btn-primary hp-btn-sparkle">
              Browse the trade board
              <span className="spark" /><span className="spark" /><span className="spark" /><span className="spark" />
            </a>
            <a {...linkProps(getShopHref())} className="hp-btn-outline">Shop Bomb Party</a>
            <a {...linkProps(getWatchHref())} className="hp-btn-outline hp-btn-watch"><span className="hp-watch-dot" />Watch Live</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Ticker (T3 dual)
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
    <div className="hp-ticker" id="trade-board">
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
            <a key={i} {...linkProps(getTradeBoardHref())} className="hp-ticker-trade">
              <span className={`pip ${tr.tier}`} />
              {tr.name} · {tr.price}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}

function LiveQueueStrip({ state, onOpen }) {
  if (state === "offline") {
    return (
      <section className="hp-trade-preview">
        <div className="hp-trade-preview-inner">
          <div className="hp-trade-preview-head">
            <span className="live-dot" style={{ background: "var(--fg-muted)" }} />
            <span>Live Reveal Queue</span>
          </div>
          <div className="hp-trade-preview-items" style={{ color: "var(--fg-muted)" }}>
            Show ended — see you next Tuesday at 8pm CST.
          </div>
          <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ↗</button>
        </div>
      </section>
    );
  }

  if (state === "loading") {
    return (
      <section className="hp-trade-preview">
        <div className="hp-trade-preview-inner">
          <div className="hp-trade-preview-head">
            <span className="live-dot" />
            <span>Live Reveal Queue</span>
          </div>
          <div className="hp-trade-preview-items">
            Loading queue…
          </div>
          <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ↗</button>
        </div>
      </section>
    );
  }

  if (state === "empty") {
    return (
      <section className="hp-trade-preview">
        <div className="hp-trade-preview-inner">
          <div className="hp-trade-preview-head">
            <span className="live-dot" />
            <span>Live Reveal Queue</span>
          </div>
          <div className="hp-trade-preview-items">
            Ready to reveal.
          </div>
          <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ↗</button>
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
        <button type="button" className="hp-trade-preview-link" onClick={onOpen}>View full queue ↗</button>
      </div>
    </section>
  );
}

function LiveQueueModal({ open, onClose, state }) {
  if (!open) return null;

  const live = state !== "offline" && state !== "loading" && state !== "empty";

  return (
    <div className="hp-queue-modal-mask" onClick={onClose}>
      <div className="hp-queue-modal" onClick={(event) => event.stopPropagation()}>
        <div className="hp-queue-modal-head">
          <div>
            <div className="hp-queue-modal-eyebrow">Live Reveal Queue</div>
            <h2 className="hp-queue-modal-title">
              {live ? "Full queue" : state === "loading" ? "Loading queue" : state === "empty" ? "Queue ready" : "No live queue right now"}
            </h2>
          </div>
          <button type="button" className="hp-queue-modal-close" onClick={onClose} aria-label="Close live reveal queue">×</button>
        </div>

        {state === "offline" ? (
          <div className="hp-queue-modal-empty">No show is running right now. Check back Tuesday at 8pm CST.</div>
        ) : state === "loading" ? (
          <div className="hp-queue-modal-empty">Loading queue…</div>
        ) : state === "empty" ? (
          <div className="hp-queue-modal-empty">The live queue is empty right now, so you are ready for the next reveal.</div>
        ) : (
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
        )}
      </div>
    </div>
  );
}

// ============================================================
// Events
// ============================================================
const EVENTS = Array.isArray(HOMEPAGE_EVENT_PAYLOAD) && HOMEPAGE_EVENT_PAYLOAD.length > 0 ? HOMEPAGE_EVENT_PAYLOAD : [
  {
    when: "Tue, Nov 12 · 8:00 PM EST", featured: true, name: "Unicorn Magic Drop · November",
    codes: [
      { code: "UNICORN15", desc: "15% off Unicorn tier boxes" },
      { code: "FREESHIP75", desc: "Free shipping on orders $75+" },
      { code: "STACK3", desc: "Buy 3 boxes, get $10 off" },
      { code: "NEWBIE10", desc: "10% off your first order" },
    ],
    collections: ["Citrine Sun Series", "Estate Halo Drop", "November Unicorns", "Holiday Gift Guide"],
    platforms: ["tt", "fb"],
  },
  {
    when: "Sat, Nov 16 · 1:00 PM EST", featured: false, name: "Saturday Sparkle Brunch",
    codes: [
      { code: "BRUNCH10", desc: "10% off Saturday show purchases" },
      { code: "FREESHIP75", desc: "Free shipping on orders $75+" },
      { code: "GIFT20", desc: "$20 off Holiday gift bundles" },
    ],
    collections: ["Holiday Gift Guide", "Diamond Territory"],
    platforms: ["tt"],
  },
];

function formatEventDateLabel(eventTime) {
  const parsed = new Date(eventTime);
  if (Number.isNaN(parsed.getTime())) return eventTime;

  return new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(parsed);
}

function formatEventTimeLabel(eventTime) {
  const parsed = new Date(eventTime);
  if (Number.isNaN(parsed.getTime())) return eventTime;

  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(parsed);
}

function sanitizeCalendarFilename(title) {
  return (title || "upcoming-show")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function escapeCalendarText(value) {
  return (value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function toCalendarTimestamp(eventTime) {
  return new Date(eventTime)
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}Z$/, "Z");
}

function buildCalendarDescription(event) {
  const parts = [];

  if (event.description) {
    parts.push(event.description);
  }

  if (Array.isArray(event.codes) && event.codes.length > 0) {
    parts.push(
      `Discount codes: ${event.codes.map((code) => `${code.code} - ${code.desc}`).join("; ")}`,
    );
  }

  if (Array.isArray(event.platforms) && event.platforms.length > 0) {
    parts.push(
      `Watch links: ${event.platforms.map((platform) => `${platform.label}: ${platform.href}`).join(" | ")}`,
    );
  }

  return parts.join("\n\n");
}

function downloadCalendarEvent(event) {
  const startAt = Date.parse(event.eventTime);
  if (Number.isNaN(startAt)) return;

  const endAt = startAt + ((event.durationMinutes || 60) * 60 * 1000);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Neon Rabbit//Sparkle Suite//EN",
    "BEGIN:VEVENT",
    `UID:${event.id}@neonrabbit.net`,
    `DTSTAMP:${toCalendarTimestamp(new Date().toISOString())}`,
    `DTSTART:${toCalendarTimestamp(event.eventTime)}`,
    `DTEND:${toCalendarTimestamp(new Date(endAt).toISOString())}`,
    `SUMMARY:${escapeCalendarText(event.title)}`,
    `DESCRIPTION:${escapeCalendarText(buildCalendarDescription(event))}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${sanitizeCalendarFilename(event.title)}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

function normalizeHomepageEvent(event) {
  const title = event.title || event.name || "Upcoming live reveal";
  const eventTime = event.eventTime || null;
  const when = event.when || (eventTime
    ? `${formatEventDateLabel(eventTime)} Â· ${formatEventTimeLabel(eventTime)}`
    : "Date TBD Â· Time TBD");
  const platforms = Array.isArray(event.platforms)
    ? event.platforms.map((platform) => {
        if (typeof platform === "string") {
          return platform === "fb"
            ? { kind: "fb", label: "Watch on Facebook Live", href: "#" }
            : { kind: "tt", label: "Join me on TikTok", href: "#" };
        }

        return platform;
      })
    : [];
  const collections = Array.isArray(event.collections)
    ? event.collections.map((collection) => (
        typeof collection === "string"
          ? { label: collection, href: "#" }
          : collection
      ))
    : [];

  return {
    ...event,
    title,
    name: title,
    description: event.description || null,
    eventTime,
    durationMinutes: event.durationMinutes || 60,
    when,
    codes: Array.isArray(event.codes) ? event.codes : [],
    collections,
    platforms,
  };
}

function EventCodeRow({ code, desc }) {
  const [copied, setCopied] = React.useState(false);
  const onCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1400);
  };
  return (
    <div className="hp-event-code-row">
      <div className="hp-event-code-text">
        <strong>{code}</strong>
        <span className="dash"> — </span>
        <span className="desc">{desc}</span>
      </div>
      <button className={`hp-event-copy ${copied ? "copied" : ""}`} onClick={onCopy}>
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Events({ count }) {
  return (
    <section className="hp-section" id="events">
      <div className="hp-container">
        <div className="hp-events-head">
          <div className="hp-section-eyebrow">Upcoming Shows</div>
          <h2 className="hp-section-title">Mark your calendar. The next two reveals.</h2>
          <p className="hp-section-sub">Times shown in your local timezone. Tap a code to copy it before showtime.</p>
        </div>
        <div className="hp-event-grid" style={{ gridTemplateColumns: count === 1 ? "1fr" : undefined }}>
          {HOMEPAGE_EVENT_PAYLOAD.slice(0, count).map((rawEvent, i) => { const event = normalizeHomepageEvent(rawEvent); const ev = event;
            const [dateStr, timeStr] = ev.when.split(" · ");
            return (
              <article key={i} className={`hp-event-card ${ev.featured ? "featured" : ""}`}>
                {ev.featured && <span className="hp-event-pill"><span className="pip" />Featured</span>}
                <h3 className="hp-event-name slot" data-slot="event name">{ev.name}</h3>
                <div className="hp-event-meta">
                  <div className="hp-event-meta-row">
                    <span className="hp-event-meta-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                    </span>
                    <span className="slot" data-slot="event date">{dateStr}</span>
                  </div>
                  <div className="hp-event-meta-row">
                    <span className="hp-event-meta-icon" aria-hidden="true">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                    </span>
                    <span>{timeStr}</span>
                  </div>
                </div>

                <div className="hp-event-section">
                  <div className="hp-event-section-head">
                    <span className="hp-event-section-icon discounts" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21s-7-4.35-7-10a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 5.65-7 10-7 10-1.5 1-2.5 1-4 0z"/></svg>
                    </span>
                    <span className="hp-event-section-title">Discounts</span>
                  </div>
                  <div className="hp-event-codes">
                    {ev.codes.map((c, j) => (
                      <EventCodeRow key={j} code={c.code} desc={c.desc} />
                    ))}
                  </div>
                </div>

                <div className="hp-event-section">
                  <div className="hp-event-section-head">
                    <span className="hp-event-section-icon featured-collections" aria-hidden="true">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>
                    </span>
                    <span className="hp-event-section-title">Featured Collections</span>
                  </div>
                  <div className="hp-event-collections">
                    {event.collections.map((collection, j) => (
                      <a key={j} {...linkProps(collection.href)} className="hp-event-collection-pill">{collection.label}</a>
                    ))}
                  </div>
                </div>

                <div className="hp-event-actions">
                  {event.platforms.map((platform) => (
                    <a key={`${event.id}-${platform.kind}`} {...linkProps(platform.href)} className={`hp-event-platform ${platform.kind}`}>
                      <span className={`glyph ${platform.kind}`} />
                      {platform.label}
                    </a>
                  ))}
                  <button className="hp-event-add" onClick={() => downloadCalendarEvent(event)}>+ Add to calendar</button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// What is a Bomb Party
// ============================================================
function Wibp({ repName }) {
  return (
    <section className="hp-section" id="wibp" style={{ background: "var(--hp-bg-elevated)" }}>
      <div className="hp-container">
        <div className="hp-wibp-grid">
          <div className="hp-wibp-card">
            <div className="hp-wibp-eyebrow">First time here?</div>
            <h2 className="hp-wibp-title">It's a live jewelry reveal — with <span className="slot" data-slot="rep name">{repName}</span></h2>
            <p className="hp-wibp-body">
              You order a sealed box, then watch <span className="slot" data-slot="rep name">{repName}</span> open it live on TikTok or Facebook.
              Every box has real jewelry inside — some Everyday Sparkle, some Diamond Territory, and a few rare Unicorn Magic pieces hidden throughout the show.
              After the reveal, your jewelry ships straight to your door from Bomb Party.
            </p>
            <div className="hp-steps">
              <div className="hp-step">
                <div className="hp-step-num">1</div>
                <div className="hp-step-label">Order</div>
                <div className="hp-step-desc">Pick a box, place pre-order before showtime.</div>
              </div>
              <div className="hp-step">
                <div className="hp-step-num">2</div>
                <div className="hp-step-label">Watch Live</div>
                <div className="hp-step-desc">Join the reveal on TikTok or Facebook.</div>
              </div>
              <div className="hp-step">
                <div className="hp-step-num">3</div>
                <div className="hp-step-label">Receive</div>
                <div className="hp-step-desc">Real jewelry ships to your door.</div>
              </div>
            </div>
          </div>
          <div className="hp-wibp-video slot" data-slot="showcase video">
            <div className="hp-wibp-video-meta">
              <div className="hp-video-pill"><span className="pip" />TikTok · Loops</div>
              <div className="hp-video-play">▶</div>
            </div>
            <div className="hp-wibp-video-caption">@sparklebysasha · "When the box hits different..."</div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// About
// ============================================================
function AboutSection({ repName }) {
  return (
    <section className="hp-section" id="about">
      <div className="hp-container">
        <div className="hp-about-grid">
          <div className="hp-about-copy">
            <div className="hp-section-eyebrow">About the rep</div>
            <h2 className="hp-section-title slot" data-slot="about headline">
              Meet <span className="slot" data-slot="rep name">{repName}</span> and the story behind the sparkle.
            </h2>
            <div className="hp-about-body">
              <p className="slot" data-slot="about paragraph 1">
                Share how you got started, what customers can expect in your live reveals, and why this business matters to you.
                This should feel personal, warm, and easy for new shoppers to connect with.
              </p>
              <p className="slot" data-slot="about paragraph 2">
                Talk about your community, your favorite kinds of reveals, or the energy you bring to show nights. Nic-Nac can
                rewrite this to match your voice while keeping the section polished and on-brand.
              </p>
              <p className="slot" data-slot="about paragraph 3">
                Add a final paragraph about your schedule, what makes your page special, or what you love most about helping
                customers find pieces they get excited to wear.
              </p>
            </div>
          </div>

          <div className="hp-about-media-grid">
            <div className="hp-about-media-card hp-about-media-card-tall slot" data-slot="about media 1">
              <div className="hp-about-media-type">TikTok or reel</div>
              <div className="hp-about-media-play">â–¶</div>
              <div className="hp-about-media-caption">Drop in a TikTok, short reel, or vertical intro video.</div>
            </div>
            <div className="hp-about-media-card slot" data-slot="about media 2">
              <div className="hp-about-media-type">Photo</div>
              <div className="hp-about-media-caption">Add a lifestyle photo, show setup image, or team snapshot.</div>
            </div>
            <div className="hp-about-media-card slot" data-slot="about media 3">
              <div className="hp-about-media-type">Photo or video</div>
              <div className="hp-about-media-caption">Use this slot for another customer-facing image, embed, or promo clip.</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Signup
// ============================================================
function Signup({ repName, businessName }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    smsConsent: false,
    emailConsent: false,
    marketingConsent: false,
  });
  const [submitState, setSubmitState] = useState({ status: "idle", message: "" });

  function updateField(key, value) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitState({ status: "submitting", message: "" });

    try {
      const response = await fetch("/api/amethyst/customer-audience", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone,
          smsConsent: form.smsConsent,
          emailConsent: form.emailConsent,
          marketingConsent: form.marketingConsent,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitState({
          status: "error",
          message: payload.error || "We couldn't save your signup right now.",
        });
        return;
      }

      setForm({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        smsConsent: false,
        emailConsent: false,
        marketingConsent: false,
      });
      setSubmitState({
        status: "success",
        message: "You're on the list. We'll use the channels you selected.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: "We couldn't save your signup right now.",
      });
    }
  }

  return (
    <section className="hp-signup" id="signup">
      <div className="hp-container">
        <div className="hp-signup-card">
          <div className="hp-signup-card-body">
            <div className="hp-signup-eyebrow">Stay in the loop</div>
            <h2 className="hp-signup-title">Never miss a show.</h2>
            <p className="hp-signup-sub">Get a heads-up when <span className="slot" data-slot="rep name">{repName}</span> goes live, plus first dibs on new drops.</p>
          </div>
          <form className="hp-signup-form" onSubmit={handleSubmit}>
            <div className="hp-signup-row">
              <div className="hp-signup-field">
                <label className="hp-signup-label" htmlFor="hp-first-name">First name</label>
                <input id="hp-first-name" className="hp-signup-input" type="text" placeholder="Jamie" value={form.firstName} onChange={(e) => updateField("firstName", e.target.value)} required />
              </div>
              <div className="hp-signup-field">
                <label className="hp-signup-label" htmlFor="hp-last-name">Last name</label>
                <input id="hp-last-name" className="hp-signup-input" type="text" placeholder="Lane" value={form.lastName} onChange={(e) => updateField("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="hp-signup-row">
              <div className="hp-signup-field">
                <label className="hp-signup-label" htmlFor="hp-email">Email</label>
                <input id="hp-email" className="hp-signup-input" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
              </div>
              <div className="hp-signup-field">
                <label className="hp-signup-label" htmlFor="hp-phone">Phone <span className="hp-signup-label-aux">(optional, for SMS)</span></label>
                <input id="hp-phone" className="hp-signup-input" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
              </div>
            </div>
            <div className="hp-signup-consent-box">
              <label className="hp-signup-check">
                <input type="checkbox" checked={form.smsConsent} onChange={(e) => updateField("smsConsent", e.target.checked)} />
                <span>Text me show reminders and SMS updates.</span>
              </label>
              <label className="hp-signup-check">
                <input type="checkbox" checked={form.emailConsent} onChange={(e) => updateField("emailConsent", e.target.checked)} />
                <span>Email me show reminders and collection updates.</span>
              </label>
              <label className="hp-signup-check">
                <input type="checkbox" checked={form.marketingConsent} onChange={(e) => updateField("marketingConsent", e.target.checked)} />
                <span>I also want promotional drops, launches, and special offers.</span>
              </label>
            </div>
            <div className="hp-signup-actions">
              <button type="submit" className="hp-signup-submit">
                Sign me up
                <span className="hp-signup-submit-arrow" aria-hidden="true">→</span>
              </button>
              <p className="hp-signup-consent slot" data-slot="consent — pending legal">
                Choose SMS, email, or both. Marketing consent stays separate from reminders and updates from <span className="slot" data-slot="business name">{businessName}</span>.
                Msg & data rates may apply. Reply STOP to unsubscribe. <a {...linkProps(getUnsubscribeHref())}>Manage or unsubscribe</a>.
              </p>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Join Team CTA
// ============================================================
function JoinCta() {
  return (
    <section className="hp-join-cta" id="join-team">
      <div className="hp-join-cta-inner">
        <div className="hp-join-eyebrow">Jane's Sparkle Party · Jane's Sparkle Party</div>
        <h2 className="hp-join-title">Want to do this too?</h2>
        <p className="hp-join-sub">
          Join my team. I'll show you how I built a real business doing live jewelry reveals on my own schedule —
          and Sparkle Suite gives you the site to run it.
        </p>
        <a {...linkProps(getJoinTeamHref())} className="hp-btn-primary hp-btn-sparkle solid-light">
          See what's in it for you
          <span className="spark" /><span className="spark" /><span className="spark" /><span className="spark" />
        </a>
      </div>
    </section>
  );
}

// ============================================================
// Footer
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
            <li><a href="#">Trade Board</a></li>
            <li><a href="#">Bomb Party Catalog</a></li>
            <li><a href="#">Pre-orders</a></li>
            <li><a href="#">Past shows</a></li>
          </ul>
        </div>
        <div className="hp-footer-col">
          <h4>About</h4>
          <ul>
            <li><a href="#about">My story</a></li>
            <li><a href="#">Join the team</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Contact</a></li>
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
          Jane's Sparkle Party is operated by an independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC.
          This site is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC. All product names,
          trademarks, and registered trademarks are property of their respective owners. Live show schedules subject to change. Trade Board
          listings are sold by the rep and not by Bomb Party LLC.
        </p>
      </div>
    </footer>
  );
}

// ============================================================
// Nic-Nac launcher
// ============================================================
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

// ============================================================
// Sparkle FX layer
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
// Main App
// ============================================================
function App() {
  const [t, setTweak] = useTweaks(DEFAULTS);
  const [queueOpen, setQueueOpen] = useState(false);

  // Apply tokens to root
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

  // Apply body classes
  useEffect(() => {
    const body = document.body;
    body.className = "homepage";
    if (t.showSlots) body.classList.add("slots-on");
    if (t.bgTreatment === "mesh") body.classList.add("bg-mesh");
    if (t.bgTreatment === "confetti") body.classList.add("fx-confetti");
    if (t.bgTreatment === "aurora") body.classList.add("fx-aurora");
    if (t.bgTreatment === "suite-paper") body.classList.add("bg-suite-paper");
    if (t.cardSurface === "glass") body.classList.add("surface-glass");
    if (t.cardSurface === "holographic") body.classList.add("fx-holographic");
    if (t.cardSurface === "warm-paper") body.classList.add("surface-warm-paper");
    if (t.textureOverlay === "grain") body.classList.add("tex-grain");
    if (t.textureOverlay === "sparkle") body.classList.add("tex-sparkle");
    if (t.buttonEnergy === "bouncy") body.classList.add("btn-bouncy");
    if (t.buttonEnergy === "wiggle") body.classList.add("btn-wiggle");
    if (t.buttonEnergy === "suite-lift") body.classList.add("btn-suite-lift");
    if (t.ctaEmphasis === "pulse") body.classList.add("cta-pulse");
    if (t.tradeFlair === "holo-unicorn") body.classList.add("holo-unicorn");
    if (t.tradeFlair === "soft-pink-lift") body.classList.add("soft-pink-lift");
    if (t.cursorEffect === "sparkle") body.classList.add("cursor-sparkle");
    if (t.density === "compact") body.classList.add("density-compact");
    if (t.density === "spacious") body.classList.add("density-spacious");
    if (t.shapeRadius === "sharp") body.classList.add("shape-sharp");
    if (t.shapeRadius === "soft") body.classList.add("shape-soft");
  }, [t]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    if (queueOpen) {
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [queueOpen]);

  useEffect(() => {
    window.AMETHYST_APPLY_HOMEPAGE_TEMPLATE?.(t);
  }, [t]);

  const applyPreset = (p) => {
    const presetVals = PRESETS[p];
    if (!presetVals) return;
    setTweak({ preset: p, ...presetVals });
  };

  return (
    <>
      <SparkleFx level={t.sparkleLevel} />

      <div className="hp-saturate" id="top">
      {/* Header */}
      <header className="hp-header">
        <div className="hp-header-inner">
          <nav className="hp-header-nav" aria-label="Primary">
            <a href="#top" className="hp-header-link" aria-current="page">Home</a>
            <a {...linkProps(getTradeBoardHref())} className="hp-header-link">Trade Board</a>
            <a {...linkProps(getJoinTeamHref())} className="hp-header-link">Join Team</a>
          </nav>
          <div className="hp-brand">
            <div className="hp-brand-name slot" data-slot="business name">{t.businessName}</div>
            <div className="hp-brand-sub">Live jewelry reveals</div>
          </div>
          <a {...linkProps(getShopHref())} className="hp-shop-btn">Shop</a>
        </div>
      </header>

      {/* Ticker */}
      {t.showTicker && <Ticker topText={t.tickerTopText} />}

      {t.showLrq && <LiveQueueStrip state={t.lrqState} onOpen={() => setQueueOpen(true)} />}

      {/* Hero */}
      {t.showHero && <Hero t={t} />}

      {/* Events */}
      {t.showEvents && <Events count={t.eventCount} />}

      {/* What is a Bomb Party */}
      {t.showWibp && <Wibp repName={t.repName} />}

      {/* About */}
      {t.showAbout && <AboutSection repName={t.repName} />}

      {/* Signup */}
      {t.showSignup && <Signup repName={t.repName} businessName={t.businessName} />}

      {/* Join Team CTA */}
      {t.showJoinCta && <JoinCta />}

      {/* Footer */}
      {t.showFooter && <Footer businessName={t.businessName} />}
      </div>

      {/* Nic-Nac */}
      {t.showNicNac && <NicNac />}

      <LiveQueueModal open={queueOpen} onClose={() => setQueueOpen(false)} state={t.lrqState} />

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Tweaks" subtitle="Tune the vibe" defaultWidth={380}>
        <TweakSection title="Flamboyance presets" subtitle="Snap a whole vibe in one click">
          <TweakRadio
            label="Preset"
            value={t.preset}
            onChange={applyPreset}
            options={[
              { value: "editorial", label: "Editorial" },
              { value: "softGlam", label: "Soft Glam" },
              { value: "sparkleParty", label: "Sparkle Party" },
              { value: "sparkle_suite_morganite", label: "Sparkle Suite/Morganite" },
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
              { value: "suite-paper", label: "Suite paper" },
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
              { value: "warm-paper", label: "Warm paper" },
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
              { value: "suiteBlush", label: "Suite blush" },
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
              { value: "playfair", label: "Playfair polish" },
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

        <TweakSection title="Content density">
          <TweakSlider
            label="Event cards"
            value={t.eventCount}
            onChange={(v) => setTweak("eventCount", v)}
            min={1} max={2} step={1}
          />
          <TweakRadio
            label="LRQ state"
            value={t.lrqState}
            onChange={(v) => setTweak("lrqState", v)}
            options={[
              { value: "live", label: "Live" },
              { value: "loading", label: "Loading" },
              { value: "empty", label: "Empty" },
              { value: "offline", label: "Offline" },
            ]}
          />
        </TweakSection>

        <TweakSection title="Section visibility">
          <TweakToggle label="Ticker" value={t.showTicker} onChange={(v) => setTweak("showTicker", v)} />
          <TweakToggle label="Live Reveal Queue" value={t.showLrq} onChange={(v) => setTweak("showLrq", v)} />
          <TweakToggle label="Hero" value={t.showHero} onChange={(v) => setTweak("showHero", v)} />
          <TweakToggle label="Events" value={t.showEvents} onChange={(v) => setTweak("showEvents", v)} />
          <TweakToggle label="Bomb Party explainer" value={t.showWibp} onChange={(v) => setTweak("showWibp", v)} />
          <TweakToggle label="About section" value={t.showAbout} onChange={(v) => setTweak("showAbout", v)} />
          <TweakToggle label="Signup" value={t.showSignup} onChange={(v) => setTweak("showSignup", v)} />
          <TweakToggle label="Join Team CTA" value={t.showJoinCta} onChange={(v) => setTweak("showJoinCta", v)} />
          <TweakToggle label="Footer" value={t.showFooter} onChange={(v) => setTweak("showFooter", v)} />
          <TweakToggle label="Nic-Nac launcher" value={t.showNicNac} onChange={(v) => setTweak("showNicNac", v)} />
        </TweakSection>

        <TweakSection title="Copy sandbox">
          <TweakText label="Rep name" value={t.repName} onChange={(v) => setTweak("repName", v)} />
          <TweakText label="Business name" value={t.businessName} onChange={(v) => setTweak("businessName", v)} />
          <TweakText label="Hero headline" value={t.heroHeadline} onChange={(v) => setTweak("heroHeadline", v)} />
          <TweakText label="Hero sub" value={t.heroSub} onChange={(v) => setTweak("heroSub", v)} />
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
