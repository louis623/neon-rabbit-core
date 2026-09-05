# Production and provenance

Approved direction: September 5 Sparkle Suite landing-page revision, based on
app commit e2bc8238. Standalone offline marketing exports; no website change,
posting, account mutation, or production deployment is involved.

Four distinct angles: active building, personal brand, mobile experience,
and founding invitation. Exact Playfair Display / DM Sans font faces from the
current built app; official S seal composited from the media-creative skill.
Brand/media skills preserved the canonical palette, logo and product truth.

Product captures remain unchanged except scaling/rounded framing:

- public/sparkle-suite/landing/hero-emerald-desktop-v3.webp
- public/sparkle-suite/landing/site-amethyst-v2.webp
- public/sparkle-suite/landing/hero-rose-mobile-v3.webp

One native built-in ImageGen call created the decorative ribbon background.
No native generation of product UI, logos, marketing text, or jewelry.
Exact type/layout/safe areas and final JPG/PNG exports use deterministic
browser compositing in render-pack.cjs. No image API or CLI fallback used.
The Creative Production tool was only exposed through functions, not its
required direct UI route; delivered durable exports instead of a board.

Native background prompt:

Create one premium editorial photographic BACKGROUND PLATE ONLY for a Sparkle
Suite vertical TikTok announcement, portrait 9:16. No text, no letters, no logo,
no watermark, no phones, no screens, no jewelry, no product mockups. Warm ivory
paper with a soft blush-pink silk ribbon curling gracefully near the outer right
and bottom edges, very restrained delicate natural shadows, subtle satin sheen,
contemporary beauty editorial art direction. Main central and upper-left area
almost entirely clean warm-white negative space for large plum serif typography
to be composited later. Pink accent #ee2c9b used sparingly on ribbon edges,
palette warm ivory #fcf8f6, blush #ffd4ea, muted rose. Not gold, not glitter,
not luxury spectacle. The ribbon is decorative atmosphere only. Quiet, elegant,
tactile, softly sunlit. One clean finished background image, not a collage.

QA: all eight full-resolution files verified 1080x1920, readable exact text,
full logo circle, no product reconstruction. Essential text measured inside
x70–970/y160–1520, leaving at least 400px at the bottom. Actual TikTok posting
preview still controls final UI coverage. Full-size and 270x480 previews checked.
File sizes and text bounds are in manifest.json. JPGs approximately 245–445KB;
PNGs approximately 284KB–1.76MB. Organic still-post deliverables, not a claim
of compatibility with every paid-ad placement's separate file-size rules.

Official research consulted September 5, 2026:

- https://ads.tiktok.com/resources/help/article/creative-best-practices?lang=en
- https://ads.tiktok.com/business/library/Image_Ads_Carousel_Ads_Playbook.pdf
- https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok

Production decisions from TikTok guidance: vertical, hook-first, one message,
varied creative, real product proof, separate music selection and UI breathing room.
