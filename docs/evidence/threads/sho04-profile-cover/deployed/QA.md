# THREADS — Burnt Orange Vintage Runner profile cover correction

**Status:** Deployed to isolated Render gallery-preview service; awaiting owner visual approval.

## Preview
https://threads-final-gallery-replacement.onrender.com/product/?id=sho-04

## Exact implementation
- Target: `sho-04` / Burnt Orange Vintage Runner only.
- The preexisting `profile.webp` (474×246, Git blob `47f094ea8e5f71a4ea8ecf16ff09afdcccbc9f94`) was renamed to `cover.webp`, preserving the exact file bytes.
- The former `cover.webp` (3/4 angled, 341×284, Git blob `f350e9fbab3328e82800242bba81c44839e03985`) was renamed to `angled.webp`, also byte-identical.
- Product `asset` continues to point to `./assets/products/sho-04/cover.webp` so all shared primary-image consumers automatically pick up the profile.
- Gallery manifest now contains cover/profile → angled → back → action (four distinct genuine owner-supplied photographs). No image regeneration, resizing, recoloring, resampling or CSS zoom.
- Existing contained fixed-square frame for `sho-04` remains untouched; `object-fit:contain` and all unrelated product images/layouts remain unchanged.
- Only product asset names, `sho-04` manifest/label and its focused source test changed. Approved T01/T02/T04 modules and static T03 unchanged.

## Public deployment
- Preview: https://threads-final-gallery-replacement.onrender.com
- Render static gallery-review service: `srv-dbeithnavr4c73b2qbng`, autoDeploy OFF.
- Live deploy: `dep-dbekujfavr4c73b8tjc0`, source commit `d9124c9dc3c07988bbe841f15d0a1ac9ffb96675`.
- Existing gallery review service reused without enabling a paid resource. No production update; prior build remains recoverable in Git.

## QA
- **50/50** source/contract tests passed on implementation source.
- **64/64** public-URL browser checks across desktop Chrome, mobile Chrome and iPad-sized Linux Playwright WebKit. First default image is **474×246 side profile**, all four distinct camera views decode and contain, thumbnails map to expected files, 1:1 gallery frame holds steady, Shop/Search card uses cover, Cart and Checkout work.
- **89/89** public-URL full gallery/storefront regression checks, including unaffected products; zero errors.
- **7/7** public-URL T01 Spotlight / T02 flying real cart motion checks.
- **69/69** public-URL T04 checkout steps, overlay, simulated success/cancellation checks.
- Zero JavaScript errors in above browser tests.
- Physical iPad Safari hardware testing remains unverified; Linux WebKit viewport emulation was used.

## Visual evidence
- [Real public-URL Chrome gallery/video](profile-cover-browser.mp4)
- [New profile cover](hero-profile.png)
- [Preserved angled view](gallery-angled.png)
- [Shop/Search profile card](shop-search-profile-card.png)
- [Full direct browser check report](QA-browser.json)

Protected source blobs:
- T01 `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`.
- T02 `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`.
- T04 `790088849cc646ffec4553a77cf25a56ff5b0e78`.
- T03 remains static/on hold. No `SaamVR/EcomCMS` changes.

**Do not merge review PR into production without owner approval.**
