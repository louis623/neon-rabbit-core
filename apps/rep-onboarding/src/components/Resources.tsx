import { useEffect, useMemo, useState } from 'react';
import { resources } from '../data';

const FAVORITES_KEY = 'bwb-resource-favorites-v1';
const resourceCategories = ['All', 'Start Here', 'BPU', 'Money', 'Supplies', 'Shipping', 'Loyalty', 'Sparkle Suite'] as const;
type ResourceFilter = typeof resourceCategories[number];

export function Resources({ teamLeadName }: { teamLeadName: string }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<ResourceFilter>('All');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => {
    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) as string[] : [];
    } catch {
      return [];
    }
  });
  const teamCopy = (value: string) => value.replaceAll('Brittany', teamLeadName);

  function getDisclosureLabel(resourceDetails: NonNullable<typeof resources[number]['details']>) {
    const hasVideo = resourceDetails.some((detail) => typeof detail !== 'string' && detail.kind === 'video');
    const hasOnlyLinks = resourceDetails.every((detail) => typeof detail !== 'string');
    if (hasVideo) return `Watch ${resourceDetails.length} videos`;
    return hasOnlyLinks ? `View ${resourceDetails.length} links` : `View ${resourceDetails.length} notes`;
  }

  function getSearchText(resource: typeof resources[number]) {
    const detailText = resource.details?.flatMap((detail) => (
      typeof detail === 'string'
        ? [detail]
        : [detail.label, detail.note ?? '', detail.url, detail.kind ?? '']
    )) ?? [];
    return [resource.title, resource.description, resource.url, resource.sourceType, resource.category, ...detailText].join(' ').toLowerCase();
  }

  function toggleFavorite(resourceId: string) {
    setFavoriteIds((current) => (
      current.includes(resourceId)
        ? current.filter((id) => id !== resourceId)
        : [...current, resourceId]
    ));
  }

  useEffect(() => {
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favoriteIds));
  }, [favoriteIds]);

  const visibleResources = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return resources
      .map((resource, index) => ({ resource, index, isFavorite: favoriteIds.includes(resource.id) }))
      .filter(({ resource }) => activeCategory === 'All' || resource.category === activeCategory)
      .filter(({ resource }) => !query || getSearchText(resource).includes(query))
      .sort((a, b) => {
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        return a.index - b.index;
      });
  }, [activeCategory, favoriteIds, searchTerm]);

  return (
    <section className="section-panel" id="resources">
      <div className="section-heading">
        <span className="eyebrow">Resource binder</span>
        <h2>Helpful links</h2>
        <p>Official Bomb Party links stay separate from {teamLeadName}&apos;s team notes.</p>
      </div>

      <div className="binder-toolbar">
        <div className="binder-filters" aria-label="Resource filters">
          {resourceCategories.map((category) => (
            <button
              key={category}
              type="button"
              className={activeCategory === category ? 'active' : ''}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
        <label>
          <span className="visually-hidden">Search resources</span>
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search binder"
          />
        </label>
        <span>{visibleResources.length} shown of {resources.length} resources</span>
      </div>

      <div className="resource-grid">
        {visibleResources.map(({ resource, isFavorite }) => (
          <article className="resource-card" key={resource.id}>
            <div className="resource-card-top">
              <span className={`source-pill ${resource.sourceType}`}>
                {resource.sourceType === 'official' ? 'Official' : resource.sourceType === 'sparkle-suite' ? 'Sparkle Suite' : 'Team note'}
              </span>
              <button
                className={`favorite-button ${isFavorite ? 'active' : ''}`}
                type="button"
                onClick={() => toggleFavorite(resource.id)}
                title={isFavorite ? 'Remove favorite' : 'Favorite resource'}
                aria-label={`${isFavorite ? 'Remove favorite' : 'Favorite'} ${resource.title}`}
              >
                {isFavorite ? '★' : '☆'}
              </button>
            </div>
            <h3>{teamCopy(resource.title)}</h3>
            <p>{teamCopy(resource.description)}</p>
            {resource.details && (
              <details className="resource-disclosure">
                <summary>{getDisclosureLabel(resource.details)}</summary>
                <ul className="resource-detail-list">
                  {resource.details.map((detail) => (
                    typeof detail === 'string' ? (
                      <li key={detail}>{detail}</li>
                    ) : detail.kind === 'video' ? (
                      <li className="video-resource" key={detail.url}>
                        <video controls preload="metadata" src={detail.url}>
                          <a href={detail.url}>Open video</a>
                        </video>
                        <a href={detail.url} target="_blank" rel="noreferrer">{teamCopy(detail.label)}</a>
                        {detail.note && <span>{teamCopy(detail.note)}</span>}
                      </li>
                    ) : (
                      <li key={detail.url}>
                        <a href={detail.url} target="_blank" rel="noreferrer">{teamCopy(detail.label)}</a>
                        {detail.note && <span>{teamCopy(detail.note)}</span>}
                      </li>
                    )
                  ))}
                </ul>
              </details>
            )}
            {resource.url ? (
              <a href={resource.url} target="_blank" rel="noreferrer">Open resource</a>
            ) : resource.details ? (
              <span className="muted-link">Resource listed above</span>
            ) : (
              <span className="muted-link">Team resource or link pending</span>
            )}
          </article>
        ))}
      </div>
      {visibleResources.length === 0 && (
        <p className="empty-state">No binder resources match that search.</p>
      )}
    </section>
  );
}
