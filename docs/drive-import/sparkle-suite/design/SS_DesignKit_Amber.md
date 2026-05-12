# DO NOT USE

This file is retired for current Sparkle Suite brand/design work.

Reason: it is not based on the current production site at https://www.yoursparklesuite.com/prelaunch.

Use the official production-based design kit in docs/sparkle-suite/brand instead.

---
You are building a web app. This file defines the complete design system. Reference it for every styling decision. Do not deviate from the fonts, colors, or tokens specified below.

DESIGN REFERENCE
Source: Fontpair Playground
URL: https://www.fontpair.co/playground/bitter-archivo?color=F97316&style=soft-marketing&icons=1&iconLib=eva

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY RULES:
→ Use Melodrama for ALL headings (h1–h4), display text, and hero copy
→ Use Nunito for ALL body text, captions, labels, and UI copy
→ Do NOT substitute with Inter, system-ui, Georgia, or any fallback font
→ Load via Google Fonts: https://fonts.googleapis.com/css2?family=Melodrama:wght@400;500;600&family=Nunito:wght@400;500&display=swap
→ Apply a typographic scale: hero 48–64px, h1 36px, h2 28px, h3 22px, body 16px, caption 13px
→ Font weight: 400 for body, 500–600 for headings — do not use 700+ unless explicitly needed
→ Letter spacing: slightly loose on headings (-0.01em to 0), normal on body

COLOR RULES:
→ Background: #FAFAFA — use for page background and card surfaces
→ Foreground: #390000 — use for all primary text, headings, and icons
→ Foreground Muted: #503834 — use for secondary text, placeholders, and metadata
→ Primary: #F97316 — use for CTAs, active states, links, and key UI accents
→ Accent: #761A00 — use for hover states, pressed buttons, and deep emphasis
→ Border: #FFB781 — use for all dividers, input borders, and card outlines
→ Do NOT introduce colors outside this palette (no Tailwind defaults like blue-500 or gray-400)
→ Do NOT use black (#000000) — use #390000 as the darkest value

ICON RULES:
→ Use Eva Icons exclusively for all icons
→ Install via: https://akveo.github.io/eva-icons/
→ Do NOT use Heroicons, Lucide, or any other icon library
→ Match icon size to surrounding text scale (16px inline, 20px UI, 24px feature icons)

COMPONENT RULES:
→ Every button must use Primary (#F97316) background with white text, rounded-md
→ Every card must use Border (#FFB781) outline, white background, consistent padding (16–24px)
→ Every input must use Border (#FFB781) outline, Foreground Muted placeholder text
→ Every link must use Primary (#F97316), Accent (#761A00) on hover — no underline by default

FRAMEWORK RULES:
→ Use shadcn/ui components with Tailwind CSS
→ Map semantic tokens: primary → #F97316, foreground → #390000, muted → #503834, border → #FFB781
→ Apply fonts via CSS variables: --font-heading: 'Melodrama', --font-body: 'Nunito'
→ Do NOT use Tailwind's default color scales — all colors must reference the palette above

OUTPUT RULES:
→ Every component must reference the design tokens — no hardcoded arbitrary values
→ Do not introduce UI elements, colors, or fonts not specified in this file
→ The final output must feel cohesive — as if designed by one person with one system
→ When in doubt, use less decoration, not more

— Powered by Fontpair
