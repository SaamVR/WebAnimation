# CHAPCHITRA Development Guardrails
Follow the repository-root `AGENTS.md` as binding policy.

This is a standalone creative portfolio demo. Its **12-color palette (2026-11-06) and existing HTML-derived layout** are owner-specified; it is not an operational commercial storefront.
- Scope every change to this directory. Vercel root = `projects/chapchitra`; no `site/` or THREADS dependency.
- The owner-approved CHAPCHITRA artwork is now integrated as cropped transparent WebP/PNG assets in `src/assets/` on the final-logo branch. Preserve its custom lettering and illustrated symbol exactly. Do not recreate it with fonts, invent vector paths, or claim the original editable SVG is available.
- Use exactly **12 canonical color tokens** from the owner's 2026-11-06 final palette in `src/styles.css` (no additional persistent greens/neutrals): Gallery White #F6F7F5, Silver Mist #E9EDEB, Warm Beige #D8CEC2, Cream #E4E3DE, Soft Gray #D9DCD7, Mushroom Gray #A6A29B, Deep Forest #172419, Press Green #293D2D, Dark Olive #1F2216, Walnut #6E523F, Terracotta #8A503B, Graphite #232323. Semantic roles and old aliases reference those tokens. The retired #1C241D and thirteenth muted-gray hex must not return. Keep artwork and product-color swatches unchanged; do not recolor logo/images. Gallery White is dominant, Silver Mist sparse, Warm Beige/Cream editorial, Soft Gray for borders/shadows only, Mushroom Gray decorative only (not small text), Press Green interactive and Deep Forest dark-brand surfaces.
- Assets are own neutral SVG or CSS shapes only; do not import photos or simulate real products.
- C01 story icons, C02 brass bell motion, C03 folding/packing and C04 ink-stamp add-to-cart have **no implementation authorization**. Static interface icons are not animation artwork.
- Cart: the owner approved a **sessionStorage-only demo bag** (card Add action, header quantity, bag +/- and remove) with explicit unavailable stock/pricing and no server persistence. Checkout, payment and newsletter must not pretend to accept orders/submit data; retain their explicit unavailable states.
- Accessible menus, semantic landmarks, keyboard interaction, reduced-motion, touch sizes and responsive breakpoints are expected.
- Motion assets and GSAP may be added later behind `src/motion/`; do not install dependencies or write timelines until approved.
- Verify no modifications outside this app on every PR. Keep owner-approved THREADS intact.

## V3 approval boundaries
- Approved: exact eleven-section structural architecture, responsive menus, filters, pagers, accessible hero/Journal carousel UI.
- Owner-approved for this milestone: final 12-color hierarchy, the existing Hind Siliguri/Noto Serif Bengali font families, homepage composition and normal V3 controls. Final logo raster placement is integrated for review; merchandise photography, real pricing, commerce, C01–C04 and street motion remain unapproved. Physical iPad Safari sticky confirmation and final owner visual acceptance remain pending.
- Synthetic 64-item catalog is marked as placeholders and displays Tk — pending real prices. Do not imply inventory.
- Always default to logged out with no bell until genuine authentication exists.
- Keep all work inside this application and do not edit THREADS, EZCOMO or root deployment.

## Final 12-color role fidelity (2026-11-06)
- The 2026-11-06 owner color specification supersedes the prior uploaded HTML for colors. Preserve its layout and composition; do not replace beige, cream, silver-mist, Gallery White or image/card artwork surfaces with one generic green.
- Explicit mapping: announcement/Featured Deep Forest #172419; nav/hero base/categories/Service Benefits/Shop/supporting pages Gallery White; collection may use Silver Mist; category artwork retains approved Cream/Press/Terracotta composition; product imagery and original logo art remain untouched; editorial banners Beige/Cream with Terracotta/Walnut accents; Featured print frames may use Mist/Cream; story Cream and existing Dark Olive footer fade.
- First hero has updated Deep Forest overlay; other slides preserve the approved Terracotta/Press/Walnut/Mist background compositions. Five registration-mark dots rotate at four seconds; Featured carousel is independent at 8.2 seconds.
- Preserve all existing routes and interactions, responsive QA, logged-out bell hidden; C01–C04 remain reserved.
