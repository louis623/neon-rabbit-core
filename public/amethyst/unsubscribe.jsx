/* global React, ReactDOM */
const { useState } = React;

const CONTENT = window.AMETHYST_HOMEPAGE_TEMPLATE_DATA || {};
const FOOTER_LINKS = CONTENT.footerLinks || {};
const SOCIAL_LINKS = CONTENT.socialLinks || [];
const BUSINESS_NAME = CONTENT.businessName || "Sparkle by Sasha";
const SHOP_HREF = CONTENT.streamLinks?.shop || "https://bombparty.com";
const HOME_HREF = FOOTER_LINKS.home || "/amethyst/Homepage.html";
const TRADE_BOARD_HREF = FOOTER_LINKS.tradeBoard || "/amethyst/Trade.html";
const JOIN_HREF = FOOTER_LINKS.joinTeam || "/amethyst/Join.html";

function isExternalHref(href) {
  return /^https?:\/\//.test(href || "");
}

function linkProps(href) {
  return isExternalHref(href)
    ? { href, target: "_blank", rel: "noreferrer noopener" }
    : { href: href || "#" };
}

function getUnsubscribeHref() {
  return FOOTER_LINKS.unsubscribe || "/amethyst/Unsubscribe.html";
}

function Header() {
  return (
    <header className="hp-header">
      <div className="hp-header-inner">
        <nav className="hp-header-nav" aria-label="Primary">
          <a {...linkProps(HOME_HREF)} className="hp-header-link">Home</a>
          <a {...linkProps(TRADE_BOARD_HREF)} className="hp-header-link">Trade Board</a>
          <a {...linkProps(JOIN_HREF)} className="hp-header-link">Join Team</a>
        </nav>
        <div className="hp-brand">
          <div className="hp-brand-name">{BUSINESS_NAME}</div>
          <div className="hp-brand-sub">Live jewelry reveals</div>
        </div>
        <a {...linkProps(SHOP_HREF)} className="hp-shop-btn">Shop ↗</a>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="hp-footer">
      <div className="hp-footer-inner">
        <div>
          <div className="hp-footer-brand">{BUSINESS_NAME}</div>
          <p className="hp-footer-tag">Update your customer messaging preferences without needing live rep support.</p>
          <div className="hp-footer-socials">
            {SOCIAL_LINKS.slice(0, 4).map((link) => (
              <a key={link.shortLabel} {...linkProps(link.href)} className="hp-footer-social">{link.shortLabel}</a>
            ))}
          </div>
        </div>
        <div className="hp-footer-col">
          <h4>Navigate</h4>
          <ul>
            <li><a {...linkProps(HOME_HREF)}>Home</a></li>
            <li><a {...linkProps(TRADE_BOARD_HREF)}>Trade Board</a></li>
            <li><a {...linkProps(JOIN_HREF)}>Join Team</a></li>
          </ul>
        </div>
        <div className="hp-footer-col">
          <h4>Preferences</h4>
          <ul>
            <li><a {...linkProps(getUnsubscribeHref())}>Unsubscribe</a></li>
            <li><a href="#unsubscribe-form">Customer updates</a></li>
          </ul>
        </div>
      </div>
      <div className="hp-footer-bottom">
        <div className="legal-row">
          <span>© 2026 {BUSINESS_NAME} · Powered by Sparkle Suite</span>
          <span><a {...linkProps(getUnsubscribeHref())}>Unsubscribe</a> · <a {...linkProps(HOME_HREF)}>Home</a></span>
        </div>
      </div>
    </footer>
  );
}

function UnsubscribePage() {
  const [form, setForm] = useState({
    phone: "",
    email: "",
    unsubscribeSms: false,
    unsubscribeEmail: false,
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
      const response = await fetch("/api/amethyst/customer-audience/unsubscribe", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubmitState({
          status: "error",
          message: payload.error || "We couldn't process your unsubscribe right now.",
        });
        return;
      }

      setForm({
        phone: "",
        email: "",
        unsubscribeSms: false,
        unsubscribeEmail: false,
      });
      setSubmitState({
        status: "success",
        message: "You're all set. We'll honor the preferences you selected.",
      });
    } catch (error) {
      setSubmitState({
        status: "error",
        message: "We couldn't process your unsubscribe right now.",
      });
    }
  }

  return (
    <>
      <Header />
      <section className="hp-signup" id="unsubscribe-form">
        <div className="hp-container">
          <div className="hp-signup-card">
            <div className="hp-signup-card-body">
              <div className="hp-signup-eyebrow">Customer preferences</div>
              <h1 className="hp-signup-title">Unsubscribe from updates</h1>
              <p className="hp-signup-sub">
                Stop SMS updates, email updates, or both for the Amethyst preview site.
              </p>
            </div>
            <form action="/api/amethyst/customer-audience/unsubscribe" className="hp-signup-form" onSubmit={handleSubmit}>
              <div className="hp-signup-row">
                <div className="hp-signup-field">
                  <label className="hp-signup-label" htmlFor="unsubscribe-phone">Phone number</label>
                  <input id="unsubscribe-phone" className="hp-signup-input" type="tel" placeholder="(555) 555-5555" value={form.phone} onChange={(e) => updateField("phone", e.target.value)} />
                </div>
                <div className="hp-signup-field">
                  <label className="hp-signup-label" htmlFor="unsubscribe-email">Email address</label>
                  <input id="unsubscribe-email" className="hp-signup-input" type="email" placeholder="you@example.com" value={form.email} onChange={(e) => updateField("email", e.target.value)} />
                </div>
              </div>
              <div className="hp-signup-consent-box">
                <label className="hp-signup-check hp-unsubscribe-toggle">
                  <input type="checkbox" checked={form.unsubscribeSms} onChange={(e) => updateField("unsubscribeSms", e.target.checked)} />
                  <span className="hp-toggle-control" aria-hidden="true" />
                  <span>Stop SMS updates</span>
                </label>
                <label className="hp-signup-check hp-unsubscribe-toggle">
                  <input type="checkbox" checked={form.unsubscribeEmail} onChange={(e) => updateField("unsubscribeEmail", e.target.checked)} />
                  <span className="hp-toggle-control" aria-hidden="true" />
                  <span>Stop email updates</span>
                </label>
              </div>
              <div className="hp-signup-actions">
                <button type="submit" className="hp-signup-submit">
                  {submitState.status === "submitting" ? "Saving..." : "Update preferences"}
                </button>
                <p className="hp-signup-consent">
                  Choose one or both channels. If you reply STOP during a text conversation, Sparkle Suite will also record that SMS opt-out.
                </p>
                {submitState.message ? (
                  <p className={`hp-signup-status ${submitState.status === "success" ? "success" : "error"}`}>
                    {submitState.message}
                  </p>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<UnsubscribePage />);
