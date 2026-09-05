# Enchanted Gnome Garden (GG-01)

## Visual authority

Louis selected Kim's second storybook flyer, then explicitly rejected a
different gnome illustration style for the website. The approved reference is
`artifacts/social/kim-goforthebling-flyers/storybook-background-v2.png`;
`preview-02-v3.jpg` in the same directory records the composed flyer.
Preserve those untracked originals. Do not replace them with website exports.

The skin uses the flyer's friendly, smooth red-hatted gnome, rounded glowing
brass lanterns, red mushrooms, olive forest, parchment, and warm gold. It must
not drift into ornate fantasy characters, neon effects, or Sparkle Suite
marketing branding. Rep identity and existing customer content remain dominant.

The flyer is static artwork. Website movement is a new, restrained layer:
slow lantern sway and glow, a small number of drifting fireflies, and a single
short gnome entrance. No video background, audio, cursor follower, or moving
text is introduced. Reduced-motion preference disables the new motion;
the local Pause animation control lets customers stop it manually.

## Artwork and generation brief

Built-in image generation was used with the approved original flyer as the
reference/edit input, followed by deterministic Sharp WebP optimization.
These are flyer-referenced adaptations, not a claim of pixel-identical crops.
The final reusable prompt brief is:

- Forest: adapt the approved flyer's warm olive storybook woodland into a
  wide website background. Preserve the mushrooms, moss, forest path, lighting,
  and illustration style. Remove the parchment copy panel, text, QR code,
  gnomes, and hanging lanterns so website text and separate sprites can be
  laid out cleanly. Keep the center calm and uncluttered.
- Gnome: isolate/recreate the friendly blue-tunic, red-hatted gnome from the
  approved flyer in the same smooth storybook style. Full body, white beard,
  warm expression, no new costume or ornate details. Genuine transparent
  background, no checkerboard pixels, text, scenery, or watermark.
- Lantern: isolate/recreate the rounded brass hanging lantern from the approved
  flyer, with its warm amber light and matching illustrated finish. Preserve
  the hanging chain. Genuine transparent background; no other scene elements.

Selected generated source filenames (under the session's Codex generated-image
directory) are `exec-85b035d1-f3d2-4c3b-b192-8e07b970604d.png` (forest),
`exec-94b031c5-51fa-40a4-aa8e-d9325993b8b7.png` (gnome), and
`exec-26b9a0d9-0833-4547-a26c-f2e4a55bf932.png` (lantern).
Rejected ornate/fake-transparency variants are not shipped.

All runtime files are committed under `public/amethyst/skins/gnome-garden/`:

| Asset | Dimensions | Bytes |
| --- | --- | --- |
| forest.webp | 1536 × 1024 | 160,438 |
| forest-mobile.webp | 768 × 512 | 47,824 |
| gnome.webp | 347 × 640, alpha | 47,568 |
| lantern.webp | 157 × 400, alpha | 16,764 |
| storybook-original.webp | 768 × 1365 | 123,150 |

The last file preserves the art reference, not the rendered page background.
The mobile scene's selected background and two shared sprite downloads total
112,156 bytes. The desktop equivalent totals 224,770 bytes. The original
reference is not loaded by the customer-page scene.

`scripts/prepare-gnome-garden-assets.mjs` accepts the three selected source
paths followed by the approved flyer source path. It trims genuine alpha,
resizes, and encodes WebP; it does not generate illustrations or redraw text.

## Product contract

- Template remains `amethyst`; visual preset is `gnome_garden`.
- Morganite remains the current Suite default. Existing skins are unchanged.
- Home, Dance Floor, Join, and customer preferences retain their existing
  content, routing, eligibility, validation, and provider boundaries.
- GG-01 is browsable through the existing look picker. Nic-Nac accepts the
  code, canonical ID, full label, and Gnome Garden alias through its existing
  appearance-only setting tool. No agent routing or model changes.
- Finder retains its separate existing selectable preset list and database.
- Applying this skin to Kim is a separate owner approval. Do not move
  `goforthebling.com` or change her saved appearance merely to preview it.

## Safe reviewer walkthrough

Open `/skin-preview/gnome_garden/homepage` on the canonical Suite domain after
the verified release. The persistent banner says Sample content. This is an
isolated, fixture-only preview, not an authenticated reviewer account or a
second deployment environment.

1. Inspect the forest hero, flyer-style gnome/lanterns, typography, and buttons.
   Pause and resume the decorative animation.
2. Scroll to the two sample calendar cards; confirm descriptions remain inside
   the cards and readable. Inspect signup fields and the footer.
3. Choose Dance Floor. Search Woodland; open the sample dancer and request
   dialog. Fill only synthetic values. Submission must display that nothing
   is submitted or sent; uploads are disabled.
4. Choose Join. Inspect the hero, team cards, benefits, FAQ, and honest
   unavailable recruiting CTA. No recruiting provider should open.
5. Choose Preferences. Confirm readable inputs and a calm static treatment.
6. Repeat at phone, tablet, and desktop widths; reload any page to reset all
   local preview state. No customer data, messages, or provider calls are used.

The preview deliberately remains available in production with enforced sandbox,
CSP, mutation, upload, and navigation restrictions. It does not enable the
privileged token-gated reviewer mode. Signed-in Settings/Nic-Nac verification
requires the supported protected synthetic reviewer path; never substitute a
personal or customer account.
