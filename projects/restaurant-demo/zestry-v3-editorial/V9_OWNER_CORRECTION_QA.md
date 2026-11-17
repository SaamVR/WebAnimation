# ZESTRY V9 — Owner correction to PR #125 (2026-11-18)

**Status:** Revised review only; NO Render or Vercel deployment.
**Source:** feat/zestry-v8-editorial-fixes-20261118, extending the earlier review commit 71826b5.
**Scope:** projects/restaurant-demo ONLY.

## 1. Hero shape corrected from owner's marked screenshot
The user drew a broad, continuous, asymmetrical perimeter around the pasta-bowl image, not alternating floral/scalloped bumps. The V8 clip path was therefore replaced by a single flowing silhouette with a smooth upper-right shoulder, a swept lower-left edge and intentional upper-left asymmetry. Unlike the first V9 iteration, the final shape encloses the bowl in its entirety, including its left rim. The F01 Lottie JSON and all its motion/vector layers remain byte-identical.

- Evidence: docs/qa/owner-v9/organic-hero-reference-correction.png
- Source code: revert_f04_and_refine_hero_v9.py, PATH constant

## 2. F04 restored exactly to original context and playback wiring
The owner's question 'Where is F04?' was not authorization to create a second public player or alter F04's runtime.

The V8 Order & Pickup F04 presentation has been REMOVED. Three V8 JS changes were REVERTED:
- Remove F04 from the hero/F03/F07 force-one-shot conditional.
- Remove F04 from the F01/F03 final-frame-hold handler.
- Remove F04 from the page section IntersectionObserver initialization list.

The unmodified original simulated order-confirmation flow retains showConfirm('f04', line), with play(kind, confirm-player, false) and the existing 240-frame F04 JSON. In Chrome QA, the simulated bag → pickup checkout → order confirmation showed 'Sample order received' and rendered native SVG F04, 240 frames, loop false.

F04 artwork SHA-256: e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0.

The distinct story section is now 'Our Story' with fictional brand story copy, without a second table-booking CTA or a F04 animation. The reservation section retains F07 V5.

## 3. Unchanged earlier fixes
- Menu book and its controls fit within a single desktop/tablet/mobile viewport.
- No persistent rectangular click outline on F05 buttons.
- One food photograph/name/price per page remains within the page border.
- Four categories x four leaves retained; no reclassification.
- F01 master SHA: 7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37.
- F03 master SHA: 136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68.
- F05 master dotLottie SHA: 3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645.
- F07 V5 master SHA: a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b.

## 4. Browser QA
Chrome tested at 1818x828, 1440x900, 1024x768, 390x844 and 320x690. No page errors or 4xx asset requests; no horizontal overflow; F05 book fits all five sizes. F04 section players: zero. Original F04 checkout player: SVG rendered, 240 frames, no loop.

**V8 QA screenshots showing the old flower-like mask and F04 editorial section are superseded.** Use owner-v9 screenshots for the current creative review.

Do not promote or deploy until expressly directed by the owner.