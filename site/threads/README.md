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

Browser QA notes: Source art has been recovered to an independently cropped WebP atlas. Delayed offscreen image decode is avoided by eagerly activating locally cropped thumbnails after atlas decode. Mobile header fit tested at 360/390 pixels.

## Owner-supplied assets — October 17
The exact owner-supplied THREADS wordmark and header Search, Favorite and Cart graphics replace the provisional header glyphs. Navigation now reads HOME, SHOP, COLLECTION, ABOUT. The owner-supplied hero photograph (white outer margins cropped) replaces the screenshot atlas crop; its embedded handwritten detail is not duplicated. The Deal of the Week illustration uses the owner-supplied full-resolution backpack image without T03 animation. All six images are local files in site/threads/assets; no EcomCMS changes.

## Desktop width reconciliation — October 18

The earlier `--content:1140px` reduced a 1440px browser's panels to 1068px and created 186px gutters, departing materially from the owner's wide reference layout. Desktop content now uses a capped 1840px grid with responsive gutters of about 3.5vw (up to 56px), with desktop imagery and media heights proportionally expanded. The mobile breakpoints are unchanged. Explicit width screenshots and overflow QA are required before accepting this width correction.

## Owner-approved palette and category art — 2026-10-18
- Background #F9F9F7; primary pale category/card #F1EFEB; secondary pale product/card #EEECE8.
- Accent #AED5A9 sparingly; medium green #2E453A for controls, CTA surfaces and wordmark; deep green #172B2E for product names, prices and important icons. Regular copy uses charcoal #222522.
- Search, favorite, cart and THREADS wordmark assets are recolored via their original alpha masks to the **exact** requested #2E453A (no drawing changes).
- Original owner-supplied sneakers (burgundy), bags (blue duffel), accessories (yellow cap, bottle, watch) replace only the 3 category images. Trimmed white canvas around art, otherwise exact source drawings.
- Original images kept as individual local static assets and excluded from the old low-resolution art-atlas substitution. The existing approved layout and all other section art remain unchanged. No T01–T04 animations added.

Browser QA correction: promotional pseudo-element/compositing combination concealed the prior approved backpack in Chromium after palette update. A dedicated, versioned CSS correction raises original static image layer, removes the faulty mask/blend, and preserves the owner-supplied backpack file without altering the composition or assigning T03 motion.

Final visual QA: image compositing defect persisted for inline <img> across browser widths despite decode succeeding. The original owner image now paints as CSS background of the existing promo image stage, while the existing img stays in markup for text alternatives and layout. Its opaque white canvas blends with the approved #F1EFEB, preserving subject art. The previous defective deal-art-layer-fix stylesheet is superseded.

## Approved standalone asset integration — October 18 (latest)
The owner supplied six images, applied without changing the page architecture or animation assignments:
1. Header icons: precisely extracted silhouette of search, heart and shopping cart, colored #2E453A; wordmark remains unchanged.
2. Featured Products: four individual crops of olive sneaker, silver sneaker, red backpack and black headphones. Card layout, prices, controls and cart behavior remain intact. Silver product display color and name updated to reflect actual supplied image.
3. Quality story: five crops from the approved orange sneaker + four-panel macro collage, placed into the preexisting CSS grid.
4. Brighter Everyday: source image black top/bottom bars trimmed; original dark-green product photo used without recoloring.
5. Last Chance to Save: moody sneaker artwork with a light text-protective overlay; countdown remains static sample numbers.
6. Deal of the Week: owner illustration cropped only to its transparency content bounds; original beige panel and all backpack/cap/bottle/shoe details retained. A crop of the same original art is used at narrow screen widths.
All media files are local assets in site/threads/assets and served without EcomCMS dependency. T01–T04 motion is deferred.

### Browser paint-path fidelity correction
On deployed Chromium screenshot QA, the original WebP images decoded but blend compositing failed to paint several Featured Product images and the desktop backpack. The four product artworks are now photographed against exactly the approved #EEECE8 card beige as local static crops (no replacement drawing), rendered using normal compositing. The Deal artwork is painted as a CSS background at desktop/mobile resolutions; its original semantic `<picture>` and alt-text image remain in the DOM and it is not used as a whole-page screenshot. T01–T04 remain untouched. Source QA and six real browser viewport checks are required after this correction.

### Final browser capture stability
The four featured images are tiny locally optimized files and are now eagerly loaded. Product image content-visibility is explicitly visible to avoid full-page screenshot omissions, while New Arrivals retain normal lazy network loading. No animation changes.


## Quality and Brighter Everyday correction — 2026-10-18

The image overflow reported on the deployed iPad screenshot is addressed by replacing five individually sized collage images with the exact owner-provided complete source (2048x984), saved as a WebP local asset. Dedicated section-scoped CSS keeps the image inside the collage and the adjacent text unchanged. Mobile stacks the full collage over the original text. The previous individual cropped art remains in the repository but is not used for this section.

The existing approved campaign-essentials.webp 2000x623 image already excludes the black bars visible in the full source; it is retained unchanged. The banner keeps the original image and left text overlay, with a wide desktop ratio and responsive minimum height on narrow screens. No other storefront sections, production apps or motion treatments are changed.


Responsive QA refinement: browser measurements showed the headline/copy needed 462px at 1440 and 387px at 1024. A rigid 2000/623 section aspect ratio cut off copy. The banner now naturally expands from its content (minimum height 375px–560px responsive), with the original approved image cropped via object-fit:cover and no stretch or source black bars. Mobile retains its original minimum 350px.


## October 18 — Deal of the Week rebuilt (standalone)
The legacy composited deal image, duplicate decorative rectangles, CSS background fallbacks and picture element have been replaced in the active DOM with **one SVG angled panel** traced to the owner's supplied transparent panel silhouette. The illustrated backpack is an independent, transparent WebP layer isolated from the original owner artwork (with alpha-masked handle opening and shadow); supplied original subject placement/appearance is preserved. The right-hand heading, paragraph and linked CTA remain editable HTML. The wrapper exposes `data-t03-layer="backpack"` as a future animation hook; no T03 choreography is enabled. A dedicated responsive stylesheet targets only `#deal.threads-deal` to avoid legacy CSS selectors. EcomCMS and other storefront sections are untouched.


## Footer visual reference and inverted Threads wordmark — 2026-10-18

Owner-supplied transparent light-colored THREADS wordmark cropped to content bounds and preserved as `site/threads/assets/threads-footer-logo-inverted.png`. Rebuilt footer only, based on two-row reference: top brand description and four illustrative social icons (no unapproved outbound links), top-right newsletter form with central separator; thin full-width divider; second row of Shop/About/Help/Company columns with modest © 2026 demo indication. Colors use existing site greens #172B2E, #2E453A and light ivory #F9F9F7. On mobile, brand/newsletter stack and link columns become a 2×2 grid. Newsletter is intentionally demo-only; no email submitted or retained. All T01-T04 motion, the remaining homepage sections and EcomCMS are unchanged.


## Threads visual/catalog refinements — 2026-10-18

- Hero Shop Collection pill changed to the exact palette accent #AED5A9; no other CTAs recolored.
- Category images Bags and Accessories enlarged approximately 15% and remain clipped within slightly rounded category cards.
- Category/featured/new-arrival cards now use 14–21px rounded corners; product cards have soft elevation/shadow.
- All demo catalog prices and the cart subtotal are presented as whole Bangladeshi taka `Tk` via `toLocaleString('en-BD')`. These are **illustrative local-market demo amounts**, not live retail offers, endorsements, or actual authenticated product quotations. Checked indicative Bangladesh running-shoe retail examples around Tk 4,000–7,500 for common contemporary designs; identified premium-branded items remain higher.
- New Arrivals rows: three completed top-row illustrations supplied by owner were extracted individually into transparent WebP files (Aqua, Crimson, Amber), with descriptive non-authenticating names and illustrative Tk pricing. **The source PNG is cut off at the bottom and does not contain complete views of the three remaining shoes.** Therefore positions 4–6 temporarily preserve their previously approved demo products and locally sourced media; cannot honestly replace them with cropped fragments or fabricated unseen shoes. Request a full uncropped six-shoe image to finish all six.
- Existing interactions, T01–T04 future hooks, and production EcomCMS remain untouched.


## Owner-provided final static art corrections — October 18, 2026

Four original featured-product cutouts (green sneaker, sky-blue THREADS cap, red backpack, dark over-ear headphones) are now cropped from the transparent sheet and displayed in the original four-card grid with accurate category labels and illustrative Bangladesh-market prices. New Arrivals n4–n6 now use the lower row of the owner's full six-shoe sheet (orange/cream, lime, black/turquoise), keeping n1–n3 unchanged. Source image bottom reaches the lower edge of the orange/lime shoes and may have a subtle clipped sole outline from the submitted source; no fabricated extension was drawn. The campaign replacement removes only the black cinematic padding from y=0–402 and y=1037–1536 and preserves all original left-to-right pixels of the 2048×635 photograph. On desktop, object-fit cover anchors at the right to protect the products; at <=620px, full artwork is displayed above left-aligned copy to prevent product loss. Deal of the Week image layer uses the new owner-supplied transparent 948×965 backpack illustration while the existing single SVG angled panel and future T03 hook remain intact. No CMS, unrelated pages, or animation choreography touched.


## October 18 — Latest owner Featured Products artwork (second revision)

Owner supplied a replacement transparent four-product sheet, overriding the earlier four featured assets. The current four card images are isolated original crops with alpha retained: olive-green running shoe, yellow/navy baseball cap, orange weekender duffel, black/blue-toned headphones. Product labels, category, palette swatches and illustrative Tk prices were aligned with the new imagery without moving/resizing the cards. The old files remain in repository for provenance, but they are no longer referenced by the active featured catalog. CSS/media-track behavior remains identical except selectors updated for the new hat and duffel asset names; no motion or other store sections modified. The app and CSS references use explicit cache-busting version query arguments.
