# CHAPCHITRA — Mobile Option A + C02 portrait vector ink QA

**Recorded 2026-11-24.** Real Playwright-controlled Chromium and WebKit browser captures at `320×844`, `375×844`, `390×844`, and `430×844`, in **light and dark themes**.

**Pre-deployment candidate**: visual evidence captured on the existing Render staging origin `https://chapchitra-webanimation.onrender.com` with candidate CSS and C02 JS/early-head injected as the browser loaded the page. These files are **not evidence that the candidate was already deployed**. Candidate development PRs: [navbar #159](https://github.com/SaamVR/WebAnimation/pull/159) and [C02 #161](https://github.com/SaamVR/WebAnimation/pull/161).

## Machine-readable QA evidence

- [mobile-final-qa.json](mobile-final-qa.json): **360/360 checks passed**, 16 browser / viewport / theme combinations (2 browsers × 4 widths × 2 themes); no JS errors reported in these scenarios.
- [hero-navbar-a11y-qa.json](hero-navbar-a11y-qa.json): **5/5** original-wordmark accessibility and keyboard-nav scenarios passed, including desktop/tablet Hero01 behavior.
- Each profile has **four screenshots** named `{chromium|webkit}-{320|375|390|430}-{dark|light}-{navbar|menu|vertical-progress|shop-arrived}.png`: closed navbar, expanded hamburger, a mid-ink frame, and the destination page after completion. The SVG wordmark is unchanged; portrait C02 uses the original owner's vector ink source and theme-specific Walnut/Gallery White derivative.

## Video evidence

- [CHAPCHITRA_Mobile_OptionA_C02_Vertical_Both_Themes_390x844.mp4](CHAPCHITRA_Mobile_OptionA_C02_Vertical_Both_Themes_390x844.mp4) — **16-second, 390×844 H.264 MP4**, one continuous recorded Chrome light + dark journey concatenated in post, showing menu + vertical C02 + destination page. Original Playwright screen recordings were captured live, not synthesized from stills. The two scenarios are separate recordings concatenated for review; the join is a cut, not an animation transition.

## Acceptance measured

- Option A: **Hamburger | centered original SVG | Search, Bag**, preserving full menu access; on dark, exactly 36px Cream circles for Hamburger, Search and Bag inside >=44px hit boxes.
- Original wordmark loads and stays centered on mobile Hero01; existing Hero01 hiding and accessibility preserved at tablet/desktop widths.
- Full mobile compositor viewport at completion; original organic brush edge, portrait direction **top→bottom**, correct Walnut in dark, original light backing in light; no repeated texture, no horizontal document overflow after layout settles; incoming prepaint transform delta <2px; navigation and reveal complete.
- The proof checks do not constitute physically measured animation frame-time jitter or independent verification on a physical iPad. Shared GitHub CI, staging SHA, and live browser re-verification are separate mandatory release gates.

**Reproduction context:** candidate C02 source commit `e464a8de874d6b7b8edf9fa423736e8b5d0b37ab`; navbar frozen desktop/tablet head `aa2eac953f62cfd714a170bd3d4df21800968111`. Desktop/tablet code and original SVG paths are not modified by C02.
