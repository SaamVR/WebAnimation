# THREADS catalog intake — owner-supplied imagery only

## Provenance and boundaries
- Repository: `SaamVR/WebAnimation`, isolated app: `site/threads/`.
- Never modify or import runtime dependencies from `SaamVR/EcomCMS`.
- Product assets come from owner's high-resolution **collage submissions**. **No generated, inferred, or unrelated product photography.**
- Existing approved homepage, inline header search, and cart/checkout/order styling are protected.
- T01–T04 animation stays deferred.

## Batch 1 — catalog covers
For each submitted collage, retain the source in an intake workspace, identify every item by a stable product ID, and extract **one transparent-background cover** per object without clipping edges, changing hue, stretching, or including a neighbor. Export WebP or PNG with alpha; retain original source/metadata.

Recommended path: `site/threads/assets/products/<product-id>/cover.webp`

An item may be added to `catalog.mjs` **only after** its actual image, identity, name, price in BDT, category, description, and keywords are confirmed. Avoid creating extra products by duplicating a crop or renaming an existing product. Keep the previous `f1`–`n6` IDs stable for persisted carts.

## Batch 2 — alternate angle gallery
Owner supplies additional collages per product. Crop each distinct view separately and record provenance:

| Role | Expected filename |
| --- | --- |
| Cover / main | `assets/products/<product-id>/cover.webp` |
| Front view | `assets/products/<product-id>/front.webp` |
| Side / profile | `assets/products/<product-id>/side.webp` |
| Rear view | `assets/products/<product-id>/rear.webp` |
| Extra / detail | `assets/products/<product-id>/detail-01.webp` |

Example of **schema only**, not an actual product or evidence of supplied imagery:

```js
{
  id:'owner-confirmed-id',
  group:'arrival',
  asset:'./assets/products/owner-confirmed-id/cover.webp',
  name:'Owner-confirmed name',
  subtitle:'Owner-confirmed materials / color',
  category:'Bags', // 'Sneakers' | 'Hats' | 'Bags' | 'Accessories'
  type:'backpack',  // optional: cap, backpack, duffel, etc.
  price:0,           // replace with confirmed positive BDT price
  description:'Owner-confirmed product description',
  tags:['backpack','travel'],
  swatches:['#000000'],
  colors:[{id:'color-0',name:'Black',hex:'#000000'}],
  sizes:['One Size'],
  gallery:[
    {asset:'./assets/products/owner-confirmed-id/cover.webp',label:'Main view'},
    {asset:'./assets/products/owner-confirmed-id/side.webp',label:'Side profile'},
    {asset:'./assets/products/owner-confirmed-id/rear.webp',label:'Rear view'}
  ]
}
```

The storefront's `productGallery()` displays real, separate assets whenever `gallery` is provided. Existing products with no alternate-angle assets deliberately retain **three labeled crops of one photograph**, not falsely advertised front/side/back views. Replace these fallbacks only when actual angle assets arrive.

## Product intake verification
1. Record collage → object → product ID → cover image mapping; confirm every crop's real object and non-white transparent background.
2. Assert unique IDs, distinct gallery URLs, file existence, valid BDT price, meaningful keywords, and appropriate merchandising category.
3. Test `Vintage Sneakers`, `Sneaker`, `Hat`, `Cap`, `Backpack`, `Bag`, and `Accessories` with truthful relevance; **a duffel is not a backpack**.
4. Open all Shop/Search cards; cycle actual thumbnails; verify cart → simulated checkout → successful order and negative paths.
5. Capture browser screenshots at desktop 1440px and mobile 390px; report broken/absent crops separately. Require owner review before branch merge/deployment.

## Batch 1 imported — 2026-10-19 (GitHub source and asset gate PASS)
Four owner-provided collage files were isolated into **29 actual product cover images**:
9 sneakers, 6 caps, 7 bags (4 backpacks / 3 duffels), and 7 accessories
(2 webbing belts / 3 water bottles / 2 watches).

- Branch: `feat/threads-batch1-catalog-20261019`, draft PR #6 (stacked atop PR #5).
- Stable IDs: `sho-01..09`, `hat-01..06`, `bag-01..07`, `acc-01..07`.
- Each real transparent WebP was committed at `site/threads/assets/products/<id>/cover.webp`;
  images were resized/compressed for performant browser rendering without generating or substituting
  product photography. Source-resolution originals and crop metadata remain in the downloadable
  owner-provided asset package.
- All **29 real WebP files** are checked in and validated by
  `site/threads/asset-contract.test.mjs`. The GitHub workflow now runs this release gate.
- Existing ten product IDs remain unchanged; new inventory appears in Shop and category search,
  while approved homepage featured/arrival curation remains undisturbed.
- Demo product names, tags, descriptions and BDT prices are illustrative merchandising metadata,
  not official brand or retail claims.
- `productGallery()` displays exactly one genuine **cover image** per new product until distinct
  owner-supplied alternate camera angles arrive in Batch 2. It does not claim three fake views.
- Cart, checkout, order confirmation and animations T01–T04 remain unchanged.
- The connected branch passing CI is not equivalent to a production deploy. Browser/mobile and
  public-preview verification must be reported separately and never assumed.

## Batch 2 — Real angles imported (2026-10-19)
- Received 38 ZIP collages; 36 confidently mapped to existing stable IDs; extracted 119 genuine individual product views (15 sneakers ×3, 7 hats ×4, 7 bags ×3, 7 accessories ×3–4).
- One source cover remains first in each matched gallery; additional views are distinct transparent WebPs at `assets/products/<id>/<angle>.webp`. Existing PDP template displays real thumbnails and image switches; no fabricated cropped alternatives.
- Three original products remain COVER ONLY pending usable source collages: `f1` Olive Sport Runner, `f3` Orange Weekender Duffel, `f4` Studio Wireless Headphones. Collages for unrelated silver sneaker and green duffel were not misassigned.
- `galleryAssetManifest` in `catalog.mjs` is the single source for view-to-product mapping. Gallery paths are validated by the new asset contract and actual browser QA before promotion.
- T01 Spotlight Search card hooks, T02 stable Add to Cart/cart anchors and separate imagery, T03 homepage deal, T04 checkout approval remain reserved only, with no animations implemented.
