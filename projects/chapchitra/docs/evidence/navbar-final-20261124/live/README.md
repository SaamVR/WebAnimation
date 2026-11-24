# CHAPCHITRA — Final navbar owner screenshot corrections (LIVE STAGING)

**Exact deployed staging SHA:** `be087dbeae8cd2590ace88cf7828f43150ec4398`
**Existing Render deployment:** `dep-dc2ufh8ae00c73fktbdg`
**Verified staging URL:** https://chapchitra-webanimation.onrender.com/
**Proof recorded:** 2026-11-24T20:04:44.998405+00:00 UTC
**Source PR:** https://github.com/SaamVR/WebAnimation/pull/164
**Production/main:** untouched

## Unmodified public website — independent real-browser acceptance

- [Navbar QA matrix](live-qa.json): **260/260 PASS**, 24 real Chromium/WebKit profiles × 320/375/390/430/834/1440px × dark/light. Exact 36px Cream circles on all four desktop/tablet icon action controls with 44px targets; closed mobile original illustrated toggle, plain 44px hamburger, Search and Bag; expanded full-height menu with centered original CHAPCHITRA SVG, five original valid page links, Favorites/Account, focus/inert/Escape, menu-theme controls, original SVG artwork and no overflow.
- [Portrait C02 matrix](c02-live-matrix.json): **80/80 PASS** across 16 Chromium/WebKit phone widths/themes; vertical organic source vector full cover, first-paint continuity and Walnut/Gallery White backings preserved while navigating Home→Shop from the new menu.
- [C03/C04/C08 smoke report](live-cseries-smoke.json): **19/19 PASS** original fly-to-bag, C04 pagination stamps and C08 logo hover on desktop Chromium and mobile WebKit.
- [Horizontal C02 regression](live-horizontal-c02-final.json): **10/10 PASS** desktop/tablet unchanged original horizontal C02.
- **50 real live-browser PNG screenshots** and [original-browser light/dark menu/C02 MP4](CHAPCHITRA_Navbar_Final_LIVE_Light_Dark_390x844.mp4), actual 390×844 Chromium sessions concatenated with an ordinary cut. Video SHA256 `0fef1b5fdd9a907283fa3f9fd17fe69bf1c47a0dcfe914a16acd9c48fad25ef8`.
- All source HTML/CSS/JS/image requests came from the **unmodified public Render website**. These are **not candidate-intercepted previews**; those are recorded in the sibling candidate folder.
- [Raw first-pass QA report](live-qa-first-pass.json) contained one WebKit 390px/light transient **29px initial overflow** reading. [Five independent identical live reloads](webkit-390-light-overflow-investigation.json) measured **0px overflow both initially and after settlement**; the final [full matrix](live-qa.json) measures only after fonts and two animation frames. The first anomaly is retained, not concealed.
- [Original C02 live first-pass report](c02-live-first-pass.json) returned **78/80**: a WebKit 320px dark page-overflow sample of 95px, and an anomalous 390px dark first-paint delta of 18,072px. Neither reproduced in [six direct-link replays](direct-c02-retest.json) or the six menu→Shop replays documented in [the controlled study](menu-versus-direct-c02.json); the twelve targeted replays had approximately 0.003px first-paint offsets and 0px settled overflow. The original failures remain disclosed. The final full [portrait matrix](c02-live-matrix.json) is an independent subsequent rerun, not a retroactive overwrite of those observations.
- [Live JavaScript/CSS byte-verification report](live-assets-sha256.json): all four deployed source assets match the approved production-equivalent build SHA256 exactly.
- Owner artistic approval remains distinct from automated technical QA. Physical iPad testing not claimed.
