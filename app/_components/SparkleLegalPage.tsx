import {
  legalFooterLinks,
  type LegalDocument,
} from '@/lib/prelaunch/legal-content'

export function SparkleLegalPage({ document }: { document: LegalDocument }) {
  return (
    <main className="prelaunch-page">
      <section className="prelaunch-section">
        <div className="prelaunch-shell">
          <a className="prelaunch-link text-sm font-semibold" href="/prelaunch">
            Back to Sparkle Suite
          </a>

          <article className="prelaunch-card mt-6 p-6 sm:p-10">
            <header className="border-b border-[var(--prelaunch-border)] pb-8">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--prelaunch-muted)]">
                Neon Rabbit Digital Services
              </p>
              <h1 className="prelaunch-display mt-4 text-5xl leading-tight text-[var(--prelaunch-plum-ink)]">
                {document.pageTitle}
              </h1>
              <p className="mt-4 max-w-3xl text-lg leading-8 text-[var(--prelaunch-muted)]">
                {document.description}
              </p>
              <div className="mt-6 grid gap-2 text-sm text-[var(--prelaunch-muted)]">
                <p>
                  <strong className="text-[var(--prelaunch-plum-ink)]">Last Updated:</strong>{' '}
                  {document.lastUpdated}
                </p>
                <p>
                  <strong className="text-[var(--prelaunch-plum-ink)]">Developer:</strong>{' '}
                  {document.developer}
                </p>
                <p>
                  <strong className="text-[var(--prelaunch-plum-ink)]">Contact:</strong>{' '}
                  <a className="prelaunch-link" href={`mailto:${document.contact}`}>
                    {document.contact}
                  </a>
                </p>
              </div>
            </header>

            <div className="mt-8 grid gap-8">
              {document.sections.map((section) => (
                <section className="grid gap-3" key={section.title}>
                  <h2 className="text-2xl font-semibold text-[var(--prelaunch-plum-ink)]">
                    {section.title}
                  </h2>

                  {section.paragraphs?.map((paragraph) => (
                    <p className="leading-8 text-[var(--prelaunch-muted)]" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}

                  {section.bullets?.length ? (
                    <ul className="grid gap-2 pl-5 text-[var(--prelaunch-muted)]">
                      {section.bullets.map((bullet) => (
                        <li className="list-disc leading-7" key={bullet}>
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {section.postBulletsParagraphs?.map((paragraph) => (
                    <p className="leading-8 text-[var(--prelaunch-muted)]" key={paragraph}>
                      {paragraph}
                    </p>
                  ))}

                  {section.links?.length ? (
                    <div className="flex flex-wrap gap-4">
                      {section.links.map((link) => (
                        <a className="prelaunch-link" href={link.href} key={link.href}>
                          {link.label}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </section>
              ))}
            </div>
          </article>

          <footer className="mt-8 flex flex-col gap-3 text-sm text-[var(--prelaunch-muted)] sm:flex-row sm:items-center sm:justify-between">
            <span>Sparkle Suite</span>
            <nav className="flex flex-wrap gap-4" aria-label="Legal pages">
              {legalFooterLinks.map((link) => (
                <a className="prelaunch-link" href={link.href} key={link.href}>
                  {link.label}
                </a>
              ))}
            </nav>
          </footer>
        </div>
      </section>
    </main>
  )
}
