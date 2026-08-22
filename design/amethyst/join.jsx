/* global React, ReactDOM */
const { useState, useEffect, useMemo } = React;

const {
  TweaksPanel, useTweaks,
  TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakSelect,
  TweakColor, TweakText, TweakButton, TweakNumber
} = window;

const DEFAULTS = window.JOIN_TWEAK_DEFAULTS;

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
// Sample team roster (rep manages via Nic-Nac)
// ============================================================
const SAMPLE_TEAM = [
  { name: "Lindsey", business: "Virtuous Sisters", initials: "L", state: "Texas",     socials: { tt: true, crown: true, yt: false } },
  { name: "Mira",    business: "Mira's Magic Box",  initials: "M", state: "Georgia",   socials: { tt: true, crown: false, yt: true } },
  { name: "Cassidy", business: "Cassidy Sparkle",   initials: "C", state: "Florida",   socials: { tt: true, crown: true, yt: false } },
  { name: "Rae",     business: "Rae of Sunshine",   initials: "R", state: "Arizona",   socials: { tt: true, crown: false, yt: false } },
  { name: "Tasha",   business: "Tasha's Treasure",  initials: "T", state: "Ohio",      socials: { tt: true, crown: true, yt: true } },
  { name: "Joelle",  business: "Joelle Glows",      initials: "J", state: "California",socials: { tt: true, crown: false, yt: false } },
  { name: "Brooke",  business: "Brooke's Bombs",    initials: "B", state: "Tennessee", socials: { tt: true, crown: true, yt: false } },
];

// ============================================================
// Sparkle FX (shared)
// ============================================================
function SparkleFx({ level }) {
  const counts = { none: 0, subtle: 8, glittery: 24, maximum: 60 };
  const n = counts[level] || 0;
  const sparkles = useMemo(() => Array.from({ length: n }, () => ({
    left: Math.random() * 100,
    delay: Math.random() * 4,
    duration: 3 + Math.random() * 3,
    size: 0.5 + Math.random() * 1.2,
  })), [n]);
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
        <span className="hp-ticker-label">Dance Floor</span>
        <div className="hp-ticker-track">
          {[...trades, ...trades, ...trades].map((tr, i) => (
            <a key={i} href="Trade.html" className="hp-ticker-trade">
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
// Hero
// ============================================================
function Hero({ teamName, repName, pitch, ctaText, ctaUrl, showPromo, promoText }) {
  return (
    <section className="jp-hero">
      <div className="jp-hero-media slot" data-slot="hero photo" />
      <div className="jp-hero-inner">
        <div className="jp-hero-card">
          <div className="jp-hero-eyebrow">Join the team</div>
          {showPromo && (
            <div className="jp-hero-promo slot" data-slot="current BP promo">
              <span className="pip" />
              <span>{promoText}</span>
            </div>
          )}
          <h1 className="jp-hero-title slot" data-slot="team name headline">
            Welcome to <span className="slot" data-slot="team name">{teamName}</span>
          </h1>
          <p className="jp-hero-pitch slot" data-slot="recruitment pitch">{pitch}</p>
          <div className="jp-hero-ctas">
            <a href={ctaUrl} className="hp-btn-primary hp-btn-sparkle solid-light slot" data-slot="CTA \u2192 BP referral page" target="_blank" rel="noopener noreferrer">
              {ctaText}
              <span className="spark" /><span className="spark" /><span className="spark" /><span className="spark" />
            </a>
            <a href="#why" className="hp-btn-outline" style={{ color: "white", borderColor: "rgba(255,255,255,0.4)" }}>Learn more ↓</a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Team grid
// ============================================================
function PinIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SocialIcon({ kind }) {
  if (kind === "tt") return <span title="TikTok">TT</span>;
  if (kind === "crown") return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2 19h20l-1-9-5 4-4-7-4 7-5-4-1 9zm0 2h20v2H2z"/></svg>
  );
  if (kind === "yt") return <span title="YouTube">YT</span>;
  return null;
}

function TeamCard({ member, isLeader }) {
  return (
    <article className={`jp-team-card ${isLeader ? "is-leader" : ""}`}>
      <div className="jp-team-avatar slot" data-slot={isLeader ? "rep headshot" : "team member headshot"}>
        {member.initials}
      </div>
      <div className="jp-team-business slot" data-slot="business name">{member.business}</div>
      <div className="jp-team-name slot" data-slot="first name">{member.name}</div>
      <div className="jp-team-location"><PinIcon /><span className="slot" data-slot="state">{member.state}</span></div>
      <div className="jp-team-connect">
        <div className="jp-team-connect-label">Connect</div>
        <div className="jp-team-socials">
          {member.socials.tt && <a className="jp-team-social" href="#" aria-label="TikTok"><SocialIcon kind="tt" /></a>}
          {member.socials.crown && <a className="jp-team-social" href="#" aria-label="Website"><SocialIcon kind="crown" /></a>}
          {member.socials.yt && <a className="jp-team-social" href="#" aria-label="YouTube"><SocialIcon kind="yt" /></a>}
        </div>
      </div>
    </article>
  );
}

function SpotCard({ ctaUrl, ctaText }) {
  return (
    <article className="jp-team-card is-spot">
      <div className="jp-spot-glyph">+</div>
      <div className="jp-team-business" style={{ background: "none", color: "var(--hp-primary)", WebkitTextFillColor: "var(--hp-primary)" }}>Open Spot</div>
      <h3 className="jp-spot-title">This is Your Spot</h3>
      <p className="jp-spot-sub">Could be you next. Apply to join the team — we'll show you the ropes.</p>
      <a href={ctaUrl} className="jp-spot-btn slot" data-slot="CTA \u2192 BP referral page" target="_blank" rel="noopener noreferrer">{ctaText}</a>
    </article>
  );
}

function TeamSection({ rep, members, ctaUrl, ctaText }) {
  return (
    <section className="jp-section" id="team">
      <div className="jp-container">
        <div className="jp-section-head">
          <div className="jp-section-eyebrow">Meet the team</div>
          <h2 className="jp-section-title">The faces behind the sparkle</h2>
          <p className="jp-section-sub">A growing crew of independent reps doing this their way — full-time, side-hustle, and everywhere in between.</p>
        </div>
        <div className="jp-team-grid">
          <TeamCard member={rep} isLeader />
          {members.map((m, i) => <TeamCard key={i} member={m} />)}
          <SpotCard ctaUrl={ctaUrl} ctaText={ctaText} />
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Why Join — six locked benefit cards
// ============================================================
const BENEFIT_ICONS = {
  community: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  income:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  training:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  product:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12l4 6-10 13L2 9l4-6z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/></svg>,
  anywhere:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>,
  growth:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
};

const BENEFITS = [
  { key: "community", title: "Supportive Community", desc: "Real reps, group chats, weekly hangouts. Nobody figures this out alone — that's the whole point of a team." },
  { key: "income",    title: "Flexible Income",      desc: "Sell on your own time, your own platform, your own terms. Earn from your shows and a cut of your team's, too." },
  { key: "training",  title: "Training & Mentorship",desc: "Step-by-step playbooks, live coaching, 1:1 onboarding. Whether you're brand new or scaling up, you've got a guide." },
  { key: "product",   title: "Amazing Products",     desc: "Real jewelry from a real brand. Surprise reveals that customers come back for. The product practically sells itself." },
  { key: "anywhere",  title: "Work From Anywhere",   desc: "Phone, ring light, a corner of your kitchen. That's the whole studio. Run your business from anywhere with WiFi." },
  { key: "growth",    title: "Growth Opportunities", desc: "Hit your stride and there's no ceiling. Build your team, mentor newcomers, and unlock bonuses as you go." },
];

function WhyJoin({ teamName }) {
  return (
    <section className="jp-section jp-why" id="why">
      <div className="jp-container">
        <div className="jp-section-head">
          <div className="jp-section-eyebrow">Why join</div>
          <h2 className="jp-section-title">Why Join {teamName}?</h2>
          <p className="jp-section-sub">Turn Your Passion into Profit. This isn't a side gig you grind through — it's a community that helps you grow at your pace, however far you want to take it.</p>
        </div>
        <div className="jp-benefits">
          {BENEFITS.map((b) => (
            <article key={b.key} className="jp-benefit-card">
              <div className="jp-benefit-icon">{BENEFIT_ICONS[b.key]}</div>
              <h3 className="jp-benefit-title">{b.title}</h3>
              <p className="jp-benefit-desc">{b.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

// ============================================================
// FAQ — locked questions, customizable answers
// ============================================================
const FAQ_QUESTIONS = (teamName) => ([
  {
    q: `What is ${teamName}?`,
    aSlot: "FAQ answer — what is the team",
    a: `${teamName} is a tight-knit team of independent Bomb Party reps led by [Rep Name]. We're a group of women running our own businesses on our own terms — sharing what works, cheering each other on, and having a ridiculous amount of fun doing live jewelry reveals.`,
  },
  {
    q: "How much does it cost to join?",
    aSlot: "FAQ answer — cost",
    a: "Bomb Party starter packs typically run $169–$249 and include sample jewelry boxes plus business tools to get you started. The exact options change with current promotions — tap the join button and you'll see the latest packs available.",
  },
  {
    q: `Do I need experience to join ${teamName}?`,
    aSlot: "FAQ answer — experience",
    a: "Not at all. Most of us started with zero sales experience. If you can talk to your phone and have fun on camera, you can do this. We'll walk you through the rest.",
  },
  {
    q: "How much time do I need to commit?",
    aSlot: "FAQ answer — time commitment",
    a: "Totally up to you. Some reps go live a few times a month for fun money, others run multiple shows a week as their full-time gig. There's no minimum — just whatever fits your life.",
  },
  {
    q: "What kind of support will I receive?",
    aSlot: "FAQ answer — support",
    a: "Personalized 1:1 onboarding, our private team chat for daily questions, weekly group coaching calls, plus all the Bomb Party corporate training and tools. You're never figuring this out alone.",
  },
  {
    q: "Can I really make money doing this?",
    aSlot: "FAQ answer — income",
    a: "Yes — and yes, it varies a lot. Income depends on the shows you put in, the customers you build, and how you grow. We'll be honest with you about realistic expectations and show you how to set goals that fit your life.",
  },
]);

function Faq({ teamName }) {
  const [open, setOpen] = useState(0);
  const questions = FAQ_QUESTIONS(teamName);
  return (
    <section className="jp-section" id="faq">
      <div className="jp-faq-wrap">
        <div className="jp-section-head">
          <div className="jp-section-eyebrow">FAQ</div>
          <h2 className="jp-section-title">Frequently Asked Questions</h2>
          <p className="jp-section-sub">Everything you need to know about joining {teamName}.</p>
        </div>
        <div className="jp-faq-list">
          {questions.map((item, i) => (
            <div key={i} className={`jp-faq-item ${open === i ? "open" : ""}`}>
              <div className="jp-faq-q" onClick={() => setOpen(open === i ? -1 : i)}>
                <span>{item.q}</span>
                <span className="chev">+</span>
              </div>
              <div className="jp-faq-a">
                <div className="jp-faq-a-inner slot" data-slot={item.aSlot}>{item.a}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="jp-faq-link">
          <a href="https://bombparty.com" target="_blank" rel="noopener noreferrer">Need more info? See the full Bomb Party rep FAQ →</a>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Final CTA
// ============================================================
function FinalCta({ teamName, ctaUrl, ctaText, pitch }) {
  return (
    <section className="jp-final">
      <div className="jp-container">
        <div className="jp-final-card">
          <div className="jp-final-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <h2 className="jp-final-title">Ready to Sparkle With {teamName}?</h2>
          <p className="jp-final-sub">{pitch}</p>
          <a href={ctaUrl} className="jp-final-btn slot" data-slot="CTA \u2192 BP referral page" target="_blank" rel="noopener noreferrer">
            {ctaText}
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Footer (shared) — with cross-page links
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
            <li><a href="Trade.html">Dance Floor</a></li>
            <li><a href="#">Bomb Party Catalog</a></li>
            <li><a href="#">Pre-orders</a></li>
            <li><a href="#">Past shows</a></li>
          </ul>
        </div>
        <div className="hp-footer-col">
          <h4>About</h4>
          <ul>
            <li><a href="Homepage.html">Home</a></li>
            <li><a href="Join.html">Join the team</a></li>
            <li><a href="#faq">FAQ</a></li>
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
          {businessName} is operated by an independent Bomb Party Representative. Bomb Party® is a registered trademark of Bomb Party LLC.
          This site is not endorsed by, directly affiliated with, maintained, authorized, or sponsored by Bomb Party LLC. Any agreements
          formed between site visitors and the rep are solely between those parties — not Bomb Party LLC and not the platform.
        </p>
      </div>
    </footer>
  );
}

// ============================================================
// Nic-Nac launcher (shared)
// ============================================================
function Thumper() {
  return (
    <div className="hp-thumper">
      <button className="hp-thumper-btn" aria-label="Open Nic-Nac">
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

  // Build the team roster based on tweak: how many members to show
  const visibleMembers = useMemo(() => {
    const count = Math.max(0, Math.min(t.teamMemberCount, SAMPLE_TEAM.length));
    return SAMPLE_TEAM.slice(0, count);
  }, [t.teamMemberCount]);

  const repCard = {
    name: t.repName.split(" ")[0] || t.repName,
    business: t.businessName,
    initials: (t.repName[0] || "S").toUpperCase(),
    state: t.repState,
    socials: { tt: true, crown: true, yt: true },
  };

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
    root.style.setProperty("--hp-heading-weight", t.headingWeight);
    root.style.setProperty("--hp-saturation", (t.saturation || 100) / 100);
    root.style.setProperty("--ticker-speed", t.tickerSpeed);
  }, [t]);

  // Apply body classes
  useEffect(() => {
    const body = document.body;
    body.className = "joinpage";
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

  return (
    <>
      <SparkleFx level={t.sparkleLevel} />

      <div className="hp-saturate">
        <Header businessName={t.businessName} />

        {t.showTicker && <Ticker topText={t.tickerTopText} />}

        {t.showHero && (
          <Hero
            teamName={t.teamName}
            repName={t.repName}
            pitch={t.heroPitch}
            ctaText={t.heroCtaText}
            ctaUrl={t.bpReferralUrl}
            showPromo={t.showPromo}
            promoText={t.promoText}
          />
        )}

        {t.showTeam && (
          <TeamSection
            rep={repCard}
            members={visibleMembers}
            ctaUrl={t.bpReferralUrl}
            ctaText="Apply to the Team"
          />
        )}

        {t.showWhy && <WhyJoin teamName={t.teamName} />}

        {t.showFaq && <Faq teamName={t.teamName} />}

        {t.showFinalCta && (
          <FinalCta
            teamName={t.teamName}
            ctaUrl={t.bpReferralUrl}
            ctaText="Join The Team Now"
            pitch={t.finalPitch}
          />
        )}

        {t.showFooter && <Footer businessName={t.businessName} />}
      </div>

      {t.showThumper && <Thumper />}

      {/* TWEAKS PANEL */}
      <TweaksPanel title="Tweaks" subtitle="Tune the join page" defaultWidth={380}>
        <TweakSection title="Team & content" subtitle="Page-specific">
          <TweakText label="Team name" value={t.teamName} onChange={(v) => setTweak("teamName", v)} />
          <TweakText label="Rep name" value={t.repName} onChange={(v) => setTweak("repName", v)} />
          <TweakText label="Rep state" value={t.repState} onChange={(v) => setTweak("repState", v)} />
          <TweakSlider
            label="Team members shown"
            value={t.teamMemberCount}
            onChange={(v) => setTweak("teamMemberCount", v)}
            min={0} max={SAMPLE_TEAM.length} step={1}
          />
          <TweakToggle label="Show current BP promo" value={t.showPromo} onChange={(v) => setTweak("showPromo", v)} />
          <TweakText label="Promo text" value={t.promoText} onChange={(v) => setTweak("promoText", v)} />
          <TweakText label="Hero pitch" value={t.heroPitch} onChange={(v) => setTweak("heroPitch", v)} />
          <TweakText label="Hero CTA text" value={t.heroCtaText} onChange={(v) => setTweak("heroCtaText", v)} />
          <TweakText label="Final CTA pitch" value={t.finalPitch} onChange={(v) => setTweak("finalPitch", v)} />
          <TweakText label="BP referral URL" value={t.bpReferralUrl} onChange={(v) => setTweak("bpReferralUrl", v)} />
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
          <TweakColor label="Primary" value={t.primaryColor} onChange={(v) => setTweak("primaryColor", v)} />
          <TweakColor label="Accent" value={t.accentColor} onChange={(v) => setTweak("accentColor", v)} />
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
          <TweakToggle label="Hero" value={t.showHero} onChange={(v) => setTweak("showHero", v)} />
          <TweakToggle label="Team grid" value={t.showTeam} onChange={(v) => setTweak("showTeam", v)} />
          <TweakToggle label="Why join" value={t.showWhy} onChange={(v) => setTweak("showWhy", v)} />
          <TweakToggle label="FAQ" value={t.showFaq} onChange={(v) => setTweak("showFaq", v)} />
          <TweakToggle label="Final CTA" value={t.showFinalCta} onChange={(v) => setTweak("showFinalCta", v)} />
          <TweakToggle label="Footer" value={t.showFooter} onChange={(v) => setTweak("showFooter", v)} />
          <TweakToggle label="Nic-Nac launcher" value={t.showThumper} onChange={(v) => setTweak("showThumper", v)} />
        </TweakSection>

        <TweakSection title="Slot inspector">
          <TweakToggle label="Show edit slots overlay" value={t.showSlots} onChange={(v) => setTweak("showSlots", v)} />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
