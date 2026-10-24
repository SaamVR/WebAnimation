# THREADS — Product Catalog & Gallery Finalization (2026-10-24)

## Scope
Standalone Threads storefront only, repository `SaamVR/WebAnimation`. T01 Spotlight Search, T02 actual product-to-cart motion, T04 payment overlay, and the closed **static** T03 Deal backpack remain unchanged. No `SaamVR/EcomCMS` changes.

## Product identity and cleanup
- `f1` Olive Sport Runner is **retired**, not duplicated or renamed.
- The already existing `sho-08` Olive Trail Tech remains the sole canonical replacement with its existing cover, price, variant options, and 3-angle owner gallery.
- Homepage Featured renders exactly four cards: `sho-08`, `f3`, `f2`, `f4`, merchandised by category/type/name. The shop catalog keeps a single `sho-08` record.
- Legacy `/product/?id=f1` displays a safe Product not found state and browse link; stale cart entries are filtered by the existing `sanitizedCart`, and stale favorite IDs by `getFavorites`. This never creates a duplicate.

## Categories and ordering
All Products, Shoes / Sneakers, Backpacks / Bags, Accessories. No separate Hats/Caps filter. All six original hat product records now belong to Accessories, as does featured cap `f2`. Previous `?category=Hats` deep links resolve to Accessories for compatibility.

Deterministic layout order, also applied to filtered pages: Sneaker → Backpack/Duffel → Accessories (cap, belt, bottle, watch, headphones); product names sort A–Z within type. Existing product cards and image object-fit: contain are unchanged.

## User-supplied source galleries
The owner supplied two separate, unaltered collages. They were transferred byte-exact to an authorized development machine, verified by SHA-256, and cropped into true physical camera angles with Pillow. No generated, duplicated, recolored, or fabricated photography. **Existing cover images are unchanged.**

- Orange Weekender Duffel `f3`: current cover + real front, side, angled PNG-collage cutouts saved as WebP.
- Studio Wireless Headphones `f4`: current cover + real front, profile, side, angled JPG-collage cutouts saved as WebP.
- Crop coordinates and SHA-256 input checks are in `scripts/threads_gallery_extract_20261024.py`. Raw source collages are not copied into the storefront build.

## Test / safety gates
- 38 unique canonical products, 29 owner-supplied Batch 1 catalog records.
- 38 mapped multi-angle galleries, 126 original independently cropped angles total.
- Every gallery WebP exists, is unique to its product, and has no fake zoom-only view.
- Category/search/full Shop sorting, homepage cards, favorites, stale `f1` cart handling, T01/T02, T04 checkout, T03 static and keyboard flows must pass before review approval.
