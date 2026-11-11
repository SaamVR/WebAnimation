# CHAPCHITRA — Artist's Edit placeholder pricing (review-only)

**Date:** 2026-11-12
**Repository:** SaamVR/WebAnimation
**Starting SHA:** 29f484bb866146e8c2a52cfc12d9035413b38a68

## Pricing source

The temporary configuration lives in src/worktable-pricing.mjs (ARTIST_PRICING), not in UI components.

| Garment | Base |
|---|---:|
| Regular Tee | ৳450 |
| Drop Shoulder | ৳550 |
| Full Sleeve | ৳650 |
| Hoodie | ৳850 |

A4 printing is ৳100 per side; A3 is ৳200 per side. A side without artwork is ৳0, regardless of its selected preset. Formula: base + front print charge + back print charge.

Print-size dimensions are A4: 210 × 297 mm and A3: 297 × 420 mm; the approved on-garment guide geometry is not changed.

## Editor synchronization

One pure calculateArtistPrice function calculates totals in BDT. Active front/back state is read directly from artURL/decoded bitmap; inactive side from its preserved sideRecord. Price recalculates on successful upload, remove, print-size changes, garment changes and side switching. Color, garment size, image adjustments and view direction do not affect the placeholder total.

A compact price card appears below the original artwork controls; its details element expands base, front, back and total charges. The worktable, animations, front/back assets, original edit controls and nonsticky Artist's Edit header are unchanged.

## Demo bag (not real commerce)

The existing catalog sample bag remains session-only. A separate Artist's Edit configuration record is saved in sessionStorage under chapchitra-artist-customizations-v1 only when the user clicks Add to demo bag, capped at 20 entries.

The stored record contains garment, color, size; independent front/back artwork-presence flags, paper sizes and millimetre dimensions; x/y placement, relative scale adjustment, rotation; schedule version and display-only estimated total. The bag recomputes totals from the pricing configuration when it reads data, rather than trusting the serialized display amount.

**No image files, bitmaps, object URLs, filenames or image bytes are stored.** Uploaded design files remain local to the editor. Leaving Artist's Edit loses the image preview; this is not a fulfillment-ready print order. No checkout, payment, order API or server-side price validation has been added.

For a real commercial order, create an authorized upload/fulfillment flow and revalidate the complete configuration and pricing server-side, including item availability, print dimensions, shipping and taxes.

## QA and approval

Pure unit tests cover all garments, artwork presence combinations, A3/A4 mixes, owner examples, neutral color/size changes, invalid state and tampered browser totals.

Browser tests cover three viewport engines: desktop Chromium, iPad-sized WebKit and mobile Chromium, including independent uploads, side switching, price breakdown, demo bag persistence, metadata and removal. Existing two-sided editor and navbar regressions must pass.

Keep this work in a DRAFT PR with a preview-only deployment. Do NOT merge main or advance the existing Render shared review before owner visual approval. No physical iPad test has been performed.
