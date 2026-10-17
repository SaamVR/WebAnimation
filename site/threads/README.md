# THREADS — independent interactive storefront demo

Owner design reference: IMG_1613.jpeg (2026-10-17), approved Threads website screenshot. This is not an EzComo/EcomCMS page, embed, or merchant dashboard.

## Ownership

- Independent static site: site/threads/index.html, published as the root of a separate deployment with publishPath site/threads.
- All interface, animations, sample cart, and mock checkout live here. No EcomCMS API calls, edits, imports, or runtime.
- WebAnimation landing page unchanged; isolated feature branch for review.
- Six original-art T03 image layers were copied read-only from a historical development branch and vendored under site/threads/assets with their original hashes. They remain unapproved reconstructed review assets, not evidence of visual acceptance.
- Editorial photography is temporary, sourced via independent Unsplash CDN references. The supplied screenshot is only 431x1536; imagery cannot be reproduced pixel-perfect until original layout files and product assets are supplied. Do not turn screenshot into a static site background.

## Canonical section order

Header and search; photographic green hero; Sneakers/Bags/Accessories; four featured products; We Provide Quality editorial mosaic; Built for a Brighter Everyday campaign; six new arrivals; Last Chance to Save countdown; illustrated Deal of the Week backpack; dark-green footer.

## Interactions

- T01: header spotlight, accessible search, relevance preview, focused product highlighting, escape and reduced motion.
- T02: local sample-cart acceptance, thumbnail flies to header bag, subtotal/cart drawer, no real order.
- T03: six original extracted registered image layers, flap/paper/offer/accessories, open/close button, demo cart item. Original art owner acceptance still pending.
- T04: bag -> sample payment review -> processing animation -> demo completion. No payment credentials accepted; no transaction is made or transmitted. Demo countdown is relative to load, not genuine campaign expiry.

## Validation and next art acceptance

Run node --test scripts/tests/threads-demo.test.mjs.
Browser QA: scripts/threads-browser-qa.cjs (desktop 1440 and mobile 390, interaction proof and screenshots). GitHub Action threads-standalone-qa.yml performs these tests.
Pending: replace placeholder photography with original authorized layout imagery, compare desktop/mobile against canonical source at full resolution, review and approve T03 art registration/keyframes, capture motion videos, and obtain owner visual acceptance. Do not report this as final accepted or live production checkout.
