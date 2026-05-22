import { resources } from '../data';

export function Resources() {
  return (
    <section className="section-panel" id="resources">
      <div className="section-heading">
        <span className="eyebrow">Resource binder</span>
        <h2>Helpful links</h2>
        <p>Official Bomb Party links stay separate from Brittany's team notes.</p>
      </div>

      <div className="resource-grid">
        {resources.map((resource) => (
          <article className="resource-card" key={resource.id}>
            <span className={`source-pill ${resource.sourceType}`}>
              {resource.sourceType === 'official' ? 'Official' : resource.sourceType === 'sparkle-suite' ? 'Sparkle Suite' : 'Team note'}
            </span>
            <h3>{resource.title}</h3>
            <p>{resource.description}</p>
            {resource.url ? (
              <a href={resource.url} target="_blank" rel="noreferrer">Open resource</a>
            ) : (
              <span className="muted-link">Demo content for Brittany review</span>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
