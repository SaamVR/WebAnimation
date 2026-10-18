# THREADS Batch 2 — Live gallery QA (2026-10-19)

## Deployment evidence
- **Existing public preview**: https://threads-standalone-layout-review-20261017.onrender.com/
- **Deployed source**: `5f4ba99d0cc48859e9f058db13e61d3fa80386d6` (Render deploy `dep-dbakhp67bikc73f0bj6g`, confirmed **LIVE**).
- **GitHub source tests**: 33 of 33 passed (workflow https://github.com/SaamVR/WebAnimation/actions/runs/39172547518).
- **Source and public Chromium browser:** tested 39 PDP routes, switching 158 actual thumbnails, all decoded with real images and correct selected states.
- **Mobile Chromium 390×844**: tested 7 representative pages; image bounds, selected state, T02 anchors and overflow passed.
- **Products with real extra images**: 36 / 39; exactly 119 transparent WebP alternate views matched to their rightful products. One real original cover plus 3 or 4 distinct angles in each matched PDP.
- **Unmatched originals**: `f1` Olive Sport Runner; `f3` Orange Weekender Duffel; `f4` Studio Wireless Headphones. These display a single real cover and do not fake alternate views. Two ZIP collage subjects (silver sneaker and green duffel) were not misleadingly assigned.
- The approved homepage, search, Shop grouping, cart, checkout and order remain as before. No T01/T02/T03/T04 animation implemented.

## Real browser screenshots — live preview, not mockups
- [Sneaker: alternate three-quarter angle](./2026-10-19-batch2-live-desktop-sho-03-alternate.png)
- [Cap: front view](./2026-10-19-batch2-live-desktop-hat-01-alternate.png)
- [Backpack: front view](./2026-10-19-batch2-live-desktop-bag-03-alternate.png)
- [Belt: front view](./2026-10-19-batch2-live-desktop-acc-02-alternate.png)
- [Watch: mobile gallery, rear view](./2026-10-19-batch2-live-mobile-acc-03-gallery.png)
- [Legacy single-image product: no invented gallery angles](./2026-10-19-batch2-live-desktop-f1-cover.png)

## Release boundary
PR #7 remains reviewable as a draft stacked on PR #6. Existing Render review service source branch updated and manually deployed. Repository `main` and `SaamVR/EcomCMS` were not modified. `T01–T04` reserved animation anchors remain intact.
