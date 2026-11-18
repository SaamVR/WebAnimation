# ZESTRY — Book a Table modal: owner-approved direction, implementation and QA

**Date:** 2026-11-19 (Bangladesh local)  
**Repository:** `SaamVR/WebAnimation`  
**Review PR:** [#141](https://github.com/SaamVR/WebAnimation/pull/141)  
**Feature branch:** `feat/zestry-visible-forward-loops-20261119`  
**Staging integration target:** `deploy/zestry-v3-render-review-20261116`  
**Existing review URL:** https://zestry-v3-restaurant-review-20261117.onrender.com/  
**Deployment:** NOT AUTHORIZED; do not deploy or create another Render service.

## Owner visual direction

The owner supplied a screenshot of the old "Request a table" modal, asked to remove overlapping Date/Time and Guests/Name fields, to add breathing space, use the website's dark red/yellow-orange, place a perpetually running native table reservation animation at top-right or bottom-right, and make the simulation notice smaller directly beneath the heading. The owner accepted the **top-right and yellow-orange accent** treatment before implementation.

## Implemented (only in existing site archive)

- Used established ZESTRY colors `--red:#c3282d` and `--yellow:#ffd24b`, with cream form body and yellow request CTA.
- Header has "Request a table", the original precise simulated-reservation disclosure in a readable smaller font immediately beneath, a 44px close control, and the original F07 960×720 Lottie in a rounded yellow top-right panel.
- Fixed the underlying form overlap: `minmax(0,1fr)` two-column grid, `min-width:0`, `box-sizing:border-box`, full-width inputs/selects, 22px desktop horizontal gap, 21px row gap, and minimum 54px controls. Mobile forms stack into one column with an appropriately scrollable accessible dialog.
- Calls native `play('f07', ...)` when the simulated reservation dialog is opened; the already-tested shared viewport controller enforces forward repeat while modal visible, pause when modal closes or tab hidden, and reduced-motion pause.
- Modal dialog transition cleans up previously mounted modal animations before replacing content; prevents older booking/confirmation animation instances rendering after a new dialog opens.
- Retained all input names, options, validation, accessible close and original simulated submission, along with F05 book, F04 checkout, F01/F02 owner artwork and other project boundaries.

## Source integrity

Only `index.html` inside the original 59-entry ZIP was changed. All other entries were compared by SHA-256. Critical untouched original JSONs:

- **F01 Pasta Bowl V4:** `7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37`
- **F02 chef full 360:** `e48ae2126de66a2e60098156f6403fae797fb89c04168654d6232fbc517406fa`
- **F07 reservation:** `a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b`

## Real-browser acceptance

Passing GitHub Actions: https://github.com/SaamVR/WebAnimation/actions/runs/44395015733

- **Reservation UI QA:** `66/66 PASS`, machine report `docs/qa/owner-reservation-modal-20261119/PR141_RESERVATION_MODAL_QA.json`. Real Chromium desktop 1600×900, iPad 1024×768, mobile 390×844, compact 320×690 and reduced-motion contexts.
- **Full previous motion regression:** `63/63 PASS`, report `docs/qa/owner-visible-loops-20261119/PR141_VISIBLE_LOOP_QA.json`.
- Browser checks covered: no input overlap, helper position & typography, art/header/close collisions, mobile column stacking and horizontal overflow, real F07 replay and pause, closing/reopening dialog without duplicated players, simulated booking confirmation, reduced motion, absence of JS errors/404s or POST requests.
- Screenshots and native browser videos retained for 30 days in GitHub Actions artifact **`zestry-pr141-reservation-refinement-review`** on the passing run.

## Release next steps

1. Review owner's **new visual treatment** using screenshots from the passing Actions artifact (technical QA is not owner creative approval).
2. Merge PR #141 into the existing staging integration branch when ready, preserving unrelated projects; no new preview site.
3. Deploy **only after explicit owner permission**, in place on existing Render service `srv-dbtkitifngtc73cua2p0`.
4. Verify actual live SHA, F01/F02/F07 asset hashes, booking overlay geometry and F07 playback at desktop/mobile widths. Do not label merged source live until confirmed on Render.

## Owner follow-up — marked wide reservation illustration (2026-11-19)

The owner approved the modal design but identified unused space within the red header with a green rectangular outline. The subsequent direction was to **expand the original F07 reservation animation from the small corner tile into a wide rectangular panel occupying that marked header region**. This request updates container geometry only; it does not authorize altering, replacing, cropping, or rescripting the original F07 artwork.

Implemented on PR #141:
- Desktop and iPad: original F07 Lottie in a **356×146 px** wide yellow panel (aspect ratio ≈2.44:1), next to the heading and below/left of the close button, uncropped via the original Lottie \`preserveAspectRatio: xMidYMid meet\`.
- Mobile 390px: **132×74 px** landscape panel; compact 320px: **104×60 px**; responsive text, close affordance, and vertically stacked form remain intact.
- Native forward looping still runs only with the modal visible and stops when closed or offscreen; reduced-motion remains respected.
- Original F07 source SHA-256 remains \`a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b\`.

**Latest browser acceptance:** https://github.com/SaamVR/WebAnimation/actions/runs/44399573955 — reservation/modal **71/71 PASS**, full independent F01–F07/F04/F05 regression **63/63 PASS**, on desktop, iPad, mobile, compact screen and reduced-motion. Video and screenshot artifact: \`zestry-pr141-wide-reservation-panel-qa\`. The ZIP patcher edits only \`index.html\`; original Lottie JSON files are byte-identical.

**Release governance unchanged:** PR #141 stays within \`projects/restaurant-demo/\`; no merge/deploy without owner authorization and in-place release controls. The screenshot is a native browser rendering. Final owner visual review can proceed before staging deployment.
