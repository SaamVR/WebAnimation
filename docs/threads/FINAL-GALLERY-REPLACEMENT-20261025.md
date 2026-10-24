# THREADS — Final Gallery Replacement & Duplicate Cleanup (2026-10-25)

## Scope
Standalone `SaamVR/WebAnimation/site/threads` storefront only. T01 Spotlight Search, T02 real-cart Add to Cart, current approved T04 payment flow, and static/on-hold T03 are unchanged. No `SaamVR/EcomCMS` edits.

## Six complete owner-collage replacements
The uploaded ZIP `Edited gallery images(1).zip` supplied one labeled collage per product. Each photographic view was isolated without generating replacement artwork. White/off-white collage boards and labels were removed to alpha transparency; silhouettes, straps/handles, shadows, proportions and source colors remain. All final images are 1100×1100 transparent WebP assets with group-consistent scale.

- `f2` Sunburst Baseball Cap: angled source becomes cover; front/profile/rear remain three distinct gallery views.
- `hat-01` Sky Blue Two-Tone Cap: angled source becomes cover; front/profile/rear.
- `hat-04` Sunshine Monogram Cap: angled source becomes cover; front/profile/rear.
- `bag-01` Forest Everyday Backpack: cover/front/side/angled.
- `bag-02` Olive Utility Backpack: cover/front/side/angled.
- `bag-05` Burgundy Weekender Duffel: cover/front/side/angled.

No old photograph is mixed into these six galleries.

## Four corrections
- `bag-04` Mustard City Backpack: its existing high-resolution front photograph overwrites the previous `cover.webp`; `front.webp` is then removed, so front appears exactly once as cover. Side and angled remain.
- `acc-03` Navy Active Watch: duplicate `angled.webp` removed from manifest and filesystem. Cover/front/profile/side remain.
- `acc-04` Olive Insulated Bottle: unchanged. Cover/front/back/open remain, and front/back are distinct image bytes.
- `acc-07` Ochre Active Watch: duplicate `angled.webp` removed. Cover/front/profile/side remain.

The legacy standalone Sunburst feature cover is removed after the new gallery is verified, and the homepage now resolves `f2` directly to `products/f2/cover.webp`.

## Image behavior
Product cards, thumbnails, cart/checkout images and product-detail main media use `object-fit: contain`. Legacy index-based detail-image zoom transforms were removed because every gallery view is now an independent photograph and must never crop a product edge.

## Verification / cleanup order
1. New mappings and replacement assets installed while obsolete files remained.
2. 45/45 source tests passed.
3. All ten affected pages, every thumbnail, homepage/search/favorites, Add to Cart, Cart and Checkout passed 89/89 Chrome checks with zero page errors.
4. Only then were seven obsolete files deleted: old Sunburst featured cover, three cap angled duplicates, Mustard's now-promoted front file, and the two watch angled duplicates.
5. Final post-cleanup: 46/46 source tests and the same 89/89 browser checks passed; all 24 new collage-derived files verified 1100×1100 with alpha.

Approved motion modules are unchanged from parent `a2c8dfe8a8200f934efd0e126d79b16d3595c3d7`.
