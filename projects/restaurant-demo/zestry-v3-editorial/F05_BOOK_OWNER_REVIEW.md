# ZESTRY — F05 Book + F07 Reservation V5 — Staged Owner Review

**Date:** 2026-11-18  
**Scope:** `SaamVR/WebAnimation/projects/restaurant-demo/` ONLY  
**Review branch:** `feat/zestry-book-f07-staging-20261118`  
**Deployment:** **NOT DEPLOYED. Owner authorization required.** The Render-tracked branch `deploy/zestry-v3-render-review-20261116` and its existing public URL must not be changed by this review.

## F05 — Current integration

**Defect in old build:** The website rendered a generic nine-card menu and opened a large original `F05 interactive menu — Local dotLottie QA` inspector in a separate modal. That source was a developer harness with diagnostics, no customer-facing category pages with photographs.

**Implemented on the designated ZESTRY review source:**
- An animated closed menu **book** is the single visual in `#menu`. No detached animation modal or visible generic menu grid.
- The original F05 state-machine transitions drive opening, overview, four category selections, page turns, replay, previous/next, home and close.
- **Four categories preserved exactly:** Starters, Main Courses, Desserts, Drinks.
- Photography is locally bundled in the illustrated page. Each pictured item has an item name, sample price, and Add-to-bag action connected securely by same-origin `postMessage` to the existing demo cart.
- The original dotLottie source is byte-identical: SHA-256 `3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645`.
- The developer QA overlay is replaced by a ~15 KB customer renderer plus the original ~4.24 MB archive.
- For editorial integration, the original book's `STAGE_Background` is suppressed **only during compositing** (the original binary is unchanged), so the book sits on ZESTRY's cream page without a white panel.
- Original hold-state artwork contains no animated transform tracks. The optimized renderer stops idle repeated redraws on static book states and resumes for page-turn transitions.

**Current sampling:** Six pictured dishes are exposed across the four book sections (1 Starter, 2 Main Courses, 1 Dessert, 2 Drinks). Original `items` still stores nine including Breakfast/Brunch. The user requested four book categories, so Breakfast's category mapping and displaying every historical item inside the book remain **unresolved owner decisions**. Do not silently reclassify dishes. The pictured dishes and order flow are fully functional demo items, but do not call this all-nine-item menu feature-complete.

## F07 — Final approved artist SVG V5

**Source:** User-uploaded `F07_Table_Reservation_Edited_SVG_V5_Complete_Package(1).zip`.

- Original owner V5 JSON SHA-256: `a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b`.
- Source dimensions: 960 × 720, 30 fps, 228 frames, 25 layers. Artist updated 22 SVG shape layers while retaining the original approved V4 motion choreography.
- Original V5 `.lottie`, rigging/rebind manifest and independent source QA are preserved in the packaged review archive. The archived dotLottie contains the byte-identical V5 JSON.
- Replaced the old V4 `assets/lottie/f07.json` in the staged site. The new V5 is used BOTH in the Reservation section and for the simulated booking's F07 confirmation.
- Animation remains once-through, and the completed Reserved table is held.

## Chromium QA

- F07: Desktop 1440, iPad 1024, mobile 390 and 320 widths. Native SVG created. Correct V5 composition identified by name in both the section player and confirmation player. Screenshots at frames 16/53/128/154/192/227. Form submits only a demo reservation. No horizontal overflow or page errors.
- F05: Four-category book navigation, all six currently featured photographs loaded, closed/overview/page turn, add to simulated bag, responsive layout at desktop, iPad, 390 and 320 widths; zero page/HTTP errors; no horizontal overflow.
- F05 → Cart → Checkout → F04 order confirmation: desktop and mobile at reduced-motion setting passed with expected $19.00 sample subtotal.
- The F05 reference interpreter renders original vector archive frames, but this does NOT constitute official dotLottie-web runtime certification. Full performance/artistic acceptance on the owner's iPad remains pending.

## Release rules

1. Preserve the uploaded source masters, F01/F02/F03/F04/F06, both F02 versions, F03 one-time final hold, F06 continuous piece, and F08 exclusion.
2. No changes to THREADS, CHAPCHITRA, root hosting configuration, Render, Vercel or main.
3. This branch is **review-staged only**. Do not trigger Render or Vercel deployments or merge into the Render-tracked branch unless explicitly authorized by the owner.
4. After owner's creative feedback, finish any remaining photo-category mapping and runtime polish before deployment approval.
