# CHAPCHITRA / ছাপচিত্র — Standalone Demo Foundation

**Status:** structural preview only; awaiting approved logo, palette, imagery, and C01–C04 briefs.

Independent homepage skeleton for an art-led Bangladeshi apparel and printmaking portfolio demo.
Repository: `SaamVR/WebAnimation`. Source root: `projects/chapchitra/`. Deployment project: `chapchitra-motion-demo` (Vercel), with the same rootDirectory.

## Source boundaries
This project shares only Git history with Creative Motion Lab / THREADS. There are **no runtime imports** or common CSS/JS/build dependencies. The completed THREADS release and `SaamVR/Threads-Final-Demo-Web` are untouched. See both AGENTS.md files.

## Run and test
Requires Node.js 20+ (no external dependencies):
```bash
cd projects/chapchitra
npm run check
npm run build
npm run preview
```
The build copies `src/` into `dist/`. Vercel config: framework Other, installCommand `npm install`, buildCommand `npm run build`, outputDirectory `dist`, rootDirectory `projects/chapchitra`. Only `dist/` is published.

## Structure
- `src/index.html`: semantic page structure; responsive editorial section shells and navigation
- `src/styles.css`: provisional design tokens and responsive layout
- `src/app.mjs`: small accessible UI enhancements; no commerce
- `src/components.mjs`: self-contained, neutral SVG placeholder cards; no photos
- `src/motion/README.md`: future motion boundary; no authorized animation code
- `scripts/build.mjs`: reproducible asset-free static build
- `tests/structure.test.mjs`: isolation and structural checks

## Site sections
Header/search/static bell/cart; hero; shop by category; featured works; PEOPLE · PLACES · PRINTS; Made Through Art; posters/artwork; new arrivals; community/email placeholder; footer.

**Planned later, not yet built:** Shop results, product detail/gallery, cart, checkout, confirmation. These will be explicit demo states, never real checkout or fake payments.

## Studies reviewed, not copied
Existing Library studies `chapchitra_editorial_color_study.html` and `CHAPCHITRA_homepage_layout_v2_STANDALONE.html` supplied structural reference for the editorial proportions, section order, responsive breakpoints and utility header. Embedded product imagery, experimental logos and autonomous motion were deliberately **not copied**.

## Quality/approval
Desktop ~1440px, tablet ~820px, mobile ~390px; keyboard and reduced-motion checks.
C01–C04 require independent owner authorization; do not infer approval from this foundation milestone.
