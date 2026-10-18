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

## Batch 1 received — 2026-10-19 (asset upload pending)
Four owner-uploaded transparent RGBA collages were inspected and segmented into 29 distinct product cutouts: 9 sneakers, 6 caps, 7 bags (4 backpacks and 3 duffels), and 7 accessories (2 belts, 3 bottles and 2 watches). The previous ten catalog IDs and home Featured/New Arrivals remain intact. New stable IDs: sho-01..09, hat-01..06, bag-01..07, acc-01..07. Their cover paths are assets/products/<ID>/cover.webp.

**Important release gate:** The exact 29 cutouts are packaged outside the GitHub connector as a downloadable ZIP with manifest and visual contact sheet. This connector can commit the JS/docs but cannot ingest the binary ZIP directly from the working container. Until all 29 WebP files are uploaded into this branch at the mapped paths, this draft branch will display broken image URLs for the new items and MUST NOT be merged, deployed, or reported visually complete.

Batch 1 provides only a cover photograph per product. The gallery renderer displays that actual cover only and does not claim nonexistent alternate-angle shots. Batch 2 is still required for side/rear/detail thumbnails. Catalog names and prices assigned for demo are illustrative, not verified retail specifications or official offers.
