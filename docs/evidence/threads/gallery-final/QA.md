# THREADS — Final Gallery Replacement public QA (2026-10-25)

**Live review preview:** https://threads-final-gallery-replacement.onrender.com

## Deployment
- Separate Render static service: `srv-dbeithnavr4c73b2qbng`
- Application commit: `4f0489e7371cb58ad6bb2dca6425825215964457`
- Final cache-cleared live deploy: `dep-dbeivocs728c73cd2fv0`
- Auto-deploy disabled; existing production and approved previews were not replaced.

The first Render artifact selectively omitted four legacy CSS files despite their presence in Git. A cache-cleared redeploy of the same application commit fixed the artifact. Required CSS/JS and gallery assets now return HTTP 200; no storefront workaround or design change was introduced.

## Ten affected products
- `f2` Sunburst Baseball Cap — new owner-collage cover/front/profile/rear only.
- `hat-01` Sky Blue Two-Tone Cap — new owner-collage cover/front/profile/rear only.
- `hat-04` Sunshine Monogram Cap — new owner-collage cover/front/profile/rear only.
- `bag-01` Forest Everyday Backpack — new owner-collage cover/front/side/angled only.
- `bag-02` Olive Utility Backpack — new owner-collage cover/front/side/angled only.
- `bag-05` Burgundy Weekender Duffel — new owner-collage cover/front/side/angled only.
- `bag-04` Mustard City Backpack — existing high-resolution front photo promoted into `cover.webp`; side/angled remain and front is not duplicated.
- `acc-03` Navy Active Watch — cover/front/profile/side; duplicate angled view removed.
- `acc-04` Olive Insulated Bottle — unchanged cover/front/back/open; front/back are distinct bytes.
- `acc-07` Ochre Active Watch — cover/front/profile/side; duplicate angled view removed.

For every thumbnail the main image decoded successfully, computed `object-fit: contain` was active, and no index-based scale transform could crop product edges. All six replacement sets contain exactly four 1100×1100 WebP files with alpha transparency. No replacement gallery mixes old photos.

## Verification and cleanup order
Before obsolete deletion:
- 45/45 source tests passed.
- 89/89 local Chrome gallery/home/search/favorites/cart/checkout checks passed with zero page errors.

Only after that pass were the legacy Sunburst cover, three cap duplicate angle files, Mustard's separately duplicated front file, and the two duplicate watch angled files removed.

After cleanup:
- 46/46 source tests passed.
- 89/89 local Chrome checks passed.
- Public Render: 89/89 gallery/storefront checks, zero browser JavaScript errors.
- Public Render: 7/7 T01 Spotlight and T02 real-cart motion smoke checks.
- Public Render T04 smoke: arbitrary sample card fields enable payment; the approved animation appears; existing Order Confirmation completes; zero page errors.

## Protected work
No application diff from parent for:
- T01 `t01-spotlight.mjs` blob `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`
- T02 `t02-fly-cart.mjs` blob `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`
- Current approved T04 `t04-payment-approved.mjs` blob `790088849cc646ffec4553a77cf25a56ff5b0e78`

T03 remains static/on hold. No `SaamVR/EcomCMS` changes.
