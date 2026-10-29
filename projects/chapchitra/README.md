# CHAPCHITRA V3 — Isolated Architecture

Owner-specified Forest + Olive visual layout and 13-color palette integrated into the existing eleven-section architecture. **Final logo, imagery, real merchandise, prices, and C01–C04 motion remain pending.**

## Preservation
Source repository: SaamVR/WebAnimation; independent app: projects/chapchitra. Vercel project chapchitra-motion-demo builds ONLY from this directory. THREADS release is untouched.

## Homepage section order
1. Announcement bar with specified shipping/early-access copy
2. Sticky navigation with dropdown, search, favorites, account, bag and guest-hidden bell
3. Five-slide hero: auto every four seconds, focus/hover pause, dots, mobile swipe, reduced-motion disabled auto
4. Delivery, Returns, Payment-method and Support informational benefits
5. Shop by Category: Regular Tees, Drop Shoulder, Tie-Dye with All/Men/Women chips
6. Our Collection: eight per page, eight functional pages, visual placeholders
7. Two editorial banners: Tie-Dye and Artist's Edit
8. Five-frame Featured Prints with previous/next and provisional inspiration credits
9. Four illustrated brand values, each an independent reserved C01 component slot
10. People · Places · Prints story with clickable Bangladesh street illustration and reserved wheel/steam groups
11. Footer with community signup validation and honest no-backend message

## Supporting routes
/shop/ twelve per page with independent category, audience and print filters; /artists-edit/ local-only brief builder; /journal/ and /journal/story/ for editorial rotation and detail; /about/; /product/; /favorites/ with browser-local demo favorites; /account/, /bag/, /checkout/, and /order-confirmation/ as explicit unavailable states.

## Important limitations
64 synthetic catalogue records only; garment drawings are neutral SVG silhouettes, price is Tk — (unknown). There is no authentication, inventory, payments, account, email subscription, custom printing submission, real product photography or custom animation. Add to Cart is a **sessionStorage-only visual interaction**, not order placement; mock items have no real prices/stock, and checkout remains disabled.

## Build and QA
npm run check; npm run build; npm run preview. Build performs structure and isolation tests. Conduct separate live-browser verification at desktop 1440px, tablet 820px and mobile 390px; inspect page links, accessibility, carousel timers, filters, pagers, reduced motion and JS console.

## Creative approval
V3 structure, the uploaded HTML's 13 colors and layout rhythm are the current visual reference. Final identity artwork and commercial content remain pending. C01, C02, C03, C04, rickshaw wheel and tea stall steam animations are reserved and not implemented. No automatic approval inferred.

## Forest + Olive visual source of truth — 2026-10-29

Primary source: owner's uploaded HTML file, Chapchitra – Homepage v2 · Forest + Olive Final Palette.html.
Its exact semantic CSS colors are implemented without globalizing all cards to green.

| Color token | Hex |
| --- | --- |
| Deep Forest | #1C241D |
| Press Green | #293D2D |
| Dark Olive | #1F2216 |
| Walnut | #6E523F |
| Graphite Ink | #232323 |
| Gallery White | #F6F7F5 |
| Soft Gray | #D9DCD7 |
| Mist Gray | #E9EDEB |
| Warm Beige | #D8CEC2 |
| Warm Cream | #E4E3DE |
| Mushroom Gray | #A6A29B |
| Dark Clay | #8A503B |
| Muted Gray | #5F625E |

Reference mapping: Forest announcement; White nav and hero base; Clay/Press/Walnut/Mist slide artwork surfaces; Mist benefits with Press outline icon rings; White categories with distinct Cream, Press and Clay panels; full-bleed Mist collection with pure-white product-image cards; Beige/Cream banners with Clay/Walnut inset art; Forest Featured Prints with alternating Mist/Cream framed art; White values with alternating Mist/Cream illustration cards; Cream story and street fade to Dark Olive footer.

Typography: Hind Siliguri body and Noto Serif Bengali headline families with system fallbacks, as in the HTML. This demo retains its approved interactive copy and sample catalogue instead of treating the HTML prototype merchandise as real stock.

Interaction: hero 4 seconds, five registration-mark dots, hover/focus pause, touch and reduced-motion; Featured Prints independent 8.2-second timer, perspective transforms with persistent card nodes, prev/next, keyboard and swipe; guest navigation bell hidden.

Validation: ten Node source tests passed. Chromium 1440x900, 820x1180, and 390x844 measured all 20 requested section/card computed surfaces at their exact colors, no horizontal overflow or JS errors. Shop, Artist's Edit, Journal, product/favorites, and guest pages remained functional.

Remaining known deviations: live product cards include more details, the moving Featured Prints have actionable item titles/prices/links, and the footer is more informative than the static HTML; desktop document height approximately 5567px versus 5351px of the uploaded HTML. Creative SVG placeholders remain until final artwork is supplied. Physical iPad Safari review remains pending.

## Product Card Hover and Demo Bag — 2026-10-30
- Reuses the same `.product-card` and rectangular left-text/right-arrow ADD TO CART button across homepage Collection (8), Shop (12/page), Favorites, and new Related Studies (4 on product detail).
- Fine pointer with normal motion: hover the hovered card **only**, translateY(-5px), rotate ±1.4° (alternating card parity), softened direction-aware shadow, 300ms eased return. No grid reflow, no scaling, no constant pointer tracking, and no changes to Featured Prints.
- Touch: no hover rotation/shadow; 44px Add button and brief active press feedback. Keyboard focus-visible and reduced-motion supported.
- Clicking Add updates a session-only mock bag quantity, global header badge, and accessible status; button briefly reads ADDED ✓. Repeated adds increment; bag route has increase/decrease/remove and limits individual study quantity to 99. `sessionStorage` is tab-scoped; no backend requests, pricing, orders, payments, or purchasing.
- Browser-tested on 1440×900, 820×1180 and 390×844, including layout stability, rapid pointer movements, cart state through navigation, Shop and related product actions, and reduced-motion/key activation.

## Hand-Drawn Button Design System — Owner reference Buttons.png (2026-10-30)

- Reference-faithful independent SVG silhouettes (short compact capsule; elongated low-profile long button), actual layered fill, curved secondary outline strokes, glints and heavy offset charcoal shadow. Not a PNG background.
- Color variants: Press Green #293D2D, Dark Clay / Terracotta #8A503B, Beige #D8CEC2, matching approved palette. Charcoal hover ink #232323. Beige text uses an additional synchronously clipped white text overlay to preserve contrast.
- Reusable source: src/handdrawn-buttons.mjs. Styling: src/button-system.css. Native button/anchor semantics, configurable label, tone and shape, keyboard focus, touch, reduced-motion support. Progressive 300ms directional fill via CSS clip-path.
- Isolated clickable review: /buttons/ (src/buttons/index.html and src/button-preview.mjs); 2 shapes x 3 colors x Default/Hover/Pressed/Focus, responsive two-column layout on small screens.
- Integrated: Long ADD TO BAG on Collection (8), Shop (12), Related Studies and product detail. Compact CTAs on hero, story, Journal, bag and empty routes; smaller compact controls for Search, newsletter Join and Clear Filters. Cart/session counts, native form submit and filter actions retained. Navigation icons, utility stepper/pager controls and Featured Prints are intentionally unchanged.
- Cart remains sessionStorage-only demo, no pricing, checkout or payment. Click text temporarily displays ADDED (no icon/symbol) and resets to ADD TO BAG. Approved card tilt, 14px spacing and palette remain unchanged.

## Owner-directed clean true-pill replacement (2026-10-30)
The earlier hand-sketched double-outline/highlight artwork is REJECTED and superseded. `src/handdrawn-buttons.mjs` retains its exported API for safe integration, but now emits only two CSS capsule layers per button: an unblurred `#242424` shadow and the Forest / Terracotta / Beige solid face. Both receive `border-radius:9999px`, identical sizes, and a deliberate 7px lower-right offset; neither contains decorative lines, textures or visible borders. The face clips a 300ms charcoal left-to-right fill and retains the matched two-layer label treatment for beige contrast. The compact variant is taller than the slim long variant. All cart/form/favorites handlers, approved card motion, 14px metadata spacing and unrelated motion remain intact. `/buttons/` reflects the clean new geometry. Old screenshot evidence under `/qa/button-label-regression/` predates the redesign and should not be used for judging the pill geometry.

## Polaroid-Inspired Product Cards — Owner redesign (2026-10-30)

- Shared `productCard(item)` component now renders a clean **Polaroid-inspired paper-photo frame**: warm off-white `#FBFAF6` outer card, 11–13px picture mat, larger upper product window and a deeper lower caption with product name, fit, print study, pending price, favorite heart and long ADD TO BAG pill.
- Each item's photo background is determined by its stable `item.visual % 4` token rather than its current grid position: Warm Gray `#DDDAD3`, Cream `--cream`, Muted Olive `#D1D6C7`, Mist `--mist`. Explicitly overrules the previous every-second-card white background on Homepage and Shop without changing the global palette.
- A **single outer card** receives the preapproved ±1.4° rotation and -5px lift. Shirt, picture mat and caption move as one; no separate parallax. Paper edges and a modest unblurred-looking retail depth are the only presentation changes; all T-shirt samples remain fully contained inside the window.
- Updated consistently for Homepage Collection (8/page), Shop (12/page, four desktop columns/two mobile), Favorites and Product Detail Related Studies (4). Favorite moved into the lower photo-paper caption without changing the existing `data-favorite`, `aria-pressed`, in-place update and local storage logic. The approved clean pill `data-add-to-bag` and session-cart quantity behavior remain unchanged.
- Price continues to display **Tk —** because actual merchandise/pricing, stock, and imagery have not yet been approved. This demo must not pretend to transact real orders.
- Live browser screenshots available at `/qa/polaroid-cards/`, with separate Homepage, Shop and Related Products capture files. This redesign does not alter the site section order, carousel choreography, routes or THREADS.

## Owner approved Polaroid/pill refinement — Compact Cards & Adaptive Solid Shadows (2026-10-30)

**Scoped changes only, built atop the Polaroid PR #36:**

- One reusable `productCard(item)` now renders `article.product-card-shell > .polaroid-card + .polaroid-card-action`. The external long ADD TO BAG pill is a true **sibling** of the Polaroid frame, remains aligned at exactly the frame width, and is kept stationary while only `.polaroid-card:hover` receives the *unchanged* 300ms alternating ±1.4-degree tilt and 5px lift. The shell itself has no transform.
- The outer frame is exactly **10px radius**, with the original photographic art, muted four-tone window backgrounds, descriptive caption and favorite heart retained. The four-column desktop / two-column mobile grid structure is not altered. Frame width is reduced **4% desktop/tablet, 3% mobile** relative to its grid slot. Chromium matched the complete frame+external-button height reduction to ~**6.8% desktop, 7.6% tablet, ~7% mobile**, preserving a larger garment photo window.
- The 7×7px hard-edged pill-shadow offset, capsule geometry, face colors and fonts, 300ms directional dark wipe, and click feedback are **unaltered**. The shadow alone is now themed using `--cc-shadow-color` and shared tokens in `button-system.css`: Light surfaces use Walnut (#6E523F) with Forest, Deep Forest (#1C241D) with Terracotta, and Dark Olive (#1F2216) with Beige; On dark Forest surfaces, Forest/Terracotta faces use Beige (#D8CEC2) shadows; on Dark Olive they use soft Gray (#D9DCD7). **Beige faces on either dark surface use medium Mushroom Gray (#A6A29B)** to keep the shadow visibly separate from both the face and its surroundings. Surface rules cover hero cover, footer and reusable `[data-cc-surface]`/`.cc-shadow-context--*` containers plus existing editorial/customization contexts.
- The isolated `/buttons/` review now includes additional interactive examples of the three button colors against **Light, Cream, Warm Gray, Forest and Dark Olive**. Existing utility icons, text-only editorial links and the Artist's Edit form were not converted into unrelated CTAs.
- Live screenshot review at `/qa/compact-polaroid/`: actual 1440px **desktop four-card** and 390px **mobile two-card** Shop captures. No real pricing, inventory, orders or checkout functionality is implied.
- Tests expanded to 23/23; Playwright checked independent frame hover/button stationarity, desktop/tablet/mobile/narrow size reductions, theme shadow RGBs, real Favorites/Add to Bag, Related Products, reduced motion, and absence of runtime errors. Source/published preview remain isolated from THREADS/EcomCMS/C01–C04.
