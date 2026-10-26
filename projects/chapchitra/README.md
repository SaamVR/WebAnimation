# CHAPCHITRA V3 — Isolated Architecture

Structural implementation of the owner-approved eleven-section homepage. Brand visual approval remains pending.

## Preservation
Source repository: SaamVR/WebAnimation; independent app: projects/chapchitra. Vercel project chapchitra-motion-demo builds ONLY from this directory. THREADS release is untouched.

## Homepage section order
1. Announcement bar with specified shipping/early-access copy
2. Sticky navigation with dropdown, search, favorites, account, bag and guest-hidden bell
3. Five-slide hero: auto every six seconds, focus/hover pause, dots, mobile swipe, reduced-motion disabled auto
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
64 synthetic catalogue records only; garment drawings are neutral SVG silhouettes, price is Tk — (unknown). There is no authentication, inventory, payments, account, email subscription, custom printing submission, real product photography or custom animation.

## Build and QA
npm run check; npm run build; npm run preview. Build performs structure and isolation tests. Conduct separate live-browser verification at desktop 1440px, tablet 820px and mobile 390px; inspect page links, accessibility, carousel timers, filters, pagers, reduced motion and JS console.

## Creative approval
V3 structure approved, branding pending. C01, C02, C03, C04, rickshaw wheel and tea stall steam animations reserved. No automatic approval inferred.
