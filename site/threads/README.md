# THREADS — Standalone homepage layout demo

Source repository: SaamVR/WebAnimation, path site/threads/.
Canonical visual reference: Owner's IMG_1613(1).jpeg and IMG_1613(2).jpeg provided October 17, 2026.
Creative approval covers the layout screenshot only, not any additional animation treatment.

## Delivery in this phase

Responsive HTML/CSS/JS editorial storefront study. Semantic live sections, headings, buttons, filters, simple in-memory sample cart, favorites, search, and a demo-only newsletter acknowledgement. No CMS runtime, account, API, orders, payment, database or email submission.

Homepage order follows the screenshot exactly:
1. Header with reserved T01 search control; no spotlight animation yet
2. Lifestyle hero
3. Categories (3)
4. Featured Products (4): T02 reserved, no fly-away motion yet
5. About Threads quality collage
6. Built for a Brighter Everyday campaign
7. New Arrivals (6): T02 reserved, no fly-away motion yet
8. Last Chance to Save promotion with static numbers from screenshot
9. Deal of the Week: T03 static visual, no reveal animation yet
10. Footer and newsletter

T04 is deferred until the owner supplies its separate choreography brief; checkout stays disabled.

## Fidelity and source-image limits

The owner's only supplied visual asset is a 431×1536 compressed full-page screenshot, not original high-resolution product photo exports. The HTML/CSS page is reconstructed independently; no flattened screenshot is used as a site background. The art-atlas.webp contains individually cropped product/media images from the actual supplied screenshot; app.mjs displays them in real HTML product cards. They are low-resolution crops, NOT original full-resolution source photography. Unsplash links remain as fallbacks if atlas loading fails. The static orange/teal backpack is a locally authored SVG approximation of the reference artwork, not an exact reproduction of the original illustrated raster asset. Its paths can be refined for later T03 choreography. No EcomCMS runtime, API, deployment or static asset dependency exists. SaamVR/EcomCMS is never modified.

Before owner visual approval: compare actual browser captures at 1440, 768 and 390 pixels side-by-side with the screenshot; replace provisional image links with approved original photos and refine the locally stored vector illustration against owner-approved artwork. The reference backpack crop is used as a static image in this phase; backpack.svg is a reserved locally authored vector study for future T03 integration. The screenshot timer is decorative static copy, not an invented live sales deadline.

## Local preview

Serve the site directory with any static server, such as: python3 -m http.server 8000 --directory site
Visit localhost:8000/threads/

No framework build step or CMS is required. The owner will provide animation briefs one at a time.
