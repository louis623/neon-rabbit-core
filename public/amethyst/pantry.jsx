/* global React, ReactDOM */
const { useMemo, useState } = React;

const CONTENT = window.AMETHYST_PANTRY_TEMPLATE_DATA || {};

function isExternalHref(href) {
  return /^https?:\/\//.test(href || "");
}

function linkProps(href) {
  return isExternalHref(href)
    ? { href, target: "_blank", rel: "noreferrer noopener" }
    : { href: href || "#" };
}

function normalizeText(value, fallback = "") {
  return String(value || fallback).trim();
}

function getRecipeImage(recipe) {
  return recipe.modalImage || recipe.image || CONTENT.heroImageUrl;
}

function getVideoId(tiktokUrl) {
  const match = String(tiktokUrl || "").match(/\/video\/(\d+)/);
  return match ? match[1] : "";
}

function RecipeModal({ recipe, onClose }) {
  if (!recipe) return null;
  const videoId = getVideoId(recipe.tiktokUrl);
  const note = normalizeText(recipe.note);

  return (
    <div className="bk-modal-backdrop" role="presentation" onClick={onClose}>
      <div className="bk-modal" role="dialog" aria-modal="true" aria-labelledby="bk-modal-title" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="bk-modal-close" aria-label="Close recipe" onClick={onClose}>x</button>
        <div className="bk-modal-media">
          <img src={getRecipeImage(recipe)} alt="" style={{ objectPosition: recipe.modalImagePosition || recipe.imagePosition || "center" }} />
        </div>
        <div className="bk-modal-body">
          <p className="bk-recipe-category">{recipe.category}</p>
          <h2 id="bk-modal-title">{recipe.title}</h2>
          <p className="bk-modal-description">{recipe.description}</p>
          <div className="bk-modal-meta">
            <span>{recipe.prepTime}</span>
            <span>{recipe.servings} servings</span>
          </div>
          {videoId && (
            <div className="bk-video-frame">
              <iframe
                title={`${recipe.title} TikTok`}
                src={`https://www.tiktok.com/embed/v2/${videoId}`}
                allow="encrypted-media;"
                loading="lazy"
              />
            </div>
          )}
          <div className="bk-recipe-columns">
            <section>
              <h3>Ingredients</h3>
              <ul>
                {(recipe.ingredients || []).map((item, index) => <li key={index}>{item}</li>)}
              </ul>
            </section>
            <section>
              <h3>Steps</h3>
              <ol>
                {(recipe.steps || []).map((item, index) => <li key={index}>{item}</li>)}
              </ol>
            </section>
          </div>
          {note && (
            <aside className="bk-note">
              <h3>Heather's Note</h3>
              <p>{note}</p>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}

function RecipeCard({ recipe, onOpen }) {
  return (
    <article className="bk-recipe-card">
      <button type="button" className="bk-recipe-media" onClick={() => onOpen(recipe)} aria-label={`Open ${recipe.title}`}>
        <img src={recipe.image || CONTENT.heroImageUrl} alt="" style={{ objectPosition: recipe.imagePosition || "center" }} />
      </button>
      <div className="bk-recipe-body">
        <p className="bk-recipe-category">{recipe.category}</p>
        <h3>{recipe.title}</h3>
        <p>{recipe.description}</p>
        <div className="bk-recipe-meta">
          <span>{recipe.prepTime}</span>
          <span>{recipe.servings} servings</span>
        </div>
        <button type="button" className="bk-recipe-action" onClick={() => onOpen(recipe)}>
          View Recipe
        </button>
      </div>
    </article>
  );
}

function RecipeGroup({ group, recipes, onOpen }) {
  if (!recipes.length) return null;

  return (
    <section className="bk-recipe-group">
      <div className="bk-section-heading">
        <p>{group.subtitle}</p>
        <h2>{group.title}</h2>
      </div>
      <div className="bk-recipe-grid">
        {recipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={onOpen} />)}
      </div>
    </section>
  );
}

function PantryPage() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeRecipe, setActiveRecipe] = useState(null);
  const recipes = Array.isArray(CONTENT.recipes) ? CONTENT.recipes : [];
  const links = CONTENT.links || {};
  const categories = useMemo(() => {
    const source = Array.isArray(CONTENT.categoryOrder) ? CONTENT.categoryOrder : [];
    const fromRecipes = Array.from(new Set(recipes.map((recipe) => recipe.category).filter(Boolean)));
    return ["All", ...source.filter((category) => fromRecipes.includes(category)), ...fromRecipes.filter((category) => !source.includes(category))];
  }, [recipes]);
  const filteredRecipes = selectedCategory === "All"
    ? recipes
    : recipes.filter((recipe) => recipe.category === selectedCategory);
  const groups = Array.isArray(CONTENT.featuredCategoryGroups) ? CONTENT.featuredCategoryGroups : [];

  return (
    <div className="bk-pantry-shell">
      <header className="bk-header">
        <a className="bk-brand" {...linkProps(links.home)}>{CONTENT.businessName || "BlingKitchen"}</a>
        <nav className="bk-nav" aria-label="BlingKitchen navigation">
          <a {...linkProps(links.home)}>Home</a>
          <a aria-current="page" {...linkProps(links.pantry)}>In the Pantry</a>
          <a {...linkProps(links.trade)}>Trade Board</a>
          <a {...linkProps(links.join)}>Join Team</a>
        </nav>
        <a className="bk-shop" {...linkProps(links.shop)}>Shop</a>
      </header>

      <section className="bk-hero">
        <img src={CONTENT.heroImageUrl} alt="" />
        <div className="bk-hero-copy">
          <p>{CONTENT.eyebrow || "Recipes with Heather"}</p>
          <h1>{CONTENT.title || "In the Pantry"}</h1>
          <span>{CONTENT.subtitle}</span>
          <div className="bk-hero-actions">
            <a {...linkProps(links.tiktok)}>Watch TikTok</a>
            <a {...linkProps(links.facebookVip)}>VIP Group</a>
          </div>
        </div>
      </section>

      <main className="bk-main">
        <section className="bk-intro">
          <div>
            <p className="bk-kicker">{CONTENT.tagline}</p>
            <h2>Heather's recipe box, preserved from the source site.</h2>
          </div>
          <p>{CONTENT.introText}</p>
        </section>

        <div className="bk-filter-bar" role="tablist" aria-label="Recipe categories">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className={category === selectedCategory ? "is-active" : ""}
              onClick={() => setSelectedCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {selectedCategory === "All" ? (
          groups.map((group) => (
            <RecipeGroup
              key={group.title}
              group={group}
              recipes={recipes.filter((recipe) => (group.categories || []).includes(recipe.category))}
              onOpen={setActiveRecipe}
            />
          ))
        ) : (
          <section className="bk-recipe-group">
            <div className="bk-section-heading">
              <p>{filteredRecipes.length} recipes</p>
              <h2>{selectedCategory}</h2>
            </div>
            <div className="bk-recipe-grid">
              {filteredRecipes.map((recipe) => <RecipeCard key={recipe.id} recipe={recipe} onOpen={setActiveRecipe} />)}
            </div>
          </section>
        )}
      </main>

      <footer className="bk-footer">
        <p>{CONTENT.businessName || "BlingKitchen"} is operated by an independent Bomb Party Representative.</p>
        <div>
          <a {...linkProps(links.home)}>Home</a>
          <a {...linkProps(links.trade)}>Trade Board</a>
          <a {...linkProps(links.join)}>Join Team</a>
          <a {...linkProps(links.contact)}>Contact</a>
        </div>
      </footer>

      <RecipeModal recipe={activeRecipe} onClose={() => setActiveRecipe(null)} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<PantryPage />);
