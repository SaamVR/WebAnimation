# CHAPCHITRA Development Guardrails
Follow the repository-root `AGENTS.md` as binding policy.

This is a standalone creative portfolio demo. Its **Forest + Olive homepage palette and HTML-derived layout** are now owner-specified; it is not an operational commercial storefront.
- Scope every change to this directory. Vercel root = `projects/chapchitra`; no `site/` or THREADS dependency.
- Typography wordmark is **temporary text**, never a recreated final logo.
- Use the exact owner-provided 13-token palette from `Chapchitra – Homepage v2 · Forest + Olive Final Palette.html` as documented in `README.md`: Deep Forest #1C241D, Press Green #293D2D, Dark Olive #1F2216, Walnut #6E523F, Ink #232323, Gallery White #F6F7F5, Soft Gray #D9DCD7, Mist #E9EDEB, Beige #D8CEC2, Cream #E4E3DE, Mushroom #A6A29B, Clay #8A503B, Muted Gray #5F625E. Maintain EACH section and card's distinct assignment; never blanket the site with green.
- Assets are own neutral SVG or CSS shapes only; do not import photos or simulate real products.
- C01 story icons, C02 brass bell motion, C03 folding/packing and C04 ink-stamp add-to-cart have **no implementation authorization**. Static interface icons are not animation artwork.
- Cart: the owner approved a **sessionStorage-only demo bag** (card Add action, header quantity, bag +/- and remove) with explicit unavailable stock/pricing and no server persistence. Checkout, payment and newsletter must not pretend to accept orders/submit data; retain their explicit unavailable states.
- Accessible menus, semantic landmarks, keyboard interaction, reduced-motion, touch sizes and responsive breakpoints are expected.
- Motion assets and GSAP may be added later behind `src/motion/`; do not install dependencies or write timelines until approved.
- Verify no modifications outside this app on every PR. Keep owner-approved THREADS intact.

## V3 approval boundaries
- Approved: exact eleven-section structural architecture, responsive menus, filters, pagers, accessible hero/Journal carousel UI.
- Owner-approved for this milestone: exact reference palette, its Hind Siliguri/Noto Serif Bengali font families, homepage surface distribution and normal V3 controls. Final logos, merchandise photography, real pricing, commerce, C01–C04 and street motion remain unapproved.
- Synthetic 64-item catalog is marked as placeholders and displays Tk — pending real prices. Do not imply inventory.
- Always default to logged out with no bell until genuine authentication exists.
- Keep all work inside this application and do not edit THREADS, EZCOMO or root deployment.

## Forest + Olive reference fidelity (2026-10-29)
- The uploaded HTML is the primary visual reference. Do not replace beige, cream, mist, white or gray artwork/card surfaces with one generic theme background.
- Explicit mapping: announcement/Featured Deep Forest; navigation/hero base/categories/values Gallery White; benefits/collection Mist; category artworks Cream/Press/Clay; product-image panels pure white; promotional banners Beige/Cream with Clay/Walnut inner art; Featured frames pale Mist/Cream; values alternate Mist/Cream; story Cream and street fade to Dark Olive footer.
- First hero has dark forest overlay; other slides have reference-specific Clay/Press/Walnut/Mist backgrounds. Five registration-mark dots rotate at four seconds; Featured carousel is independent at 8.2 seconds.
- Preserve all existing routes and interactions, responsive QA, logged-out bell hidden; C01–C04 remain reserved.
