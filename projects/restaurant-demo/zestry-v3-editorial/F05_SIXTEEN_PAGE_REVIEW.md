# ZESTRY — F05 Menu Book, 16 dish leaves (owner revision)
Date: 2026-11-18
Source branch: `feat/zestry-f05-sixteen-dish-pages-20261118`
Deployment: NONE. Do not update the existing Render site without explicit owner instruction.

## Owner requirements
- Four top-level categories: Starters, Main Courses, Desserts, Drinks.
- Four unique dishes per category (16 total). Every Starter is a salad.
- One food photograph and one dish per book leaf, with its name and price large enough to read. No multi-dish grid.
- Within a category, next/previous steps through four individual leaves. Category navigation and return-to-overview remain.
- Preserve original approved F05 vector animation/state machine and F07 reservation V5 unchanged.

## Demo-only example menu (sample prices, USD)
| Category | Page 1 | Page 2 | Page 3 | Page 4 |
| --- | --- | --- | --- | --- |
| Starters | Garden Crunch Salad $13 | Greek Feta Salad $14 | Roasted Beet Salad $15 | Classic Caesar Salad $14 |
| Main Courses | Basil Pesto Farfalle $19 | The ZESTRY Smash $18 | Spiced Chicken Rice Bowl $22 | Crispy Chicken Sandwich $19 |
| Desserts | Strawberry Cloud Cake $11 | Chocolate Fudge Brownie $10 | Cafe Tiramisu $12 | Strawberry Cheesecake $12 |
| Drinks | Honey Oat Latte $6 | Citrus Cooler $7 | Iced Matcha Latte $8 | Blackberry Smoothie $9 |

Existing six dishes preserve their IDs and demo prices. Ten entries (IDs 10–19) are added to the simulated bag catalog only. The three historical Breakfast/Brunch dishes are not reclassified.

## Photo sources / license
The six prior photos are already bundled. Ten new photos are selected from real Unsplash photography under the [Unsplash License](https://unsplash.com/license); source detail pages:
- Greek salad: https://unsplash.com/photos/a-greek-salad-with-feta-cheese-olives-and-cucumbers-25SHQMgsWEQ
- Roasted beet salad: https://unsplash.com/photos/beetroot-salad-with-creamy-dressing-and-herbs-_wOtm7Z8p5Q
- Caesar salad: https://unsplash.com/photos/delicious-caesar-salad-is-presented-on-a-table-UdLsLK_KFLw
- Chicken rice bowl: https://unsplash.com/photos/a-delicious-meal-of-grilled-salmon-with-rice-and-vegetables-fahnPDK0GQA (the visible meal includes chicken and rice; avoid calling it salmon)
- Chicken sandwich: https://unsplash.com/photos/a-chicken-sandwich-sitting-on-top-of-a-piece-of-paper-PcXZtTcRNvY
- Brownie: https://unsplash.com/photos/a-rich-chocolate-brownie-on-a-white-plate-yBNwcGFDqBk
- Tiramisu: https://unsplash.com/photos/a-delicious-tiramisu-dessert-with-cocoa-powder-kBRJ6dhhmYQ
- Cheesecake: https://unsplash.com/photos/a-delicious-cheesecake-topped-with-strawberries-and-cream-EvP5OAts3bQ
- Matcha: https://unsplash.com/photos/a-glass-of-refreshing-matcha-iced-latte-Oog-4Ox0rv8
- Blackberry smoothie: https://unsplash.com/photos/a-purple-smoothie-in-a-glass-with-a-spoon-G-qUSofkSr4

`apply_f05_book_review.py` invokes `f05_sixteen_pages.py` to transform the customer HTML and catalog and bundle the ten source photographs as local JPEG assets. The photo step is intentionally strict: failures must stop packaging, never fall back to broken URLs or inaccurate pictures.

## Review / release gate
This branch contains **source changes and updated QA assertions only**. The 15-part `review_bundle` archive has not yet been regenerated here, and the updated site has not passed browser playback or visual QA. A developer environment with network/photo access and Playwright must:
1. Run `python3 projects/restaurant-demo/zestry-v3-editorial/apply_f05_book_review.py --preview-dir /tmp/zestry-sixteen-local` with licensed-photo downloads available.
2. Inspect all sixteen local JPEGs for quality/accurate subject, and view each book leaf at 1440, 1024, 390 and 320 widths. Check text legibility and that page counters do not cover navigation.
3. Execute `qa_f05_menu.cjs` against `ZESTRY_PREVIEW_DIR=/tmp/zestry-sixteen-local` after adjusting Playwright binary paths for the runner.
4. Run the existing checkout and F07 booking regression checks. Verify all sixteen sample bag additions, one-per-page, prev/next/home, keyboard and reduced-motion behavior.
5. Only after QA passes, regenerate the `review_bundle` using `--pack` on this branch, commit local screenshots, and request owner visual review. **Do not deploy**.

Files changed: `f05_sixteen_pages.py` (new), `apply_f05_book_review.py` and `qa_f05_menu.cjs`. Existing F05 binary and F07 V5 are untouched.
