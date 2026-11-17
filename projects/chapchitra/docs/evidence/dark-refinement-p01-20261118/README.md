# CHAPCHITRA — Dark Theme Visual Refinement P01

Creative review only. STACKED on dark-theme PR #122. No merge or deployment.

## Exact original owner-approved logo files

| Context | Repository asset | SHA-256 |
|---|---|---|
| Hero dark logo | src/assets/chapchitra-full-on-dark-original-patch-cream-terra-wordmark.webp | 1f5fc3845bc0d6ccfb840cb174bba65eea180203fe33fcab965758db0e00cd9d |
| Navbar/footer inverted wordmark | src/assets/chapchitra-wordmark-cream-terra.webp | e9b70e1af14dc71c2c065777415998c874c8af5517ac480297c127f1f6c489c5 |
| Original light Hero logo | src/assets/chapchitra-full.webp | 64b561df273d9dca559f2b1ec7c0709ce64df7a8c927c855c4566d4e0147ef84 |
| Original light Navbar logo | src/assets/chapchitra-wordmark.webp | 854646fb069dbe86c22a7c01437aefb9968513c5d6c21008a852bd85a7742b0a |

The footer was already using the inverted wordmark; it remains unchanged. No original logos, illustrations, animation SVG or Lottie data were recolored or modified.

## Matching real-browser evidence

| Requested visual | Desktop Chromium 1440x900 | iPad-width WebKit 834x1112 |
|---|---|---|
| Entire dark homepage | [View](desktop-chromium-dark-full-home.png) | [View](ipad-webkit-dark-full-home.png) |
| Hero 01 logo and CTA | [View](desktop-chromium-hero-logo-cta.png) | [View](ipad-webkit-hero-logo-cta.png) |
| Category filter chips | [View](desktop-chromium-category-chips.png) | [View](ipad-webkit-category-chips.png) |
| Collection Add to Bag | [View](desktop-chromium-collection-add-to-bag.png) | [View](ipad-webkit-collection-add-to-bag.png) |
| Pagination controls | [View](desktop-chromium-pagination.png) | [View](ipad-webkit-pagination.png) |
| Featured Prints | [View](desktop-chromium-featured-prints.png) | [View](ipad-webkit-featured-prints.png) |
| Footer inverted logo | [View](desktop-chromium-footer-logo.png) | [View](ipad-webkit-footer-logo.png) |

## Continuous original browser recordings

- [Desktop downward/upward dark homepage scroll](desktop-chromium-dark-home-scroll-uncut.webm)
- [iPad-width WebKit downward/upward dark homepage scroll](ipad-webkit-dark-home-scroll-uncut.webm)

Both are native Playwright recordings of a genuine timed scroll down and back to the top, without cuts, speedups or video editing. iPad evidence uses Playwright WebKit at tablet width, not a physical iPad.

## Exact UI treatments verified in both browser engines

| Treatment | Color and role |
|---|---|
| Hero CTA | Terracotta #8A503B face; Press Green #293D2D shadow |
| Category chips | Warm Beige #D8CEC2 face; Graphite #232323 label |
| Collection Add to Bag | Mushroom Grey #A6A29B face; Terracotta #8A503B shadow |
| Pagination | Walnut #6E523F with Cream #E4E3DE numbers; active logic untouched |
| Featured Prints | Entire section and printed backdrop Walnut #6E523F |
| People. Places. Prints. | No modification to original section background |

## Acceptance and critique

- Native full suite: 275/275 PASS. Production-equivalent build: PASS.
- New desktop and iPad WebKit QA: 2/2 PASS. 14 authentic PNG captures, 2 original WebM videos.
- Exact original full Hero logo, inverted navbar and inverted footer wordmark loaded successfully.
- Existing light Hero and navbar logos returned after theme toggle; no replacement artwork was invented.
- Actual inline SVG face/shadow computed styles match target colors, no horizontal overflow.
- Existing carousel 8s/4s timing, C08/C01/C02/C03/C05, product cards and Hero V scroll geometry untouched.
- Contrast calculated for Cream over Terracotta 4.97:1; Graphite over Mushroom 6.18:1; Cream over Walnut 5.56:1; Graphite over Warm Beige 10.12:1.
- [Machine-readable computed colors and scroll trace](browser-qa.json).

### Independent adversarial creative review

PASS for all specified component-color corrections, with existing original shapes intact. Owner creative visual approval is pending. Original marked screenshot was not present as an accessible new conversation attachment; implementation follows the written color directives and the exact previously approved repository assets. Physical iPad Safari remains untested.

No branch merge, protected staging update or Render deployment is authorized.
