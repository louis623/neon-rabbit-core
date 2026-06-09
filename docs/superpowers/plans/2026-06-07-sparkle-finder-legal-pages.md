# Sparkle Finder Legal Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Sparkle Finder-local Privacy Policy and Terms and Conditions pages, link them from the footer, and make the legal copy accurately cover customer accounts, Silver access, affiliate/shop surfaces, Sparkle Suite read-through data, and independence from Bomb Party.

**Architecture:** Keep legal content in a typed Sparkle Finder data module, render both pages with one shared legal page component, and add App Router pages at `/privacy-policy` and `/terms-and-conditions`. The footer should link to local Finder legal pages while keeping the existing ecosystem link to Sparkle Suite.

**Tech Stack:** Next.js App Router, React server components, TypeScript, Vitest render-to-static-markup tests, existing Sparkle Finder CSS variables and footer styles.

---

## Scope Notes

This plan creates operationally accurate legal pages for Sparkle Finder, but it is not a substitute for attorney review. The copy should be treated as a strong working draft for Louis to review before production use.

Reference sources and constraints:
- Sparkle Suite legal source: `C:\Users\louis\sparkle-suite-repo\lib\prelaunch\legal-content.ts`
- Sparkle Suite legal renderer: `C:\Users\louis\sparkle-suite-repo\app\_components\SparkleLegalPage.tsx`
- FTC privacy/security guidance: `https://www.ftc.gov/business-guidance/resources/protecting-personal-information-guide-business`
- FTC Endorsement Guides FAQ for affiliate disclosure placement: `https://www.ftc.gov/system/files/documents/plain-language/pdf-0205-endorsement-guides-faqs_0.pdf`

## File Structure

- Create: `lib/sparkle-finder/legal-content.ts`
  - Owns `LegalDocument`, `LegalSection`, `sparkleFinderLegalFooterLinks`, `sparkleFinderPrivacyPolicyDocument`, and `sparkleFinderTermsAndConditionsDocument`.
- Create: `components/layout/SparkleFinderLegalPage.tsx`
  - Renders a legal document with Finder styling, summary text, content sections, footer legal links, and a return link.
- Create: `app/privacy-policy/page.tsx`
  - Exports metadata and renders `SparkleFinderLegalPage` with the privacy document.
- Create: `app/terms-and-conditions/page.tsx`
  - Exports metadata and renders `SparkleFinderLegalPage` with the terms document.
- Modify: `components/layout/SparkleFinderFooter.tsx`
  - Add `Privacy Policy` and `Terms and Conditions` to the footer links.
- Modify: `components/account/SignupForm.tsx`
  - Link "Sparkle Finder privacy terms" to `/privacy-policy`.
- Modify: `components/account/AccountPreferences.tsx`
  - Link "Sparkle Finder privacy terms" to `/privacy-policy`.
- Modify: `app/globals.css`
  - Add legal page styling classes.
- Modify: `tests/sparkle-finder/routes.test.ts`
  - Add render tests for legal pages, footer links, and inline privacy acknowledgment links.

---

### Task 1: Legal Content Data Module

**Files:**
- Create: `lib/sparkle-finder/legal-content.ts`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing tests for legal document data**

Add imports near the top of `tests/sparkle-finder/routes.test.ts`:

```ts
import {
  sparkleFinderLegalFooterLinks,
  sparkleFinderPrivacyPolicyDocument,
  sparkleFinderTermsAndConditionsDocument,
} from "../../lib/sparkle-finder/legal-content";
```

Add this test inside `describe("Sparkle Finder hub routes", () => { ... })`:

```ts
it("defines Sparkle Finder legal documents with customer-specific coverage", () => {
  expect(sparkleFinderLegalFooterLinks).toEqual([
    { href: "/privacy-policy", label: "Privacy Policy" },
    { href: "/terms-and-conditions", label: "Terms and Conditions" },
  ]);

  expect(sparkleFinderPrivacyPolicyDocument.pageTitle).toBe("Privacy Policy");
  expect(sparkleFinderPrivacyPolicyDocument.seoTitle).toContain("Sparkle Finder Privacy Policy");
  expect(sparkleFinderPrivacyPolicyDocument.description).toContain("Sparkle Finder customer accounts");
  expect(sparkleFinderPrivacyPolicyDocument.sections.map((section) => section.title)).toEqual([
    "What This Policy Covers",
    "Information Sparkle Finder Collects",
    "How Sparkle Finder Uses Information",
    "Sparkle Suite Data And Rep Links",
    "Affiliate And Shop Information",
    "SMS And Email Choices",
    "Data Sharing",
    "Data Retention",
    "Your Rights And Choices",
    "Security",
    "Children's Privacy",
    "Changes To This Policy",
    "Contact",
  ]);

  expect(sparkleFinderTermsAndConditionsDocument.pageTitle).toBe("Terms and Conditions");
  expect(sparkleFinderTermsAndConditionsDocument.seoTitle).toContain("Sparkle Finder Terms");
  expect(sparkleFinderTermsAndConditionsDocument.description).toContain("Sparkle Finder customer discovery hub");
  expect(sparkleFinderTermsAndConditionsDocument.sections.map((section) => section.title)).toEqual([
    "Agreement To These Terms",
    "About Sparkle Finder",
    "Customer Accounts And Silver Access",
    "Library, Live Shows, Rep Boards, And Availability",
    "Collection, Profile, And Watchlist Tools",
    "Affiliate Shop And Product Information",
    "Acceptable Use",
    "Privacy",
    "Third-Party Services",
    "Payments, Trials, And Billing",
    "No Marketplace, Escrow, Or Fulfillment",
    "No Guarantees",
    "Intellectual Property",
    "Disclaimer Of Warranties",
    "Limitation Of Liability",
    "Changes To These Terms",
    "Contact",
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL because `../../lib/sparkle-finder/legal-content` does not exist.

- [ ] **Step 3: Create the content module**

Create `lib/sparkle-finder/legal-content.ts`:

```ts
export type LegalSection = {
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  postBulletsParagraphs?: string[];
  links?: Array<{
    href: string;
    label: string;
  }>;
};

export type LegalDocument = {
  pageTitle: string;
  seoTitle: string;
  seoDescription: string;
  description: string;
  lastUpdated: string;
  developer: string;
  contact: string;
  plainEnglishSummary: string;
  sections: LegalSection[];
};

export const sparkleFinderLegalFooterLinks = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/terms-and-conditions", label: "Terms and Conditions" },
] as const;

const developer = "Neon Rabbit Digital Services, Jacksonville, FL";
const contact = "louis@neonrabbit.net";
const lastUpdated = "June 7, 2026";

export const sparkleFinderPrivacyPolicyDocument: LegalDocument = {
  pageTitle: "Privacy Policy",
  seoTitle: "Sparkle Finder Privacy Policy | Neon Rabbit Digital Services",
  seoDescription:
    "Privacy Policy for Sparkle Finder customer accounts, Silver trial access, collector tools, affiliate shop surfaces, and Sparkle Suite-powered discovery data.",
  description:
    "Sparkle Finder customer accounts, Silver trial access, collector tools, affiliate shop surfaces, and Sparkle Suite-powered discovery data.",
  lastUpdated,
  developer,
  contact,
  plainEnglishSummary:
    "Sparkle Finder uses the information needed to run customer accounts, trial protection, account support, collector tools, optional updates, and discovery features. Neon Rabbit Digital Services does not sell personal information or SMS opt-in data.",
  sections: [
    {
      title: "What This Policy Covers",
      paragraphs: [
        "This privacy policy explains how Neon Rabbit Digital Services collects, uses, stores, and protects information related to Sparkle Finder.",
      ],
      bullets: [
        "Sparkle Finder public pages and customer account pages",
        "Sparkle Finder signup, sign-in, account, and Silver trial flows",
        "collector profile, collection, watchlist, and Nic-Nac request features",
        "Sparkle Suite-powered library, live show, rep board, and availability data shown in Sparkle Finder",
        "affiliate shop and product concern reporting surfaces",
        "optional Sparkle Finder email or SMS update choices",
      ],
    },
    {
      title: "Information Sparkle Finder Collects",
      paragraphs: [
        "Sparkle Finder may collect information you provide directly through account, signup, profile, preference, request, or support flows.",
      ],
      bullets: [
        "display name",
        "email address",
        "phone number",
        "state",
        "TikTok handle or other social handle if you choose to provide it",
        "collector profile details, collection items, watchlist items, notes, and visibility choices",
        "privacy acknowledgment status and consent timestamps",
        "optional promotional email or SMS opt-in status",
        "account, trial, membership, billing, and support status needed to provide Sparkle Finder",
      ],
    },
    {
      title: "How Sparkle Finder Uses Information",
      paragraphs: [
        "Sparkle Finder uses account information to provide access, protect trial eligibility, support account recovery, maintain privacy choices, and operate customer discovery tools.",
      ],
      bullets: [
        "create and manage Sparkle Finder customer accounts",
        "provide the 45-day Silver trial and Silver membership access",
        "support collector profile, collection, watchlist, and Nic-Nac request features",
        "show relevant library, live show, rep board, and availability information",
        "respond to support requests or product concern reports",
        "send account, security, trial, billing, or service notices",
        "send optional promotional messages only when you choose to opt in",
        "protect against misuse, spam, fraud, unauthorized access, and policy violations",
      ],
    },
    {
      title: "Sparkle Suite Data And Rep Links",
      paragraphs: [
        "Sparkle Finder may display catalog, live show, rep, rep board, and availability information read from or linked through Sparkle Suite systems.",
        "Sparkle Finder does not make every rep, listing, availability count, show time, or external link permanently available or guaranteed. Reps and third-party systems may change their own information.",
      ],
    },
    {
      title: "Affiliate And Shop Information",
      paragraphs: [
        "Sparkle Finder may include affiliate links or product recommendation surfaces. If Sparkle Finder includes a retailer affiliate link, Sparkle Suite or Neon Rabbit Digital Services may earn a commission when you make a qualifying purchase.",
        "Affiliate disclosures should appear near relevant product links. A general footer link or disclosure page is not intended to replace clear disclosures near affiliate recommendations.",
      ],
    },
    {
      title: "SMS And Email Choices",
      paragraphs: [
        "If you opt in to optional SMS or email updates, Sparkle Finder may store your opt-in status, consent timestamp, message preference, opt-out status, and message interaction data needed to provide or document the messaging service.",
        "Message frequency may vary. Message and data rates may apply. Consent is not a condition of purchase. You can opt out of SMS messages by replying STOP and request help by replying HELP.",
      ],
    },
    {
      title: "Data Sharing",
      paragraphs: [
        "We do not sell personal information.",
        "We do not sell, rent, trade, or share SMS opt-in data or SMS consent status with third parties for their promotional or marketing purposes.",
        "We may share limited information with service providers that help operate Sparkle Finder and Neon Rabbit Digital Services, such as hosting providers, database providers, authentication providers, payment providers, messaging providers, email providers, analytics providers, security providers, and compliance vendors.",
        "We may disclose information if required to comply with law, legal process, platform rules, carrier requirements, or to protect the rights, safety, and security of Neon Rabbit Digital Services, Sparkle Finder users, Sparkle Suite reps, customers, or the public.",
      ],
    },
    {
      title: "Data Retention",
      paragraphs: [
        "Sparkle Finder may retain account, consent, membership, billing, support, and customer tool data for as long as needed to provide services, maintain consent records, honor opt-out requests, comply with legal or carrier requirements, resolve disputes, enforce agreements, or operate Sparkle Finder.",
        "SMS opt-in, opt-out, and consent records may be retained as needed to document compliance and prevent unwanted messages.",
      ],
    },
    {
      title: "Your Rights And Choices",
      bullets: [
        "You can update account profile and preference details from available account tools.",
        "You can opt out of SMS messages by replying STOP.",
        "You can request help for SMS messages by replying HELP.",
        "You can unsubscribe from email messages by using the unsubscribe method provided in the email, if available, or by contacting us.",
        "To request access to, correction of, or deletion of your data, contact louis@neonrabbit.net.",
      ],
    },
    {
      title: "Security",
      paragraphs: [
        "Data is transmitted over HTTPS.",
        "Sparkle Finder uses service providers and security controls designed to help protect account and customer data.",
        "We take reasonable steps to protect information from unauthorized access, loss, misuse, or disclosure. However, no electronic transmission or storage system can be guaranteed to be completely secure.",
      ],
    },
    {
      title: "Children's Privacy",
      paragraphs: [
        "Sparkle Finder and Neon Rabbit Digital Services are not directed to children under 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided personal information to us, contact louis@neonrabbit.net so we can review and delete it if appropriate.",
      ],
    },
    {
      title: "Changes To This Policy",
      paragraphs: [
        "We may update this privacy policy from time to time. Changes will be reflected in the Last Updated date above.",
      ],
    },
    {
      title: "Contact",
      paragraphs: ["Neon Rabbit Digital Services", "Jacksonville, FL", "louis@neonrabbit.net"],
    },
  ],
};

export const sparkleFinderTermsAndConditionsDocument: LegalDocument = {
  pageTitle: "Terms and Conditions",
  seoTitle: "Sparkle Finder Terms and Conditions | Neon Rabbit Digital Services",
  seoDescription:
    "Terms and Conditions for Sparkle Finder customer accounts, Silver access, collector tools, affiliate shop surfaces, and Sparkle Suite-powered discovery data.",
  description:
    "Sparkle Finder customer discovery hub, customer accounts, Silver access, collector tools, affiliate shop surfaces, and Sparkle Suite-powered discovery data.",
  lastUpdated,
  developer,
  contact,
  plainEnglishSummary:
    "Sparkle Finder is a customer discovery hub by Sparkle Suite. These terms explain account use, Silver access, discovery data, affiliate shop surfaces, and important limits: Sparkle Finder is not Bomb Party, not a jewelry marketplace, and not an escrow or fulfillment service.",
  sections: [
    {
      title: "Agreement To These Terms",
      paragraphs: [
        "These Terms and Conditions explain the rules for using Sparkle Finder, including public pages, customer accounts, Silver access, collector tools, affiliate shop surfaces, and Sparkle Suite-powered discovery data.",
        "By using Sparkle Finder, creating an account, submitting a form, using a collector tool, joining a trial, opting in to messages, or clicking through to an external site, you agree to these Terms and Conditions.",
        "If you do not agree, do not use Sparkle Finder.",
      ],
    },
    {
      title: "About Sparkle Finder",
      paragraphs: [
        "Sparkle Finder is a customer and collector discovery hub by Sparkle Suite and Neon Rabbit Digital Services.",
        "Sparkle Finder is not owned by, operated by, endorsed by, sponsored by, or officially affiliated with Bomb Party, LLC. Bomb Party names, trademarks, products, and related references belong to their respective owner.",
      ],
    },
    {
      title: "Customer Accounts And Silver Access",
      paragraphs: [
        "Sparkle Finder accounts may provide access to customer discovery tools, Silver trial features, Silver membership features, and account preferences.",
        "New customer accounts may begin with a 45-day Silver trial when that offer is available. Trial access, included access, paid access, and Free access may differ by feature.",
        "You are responsible for keeping your account information accurate and for using your account only for lawful, appropriate purposes.",
      ],
    },
    {
      title: "Library, Live Shows, Rep Boards, And Availability",
      paragraphs: [
        "Sparkle Finder may display jewelry library records, live show information, rep links, rep board links, and item availability information powered by Sparkle Suite systems or other approved sources.",
        "Sparkle Finder does not guarantee that every listing, show time, availability count, rep link, item detail, or external destination is complete, current, or error-free.",
      ],
    },
    {
      title: "Collection, Profile, And Watchlist Tools",
      paragraphs: [
        "Silver and account tools may let customers save profile details, collection items, watchlist items, notes, preferences, and related information.",
        "You are responsible for information you choose to save or make visible. Sparkle Finder may change, pause, or limit these tools as the product develops.",
      ],
    },
    {
      title: "Affiliate Shop And Product Information",
      paragraphs: [
        "Sparkle Finder may organize affiliate shop categories, product ideas, product concern reporting paths, and educational product guidance.",
        "If Sparkle Finder includes a retailer affiliate link, Sparkle Suite or Neon Rabbit Digital Services may earn a commission from qualifying purchases.",
        "Product information is provided for discovery and convenience. Sparkle Finder does not manufacture, sell, ship, warrant, or guarantee third-party products.",
      ],
    },
    {
      title: "Acceptable Use",
      paragraphs: ["You agree not to use Sparkle Finder to:"],
      bullets: [
        "send unlawful, deceptive, abusive, harassing, or harmful content",
        "misrepresent your identity, affiliation, products, ownership, or availability",
        "scrape, overload, attack, reverse engineer, or interfere with Sparkle Finder systems",
        "attempt to access data or accounts you are not authorized to access",
        "post or save content that violates intellectual property rights or privacy rights",
        "use Sparkle Finder to conduct fraud, spam, or non-compliant marketing",
      ],
    },
    {
      title: "Privacy",
      paragraphs: [
        "Your use of Sparkle Finder is also governed by the Sparkle Finder Privacy Policy.",
      ],
      links: [{ href: "/privacy-policy", label: "/privacy-policy" }],
    },
    {
      title: "Third-Party Services",
      paragraphs: [
        "Sparkle Finder may rely on third-party services such as hosting providers, database providers, authentication providers, payment providers, messaging providers, email providers, analytics providers, security providers, retailers, and external Sparkle Suite or rep sites.",
        "Use of third-party services may be subject to their own terms, policies, prices, availability, and operational rules.",
      ],
    },
    {
      title: "Payments, Trials, And Billing",
      paragraphs: [
        "Some Sparkle Finder features may require paid Silver access or another eligibility path.",
        "Any paid subscription, trial, billing, cancellation, or tax details will be presented in the relevant checkout, billing, or account surface before payment is submitted when payment is applicable.",
        "Unless otherwise stated in writing, access may continue or end according to the subscription, trial, billing, or eligibility terms shown for the account.",
      ],
    },
    {
      title: "No Marketplace, Escrow, Or Fulfillment",
      paragraphs: [
        "Sparkle Finder is a discovery hub, not a jewelry marketplace.",
        "Sparkle Finder does not process customer-to-customer jewelry payments, provide escrow, hold inventory, verify every item, guarantee trades, ship items, or settle disputes between customers, reps, retailers, or third parties.",
      ],
    },
    {
      title: "No Guarantees",
      paragraphs: [
        "Sparkle Finder does not guarantee that you will find a specific item, complete a purchase, complete a trade, receive a particular offer, reach a specific rep, or get a particular collector outcome.",
      ],
    },
    {
      title: "Intellectual Property",
      paragraphs: [
        "Sparkle Finder, Sparkle Suite, related software, workflows, content structures, branding created by Neon Rabbit Digital Services, and related materials are owned by or licensed to Neon Rabbit Digital Services unless otherwise stated.",
        "You may not copy, resell, redistribute, reverse engineer, or reuse Sparkle Finder software, templates, workflows, or materials outside the intended use of the service without written permission.",
      ],
    },
    {
      title: "Disclaimer Of Warranties",
      paragraphs: [
        "Sparkle Finder is provided as is and as available.",
        "To the fullest extent permitted by law, Neon Rabbit Digital Services disclaims warranties of any kind, whether express, implied, or statutory, including warranties of merchantability, fitness for a particular purpose, non-infringement, availability, accuracy, or reliability.",
      ],
    },
    {
      title: "Limitation Of Liability",
      paragraphs: [
        "To the fullest extent permitted by law, Neon Rabbit Digital Services will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, including lost profits, lost revenue, lost data, lost business opportunities, service interruptions, external purchase issues, or third-party disputes.",
      ],
    },
    {
      title: "Changes To These Terms",
      paragraphs: [
        "We may update these Terms and Conditions from time to time. Changes will be reflected in the Last Updated date above.",
        "Your continued use of Sparkle Finder after changes are posted means you accept the updated terms.",
      ],
    },
    {
      title: "Contact",
      paragraphs: ["Neon Rabbit Digital Services", "Jacksonville, FL", "louis@neonrabbit.net"],
    },
  ],
};
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS for the new legal document data test.

- [ ] **Step 5: Commit**

```bash
git add lib/sparkle-finder/legal-content.ts tests/sparkle-finder/routes.test.ts
git commit -m "feat: add Sparkle Finder legal content"
```

---

### Task 2: Shared Legal Page Renderer And Routes

**Files:**
- Create: `components/layout/SparkleFinderLegalPage.tsx`
- Create: `app/privacy-policy/page.tsx`
- Create: `app/terms-and-conditions/page.tsx`
- Modify: `app/globals.css`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Write failing render tests**

Add imports:

```ts
import PrivacyPolicyPage from "../../app/privacy-policy/page";
import TermsAndConditionsPage from "../../app/terms-and-conditions/page";
```

Add this test:

```ts
it("renders Sparkle Finder legal pages with Finder-specific content", () => {
  const privacyMarkup = renderToStaticMarkup(createElement(PrivacyPolicyPage));
  const termsMarkup = renderToStaticMarkup(createElement(TermsAndConditionsPage));

  expect(privacyMarkup).toContain("Sparkle Finder Legal Center");
  expect(privacyMarkup).toContain("Privacy Policy");
  expect(privacyMarkup).toContain("Sparkle Finder customer accounts");
  expect(privacyMarkup).toContain("We do not sell personal information.");
  expect(privacyMarkup).toContain("Affiliate And Shop Information");
  expect(privacyMarkup).toContain("Back to Sparkle Finder");

  expect(termsMarkup).toContain("Sparkle Finder Legal Center");
  expect(termsMarkup).toContain("Terms and Conditions");
  expect(termsMarkup).toContain("No Marketplace, Escrow, Or Fulfillment");
  expect(termsMarkup).toContain("Sparkle Finder is a discovery hub");
  expect(termsMarkup).toContain("not owned by, operated by, endorsed by, sponsored by, or officially affiliated with Bomb Party");
  expect(termsMarkup).toContain('href="/privacy-policy"');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL because the legal page routes do not exist.

- [ ] **Step 3: Create shared renderer**

Create `components/layout/SparkleFinderLegalPage.tsx`:

```tsx
import Link from "next/link";
import type { LegalDocument } from "@/lib/sparkle-finder/legal-content";
import { sparkleFinderLegalFooterLinks } from "@/lib/sparkle-finder/legal-content";

type SparkleFinderLegalPageProps = {
  document: LegalDocument;
};

export function SparkleFinderLegalPage({ document }: SparkleFinderLegalPageProps) {
  return (
    <main className="sparkle-finder-legal-page">
      <section className="sparkle-finder-legal-shell">
        <div className="mb-8 pt-8">
          <Link className="sparkle-finder-legal-link" href="/" aria-label="Back to Sparkle Finder">
            Back to Sparkle Finder
          </Link>
        </div>

        <article className="sparkle-finder-legal-card">
          <header className="sparkle-finder-legal-header">
            <p className="sparkle-finder-legal-eyebrow">Sparkle Finder Legal Center</p>
            <h1>{document.pageTitle}</h1>
            <p>{document.description}</p>
            <p>
              Operated and developed by <strong>{document.developer}</strong>.
            </p>
            <div className="sparkle-finder-legal-meta">
              <p>
                <strong>Last Updated:</strong> {document.lastUpdated}
              </p>
              <p>
                <strong>Developer:</strong> {document.developer}
              </p>
              <p>
                <strong>Contact:</strong>{" "}
                <a className="sparkle-finder-legal-link" href={`mailto:${document.contact}`}>
                  {document.contact}
                </a>
              </p>
            </div>
          </header>

          <section className="sparkle-finder-legal-summary" aria-label="Plain-English summary">
            <p className="sparkle-finder-legal-eyebrow">Plain-English summary</p>
            <p>{document.plainEnglishSummary}</p>
          </section>

          <div className="sparkle-finder-legal-sections">
            {document.sections.map((section) => (
              <section className="sparkle-finder-legal-section" key={section.title}>
                <h2>{section.title}</h2>
                {section.paragraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.bullets?.length ? (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>{bullet}</li>
                    ))}
                  </ul>
                ) : null}
                {section.postBulletsParagraphs?.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
                {section.links?.length ? (
                  <div className="sparkle-finder-legal-inline-links">
                    {section.links.map((link) => (
                      <Link className="sparkle-finder-legal-link" href={link.href} key={link.href}>
                        {link.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </section>
            ))}
          </div>
        </article>

        <footer className="sparkle-finder-legal-footer">
          <span>Sparkle Finder</span>
          <nav aria-label="Legal pages">
            {sparkleFinderLegalFooterLinks.map((link) => (
              <Link className="sparkle-finder-legal-link" href={link.href} key={link.href}>
                {link.label}
              </Link>
            ))}
          </nav>
        </footer>
      </section>
    </main>
  );
}
```

- [ ] **Step 4: Create privacy route**

Create `app/privacy-policy/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SparkleFinderLegalPage } from "@/components/layout/SparkleFinderLegalPage";
import { sparkleFinderPrivacyPolicyDocument } from "@/lib/sparkle-finder/legal-content";

export const metadata: Metadata = {
  title: sparkleFinderPrivacyPolicyDocument.seoTitle,
  description: sparkleFinderPrivacyPolicyDocument.seoDescription,
  alternates: {
    canonical: "/privacy-policy",
  },
  openGraph: {
    title: sparkleFinderPrivacyPolicyDocument.seoTitle,
    description: sparkleFinderPrivacyPolicyDocument.seoDescription,
    url: "/privacy-policy",
  },
};

export default function PrivacyPolicyPage() {
  return <SparkleFinderLegalPage document={sparkleFinderPrivacyPolicyDocument} />;
}
```

- [ ] **Step 5: Create terms route**

Create `app/terms-and-conditions/page.tsx`:

```tsx
import type { Metadata } from "next";
import { SparkleFinderLegalPage } from "@/components/layout/SparkleFinderLegalPage";
import { sparkleFinderTermsAndConditionsDocument } from "@/lib/sparkle-finder/legal-content";

export const metadata: Metadata = {
  title: sparkleFinderTermsAndConditionsDocument.seoTitle,
  description: sparkleFinderTermsAndConditionsDocument.seoDescription,
  alternates: {
    canonical: "/terms-and-conditions",
  },
  openGraph: {
    title: sparkleFinderTermsAndConditionsDocument.seoTitle,
    description: sparkleFinderTermsAndConditionsDocument.seoDescription,
    url: "/terms-and-conditions",
  },
};

export default function TermsAndConditionsPage() {
  return <SparkleFinderLegalPage document={sparkleFinderTermsAndConditionsDocument} />;
}
```

- [ ] **Step 6: Add legal page CSS**

Append to `app/globals.css` after the footer styles:

```css
.sparkle-finder-legal-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at 82% 8%, rgba(255, 212, 234, 0.5), transparent 34rem),
    linear-gradient(135deg, var(--sparkle-warm-bg) 0%, var(--sparkle-blush-bg) 48%, #f6ede8 100%);
  color: var(--sparkle-plum-deep);
}

.sparkle-finder-legal-shell {
  width: 100%;
  max-width: 64rem;
  margin: 0 auto;
  padding: 0 1.25rem 2.5rem;
}

.sparkle-finder-legal-card {
  border: 1px solid var(--sparkle-border);
  border-radius: var(--sparkle-radius-md);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: var(--sparkle-shadow-sm);
  padding: 1.5rem;
}

.sparkle-finder-legal-header {
  display: grid;
  gap: 1rem;
  border-bottom: 1px solid var(--sparkle-border);
  padding-bottom: 2rem;
}

.sparkle-finder-legal-header h1 {
  color: var(--sparkle-plum-deep);
  font-family: var(--font-playfair), Georgia, serif;
  font-size: clamp(2.25rem, 6vw, 3.75rem);
  font-weight: 600;
  line-height: 1;
}

.sparkle-finder-legal-header p,
.sparkle-finder-legal-summary p,
.sparkle-finder-legal-section p,
.sparkle-finder-legal-section li {
  color: var(--sparkle-ink-muted);
  line-height: 1.75;
}

.sparkle-finder-legal-eyebrow {
  color: var(--sparkle-rose);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.sparkle-finder-legal-meta {
  display: grid;
  gap: 0.375rem;
  font-size: 0.875rem;
}

.sparkle-finder-legal-summary {
  display: grid;
  gap: 0.75rem;
  border-bottom: 1px solid var(--sparkle-border);
  padding: 2rem 0;
}

.sparkle-finder-legal-sections {
  display: grid;
  gap: 2rem;
  padding-top: 2rem;
}

.sparkle-finder-legal-section {
  display: grid;
  gap: 0.75rem;
}

.sparkle-finder-legal-section h2 {
  color: var(--sparkle-plum-deep);
  font-size: 1.35rem;
  font-weight: 800;
}

.sparkle-finder-legal-section ul {
  display: grid;
  gap: 0.5rem;
  padding-left: 1.25rem;
}

.sparkle-finder-legal-section li {
  list-style: disc;
}

.sparkle-finder-legal-link {
  color: var(--sparkle-rose);
  font-weight: 800;
}

.sparkle-finder-legal-link:focus-visible {
  outline: 2px solid var(--sparkle-rose);
  outline-offset: 4px;
}

.sparkle-finder-legal-inline-links,
.sparkle-finder-legal-footer nav {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.sparkle-finder-legal-footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 2rem 0 0.5rem;
  color: var(--sparkle-ink-muted);
  font-size: 0.875rem;
}

@media (min-width: 700px) {
  .sparkle-finder-legal-card {
    padding: 2.5rem;
  }

  .sparkle-finder-legal-footer {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
}
```

- [ ] **Step 7: Run test to verify render passes**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS for legal page render tests.

- [ ] **Step 8: Commit**

```bash
git add app/privacy-policy/page.tsx app/terms-and-conditions/page.tsx components/layout/SparkleFinderLegalPage.tsx app/globals.css tests/sparkle-finder/routes.test.ts
git commit -m "feat: add Sparkle Finder legal pages"
```

---

### Task 3: Footer Legal Links

**Files:**
- Modify: `components/layout/SparkleFinderFooter.tsx`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Update failing footer test expectation**

Change the existing footer test to expect privacy and terms links:

```ts
expect(markup).toContain('href="/privacy-policy"');
expect(markup).toContain(">Privacy Policy<");
expect(markup).toContain('href="/terms-and-conditions"');
expect(markup).toContain(">Terms and Conditions<");
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: FAIL because footer currently links `Account` and `Affiliate Disclosure` but not legal pages.

- [ ] **Step 3: Update footer links**

Modify `components/layout/SparkleFinderFooter.tsx` so the `Links` group includes local legal pages:

```tsx
const footerLinkGroups = [
  {
    title: "Links",
    links: [
      { label: "Account", href: "/account" },
      { label: "Affiliate Disclosure", href: "/affiliate-disclosure" },
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms and Conditions", href: "/terms-and-conditions" },
    ],
  },
  {
    title: "Ecosystem",
    links: [{ label: "Sparkle Suite", href: "https://www.yoursparklesuite.com" }],
  },
];
```

- [ ] **Step 4: Run test to verify it passes**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/layout/SparkleFinderFooter.tsx tests/sparkle-finder/routes.test.ts
git commit -m "feat: link Finder legal pages in footer"
```

---

### Task 4: Inline Privacy Acknowledgment Links

**Files:**
- Modify: `components/account/SignupForm.tsx`
- Modify: `components/account/AccountPreferences.tsx`
- Test: `tests/sparkle-finder/auth-routes.test.ts`
- Test: `tests/sparkle-finder/routes.test.ts`

- [ ] **Step 1: Add failing tests for inline privacy links**

In `tests/sparkle-finder/routes.test.ts`, update the existing sign-up privacy test:

```ts
expect(markup).toContain('href="/privacy-policy"');
expect(markup).toContain("Sparkle Finder privacy terms");
```

In `tests/sparkle-finder/auth-routes.test.ts`, update the account completion/privacy test that checks `"I acknowledge the Sparkle Finder privacy terms"`:

```ts
expect(markup).toContain('href="/privacy-policy"');
expect(markup).toContain("Sparkle Finder privacy terms");
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
```

Expected: FAIL because the privacy terms text is not linked yet.

- [ ] **Step 3: Link signup privacy text**

In `components/account/SignupForm.tsx`, replace the privacy text span with this structure:

```tsx
<span>
  I acknowledge the{" "}
  <a className="font-bold text-[var(--sparkle-rose)] underline-offset-4 hover:underline" href="/privacy-policy">
    Sparkle Finder privacy terms
  </a>{" "}
  and agree that my account details are used to provide the 45-day Silver trial and account support.
</span>
```

- [ ] **Step 4: Link account privacy text**

In `components/account/AccountPreferences.tsx`, replace the privacy acknowledgment text with this structure:

```tsx
<span className="block font-bold text-[var(--sparkle-plum-deep)]">Privacy acknowledgment</span>
I acknowledge the{" "}
<a className="font-bold text-[var(--sparkle-rose)] underline-offset-4 hover:underline" href="/privacy-policy">
  Sparkle Finder privacy terms
</a>{" "}
and agree that my account details are used to provide the 45-day Silver trial and account support.
```

- [ ] **Step 5: Run tests to verify they pass**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add components/account/SignupForm.tsx components/account/AccountPreferences.tsx tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
git commit -m "feat: link privacy acknowledgments to Finder policy"
```

---

### Task 5: Build And Browser Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run focused tests**

Run:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
```

Expected: PASS with no failed tests.

- [ ] **Step 2: Run full unit test suite**

Run:

```bash
npm run test
```

Expected: PASS for all Sparkle Finder tests.

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected: Next build compiles successfully and includes `/privacy-policy` and `/terms-and-conditions` in the route list.

- [ ] **Step 4: Browser-check local preview**

Open or refresh:

```text
http://127.0.0.1:4310/
```

Verify:
- Footer shows `Privacy Policy`.
- Footer shows `Terms and Conditions`.
- `/privacy-policy` renders the legal page and includes customer account, Silver trial, affiliate/shop, SMS/email choices, and no-sale-of-personal-information language.
- `/terms-and-conditions` renders the legal page and includes customer accounts, Silver access, no marketplace/escrow/fulfillment, affiliate shop, and Bomb Party independence language.
- Sign-up privacy acknowledgment links to `/privacy-policy`.
- Account privacy acknowledgment links to `/privacy-policy`.

- [ ] **Step 5: Commit verification-only adjustments if needed**

If browser verification reveals text overflow or layout issues, adjust only `app/globals.css`, rerun:

```bash
npm exec vitest run tests/sparkle-finder/routes.test.ts tests/sparkle-finder/auth-routes.test.ts
npm run build
```

Then commit:

```bash
git add app/globals.css
git commit -m "fix: polish Finder legal page layout"
```

---

## Self-Review

- Spec coverage: The plan covers local privacy and terms pages, footer legal links, Finder-specific content, privacy acknowledgment links, test coverage, build verification, and browser review.
- Placeholder scan: No implementation step contains an unresolved placeholder. The only attorney-review note is scoped as a review caveat, not an implementation gap.
- Type consistency: `LegalDocument`, `LegalSection`, `sparkleFinderLegalFooterLinks`, `sparkleFinderPrivacyPolicyDocument`, and `sparkleFinderTermsAndConditionsDocument` are defined in Task 1 and reused consistently in later tasks.
