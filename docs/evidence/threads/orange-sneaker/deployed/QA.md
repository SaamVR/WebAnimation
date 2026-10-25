# THREADS — Burnt Orange Vintage Runner owner-photo gallery (2026-10-25)

**Status:** Isolated deployed review; awaiting owner's visual approval.

## Live preview
https://threads-final-gallery-replacement.onrender.com/product/?id=sho-04

**Identified product:** `sho-04` Burnt Orange Vintage Runner. Existing cover was visually matched against the supplied New Balance orange sneaker collage. `n4` Orange Velocity Runner is a different orange/black Asics-style shoe and was not changed.

## Asset changes
All four views were separated **from the uploaded owner's exact source image** `Orange-sneaker-collage(1).png`, without generative substitution or blending with old photographs. Natural colors, shadows, outlines and shoe silhouette were retained; clean near-white background was made transparent through connectivity-based masking. Crops are individually encoded as high-quality WebP with transparency and fully intact edges.

| Product view | File | Dimensions | Role |
| --- | --- | --- | --- |
| 3/4 Angled | `assets/products/sho-04/cover.webp` | 341×284 | New hero for homepage/Shop/Search/product |
| Profile | `assets/products/sho-04/profile.webp` | 474×246 | Gallery |
| Back | `assets/products/sho-04/back.webp` | 206×317 | Gallery |
| Action | `assets/products/sho-04/action.webp` | 325×495 | Gallery |

Only these four images are used by the `sho-04` gallery manifest; no duplicate angles. Legacy `sho-04/angled.webp` and `sho-04/rear.webp` were deleted **after** new images passed rendering validation, and remain recoverable in Git history. Product names, variants, prices and category sorting were not changed.

The detail page applies a dedicated `data-sho04-square-gallery` 1:1 frame, ensuring contained product presentation across wide and tall camera views without layout shift. Unrelated gallery geometry untouched; `f3` duffel square remains intact. Cards and product detail use the same new `cover.webp` via existing catalog `imageUrl`.

## Public deployment
Render review service `srv-dbeithnavr4c73b2qbng`, deploy `dep-dbekdgks728c73chicv0`, app SHA `0c148dba075cf1634e46f828cf1c8be2e38c1c93`, live. Hobby tier has a 25-service cap; existing owner review static service was reused rather than enabling a new paid resource. Previous versions remain recoverable via Git. Production unchanged.

## Tests
- **50/50 source tests**, including two focused product-gallery/mapping contracts.
- **61/61 browser checks** on public URL: desktop Chrome, mobile Chrome, and Linux WebKit at iPad-sized viewport; all four images decode, appear once, use `object-fit:contain`, main image and thumbnails match, frame stays 1:1 and adjacent sections don't move, Shop/Search new hero, Favorites/cart and checkout availability. Zero errors.
- **89/89 existing product-gallery/storefront public regression checks**, zero errors.
- **7/7 T01 Spotlight / T02 real-cart flight public motion smoke checks**.
- **69/69 T04 simulated checkout public end-to-end checks**, zero errors.
- **Physical iPad Safari not directly available**: Linux WebKit touchscreen-size emulation is a proxy, not physical iPad validation.

## Visual evidence
- [Actual browser gallery angle-cycle MP4](sho04-gallery-review.mp4)
- [New hero 3/4 image](sho04-angled-hero.png)
- [Profile](sho04-profile.png)
- [Back](sho04-back.png)
- [Action](sho04-action.png)
- [Detailed public-URL QA results](QA-browser.json)

Protected approved source hashes unchanged:
- T01 `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- T02 `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
- T04 `790088849cc646ffec4553a77cf25a56ff5b0e78`.
- T03 remains static/on hold; no `SaamVR/EcomCMS` modifications.

**Do not merge this draft PR into production before owner visual approval.**
