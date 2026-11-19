# ZESTRY F05 — Restoration of the Four Original Illustrated Category Pages

**Owner correction:** November 19, 2026  
**Project:** \`SaamVR/WebAnimation/projects/restaurant-demo/\`  
**Source baseline:** merged PR #143, commit \`63274b383c7622f2df0074947a647acafeb98152\`  
**Source branch:** \`fix/zestry-f05-restore-original-category-intros-20261119\`  
**Release status:** SOURCE-ONLY; NOT MERGED OR DEPLOYED. Existing Render review site remains on baseline.

## What the owner corrected

The owner explicitly rejected the removal of the original **salad, burger, dessert/cake and drinks illustrations on the RIGHT-HAND category pages**. They approve the previously repaired menu page-turn animation, food photograph placement, and the rest of the interactive book. The only requested change is to **bring back the original FIRST illustrated page of EACH category**.

## Root cause verified against original 4.2 MB dotLottie master

Original \`assets/f05_book.lottie\` contains separate \`hold_Starters\`, \`hold_Main_Courses\`, \`hold_Desserts\` and \`hold_Drinks\` author-keyframed artworks: 19 starters food layers, 7 main-course burger layers, 10 dessert/cake layers, 15 drinks layers have opacity 100 in their respective authored category hold compositions. Each was being excluded by the site's earlier category-layer filter, while \`__f05Update\` mounted photographic dish #1 immediately, entirely hiding the intended illustrated category-opening page.

The first attempted repair restored vector drawing only during the \`Turn_*\` transition. Native browser screenshots still displayed a blank right-hand book while the page was turning and did not display the full illustrated category cover. This failed visual acceptance, despite superficial source-level checks. This history is explicitly preserved to avoid accepting source-only assertions as a substitute for full-frame QA.

## Correct user-facing sequence (implemented)

1. Open interactive book → choose category (original native 2.7s Lottie page turn).
2. **Show the fully authored illustrated category page as a separate stable page:** Starters salad bowl, Main Courses burger, Desserts strawberry cake, Drinks citrus cooler.
3. Press Next → original category \`Replay_*\` Lottie page turn to first real food photograph, without any art change.
4. Continue through the original four food photographs and existing 740ms 3D paper-leaf transitions (no new food or rearrangement).
5. At fourth dish → original native category flip → next category's illustrated first page, then its four items.
6. Previous from first photo of a category still returns to previous category's final photograph, as before.

Source: \`zestry-v3-editorial/restore_f05_category_intros_20261119.py\`, updating ONLY \`assets/f05_book.html\` inside the existing approved ZIP. Page-turn state machine and original master vector dotLottie remain bit-for-bit unchanged. Keep the previous approved \`index.html\` (F01–F07 motion, F03 coffee, F06 section, and F07 wide booking modal), \`assets/f05-fit-v8.css\` (photo inset 52.75%), and all asset files unchanged.

## QA

GitHub Actions **236/236 passing browser checks**: https://github.com/SaamVR/WebAnimation/actions/runs/44434667244

- **52/52 new category-intro checks**: all FOUR original illustrated food-category covers visibly held on desktop 1600×900, iPad 1024×768 and mobile 390×844. Validated source opacity, no photograph overlay on cover, actual native Replay_ after Next, and correct photograph #1 thereafter. Screenshots of all 12 actual FULL cover pages and videos captured.
- **50/50 F05 sixteen-item navigation regressions**, including original category flips, current 740ms leaf swipes, center-aligned photographs, fourth-item transitions, previous navigation, F03 coffee and compact F06.
- **63/63 all-other Lottie and F04 checkout regressions.**
- **71/71 approved reservation modal regressions.**

Artifact: \`zestry-restored-original-f05-intro-review\` with actual Chromium screenshots/videos; QA JSON \`docs/qa/owner-f05-original-intros-20261119/ZESTRY_F05_ORIGINAL_CATEGORY_INTROS_QA.json\`.

Original master SHA-256 unchanged, including F05:
\`3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645\`.

## Release rules

No new hosting service, preview URL or deployment was created. Only the existing ZIP \`assets/f05_book.html\` was modified. QA pass does not mean owner has approved the in-place update. Owner should review the restored four-page screenshot panel and Native Chrome recording, then explicitly authorize any deployment to existing Render service \`srv-dbtkitifngtc73cua2p0\`. The previously live deployment commit \`63274b383c7622f2df0074947a647acafeb98152\` should remain unchanged until then.

**Do not revert to the earlier restrictive filter.** The original first category illustration pages are a required user-visible feature.
