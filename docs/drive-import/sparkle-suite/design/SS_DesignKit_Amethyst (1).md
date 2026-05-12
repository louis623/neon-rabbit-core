# DO NOT USE

This file is retired for current Sparkle Suite brand/design work.

Reason: it is not based on the current production site at https://www.yoursparklesuite.com/prelaunch.

Use the official production-based design kit in docs/sparkle-suite/brand instead.

---
You are building a web app. This file defines the complete design system. Reference it for every styling decision. Do not deviate from the fonts, colors, or tokens specified below.

DESIGN REFERENCE
Source: Fontpair Playground
URL: https://www.fontpair.co/playground/vend-sans-vend-sans?color=480DDF&style=soft-marketing&icons=1&iconLib=akar-icons

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TYPOGRAPHY RULES:
→ Use Vend Sans for ALL headings (h1–h4), display text, and hero copy
→ Use Vend Sans for ALL body text, captions, labels, and UI copy
→ Do NOT substitute with Inter, system-ui, Georgia, or any fallback font
→ Load via Google Fonts: https://fonts.googleapis.com/css2?family=Vend+Sans:wght@400;500;600&family=Vend+Sans:wght@400;500&display=swap
→ Apply a typographic scale: hero 48–64px, h1 36px, h2 28px, h3 22px, body 16px, caption 13px
→ Font weight: 400 for body, 500–600 for headings — do not use 700+ unless explicitly needed
→ Letter spacing: slightly loose on headings (-0.01em to 0), normal on body

COLOR RULES:
→ Background: #E8DFF5 — use for page background and card surfaces
→ Foreground: #2A1F40 — use for all primary text, headings, and icons
→ Foreground Muted: #5C576A — use for secondary text, placeholders, and metadata
→ Primary: #D209E3 — use for CTAs, active states, links, and key UI accents
→ Accent: #480DDF — use for hover states, pressed buttons, and deep emphasis
→ Border: #C4C1CE — use for all dividers, input borders, and card outlines
→ Do NOT introduce colors outside this palette (no Tailwind defaults like blue-500 or gray-400)
→ Do NOT use black (#000000) — use #2A1F40 as the darkest value

ICON RULES:
→ Use Akar Icons exclusively for all icons
→ Install via: https://akaricons.com
→ Do NOT use Heroicons, Lucide, or any other icon library
→ Match icon size to surrounding text scale (16px inline, 20px UI, 24px feature icons)

COMPONENT RULES:
→ Every button must use Primary (#D209E3) background with white text, rounded-md
→ Every card must use Border (#C4C1CE) outline, white background, consistent padding (16–24px)
→ Every input must use Border (#C4C1CE) outline, Foreground Muted placeholder text
→ Every link must use Primary (#D209E3), Accent (#480DDF) on hover — no underline by default

FRAMEWORK RULES:
→ Use shadcn/ui components with Tailwind CSS
→ Map semantic tokens: primary → #D209E3, foreground → #2A1F40, muted → #5C576A, border → #C4C1CE
→ Apply fonts via CSS variables: --font-heading: 'Vend Sans', --font-body: 'Vend Sans'
→ Do NOT use Tailwind's default color scales — all colors must reference the palette above

OUTPUT RULES:
→ Every component must reference the design tokens — no hardcoded arbitrary values
→ Do not introduce UI elements, colors, or fonts not specified in this file
→ The final output must feel cohesive — as if designed by one person with one system
→ When in doubt, use less decoration, not more

— Powered by Fontpair
