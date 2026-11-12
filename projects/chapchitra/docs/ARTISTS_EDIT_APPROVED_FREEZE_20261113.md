# CHAPCHITRA — Artist's Edit APPROVED / FEATURE-FROZEN baseline

**Owner decision:** November 13, 2026. Desktop, iPad and mobile Artist's Edit are **CREATIVE APPROVED**. This is an approval of the Artist's Edit component, **not production-release authorization**.

## Authoritative integration inputs

- Prior shared staging source: `ab9018d13a0ce2d1c5d9f1376e97b0456cc65d07`.
- Approved direct-to-worktable route, PR [#99](https://github.com/SaamVR/WebAnimation/pull/99): `f251446292d09e00559927b22772efaf4e07ccfa`.
- Approved final portrait decoration, PR [#100](https://github.com/SaamVR/WebAnimation/pull/100): `265621da29811991a19785b73f4bfd07ec504ab2`.
- Combined approved source merge commit: `67836099b5fa7a08ddf868385788cc7cd09adfc6`, containing PR99 and PR100 as actual Git parents. Its single integration adjustment reconciles the CSS: retain PR99's visually hidden heading and no-gap route, together with PR100's phone-only `left:67.5%;top:4.5%` live Total-tag position.
- **Immutable release identifier:** `chapchitra-artists-edit-approved-staging-20261113`, to be created on the *exact verified shared-staging Git commit*. The tag's commit (not an unverified build timestamp) is the canonical final freeze revision.
- Shared branch: `deploy/chapchitra-render-review`. Existing Render service: `srv-dbmu3ubbc2fs73auj78g`, URL `https://chapchitra-webanimation.onrender.com/artists-edit/`.

## Protected application boundaries — no new design or functionality

The entire approved Artist's Edit page is feature-frozen. Preserve source and observed behavior of:

1. `src/app.mjs`, `src/styles.css`: worktable-first entry below existing navigation with exactly one visually hidden semantic `<h1>Artist's Edit</h1>`; no visible introduction, placeholder gap, scroll-to, automatic viewport scaling or route animation. Existing Home/Shop/Journal/About and announcement/navigation behavior are unaffected.
2. `src/worktable-stage.mjs`, `src/worktable-studio.mjs`, `src/worktable-studio.css`, `src/worktable-mobile.mjs`: approved original illustrated scene, full-size desktop/iPad **16:9**, phone **9:16**, garment/worker positions, mirrored inward lamp, pencil, brush, color swatches, plant, jar, dynamic price tag, approved 80% Terracotta compact front/back control, five mobile buttons with selected glow, centered popups, presentation-only automatic artwork zoom and Done restore.
3. `src/worktable-print-placement.mjs` and related per-garment calibration: fixed torso A3 outer safe boundary, correctly proportioned movable A4 within A3; artwork boundaries constrain drag/scale/rotation including rotated corners. Uniform garment-relative coordinate system, clipping is secondary protection. Front and back artwork are independent and persistent across view switching.
4. Original garment color masks, shading, garment styles (Regular Tee, Drop Shoulder, Full Sleeve, Hoodie), size selections, upload/remove/reset controls, edit-tool handles, invoice, printed-side price calculation, illustrated Total tag, and demo-bag connection. Existing approved pricing: base **৳450 / ৳550 / ৳650 / ৳850**; A4 **৳100 per printed side**; A3 **৳200 per printed side**. No storefront transaction is authorized.
5. Original independent artwork and responsive controls. No crop/stretch/regeneration of source assets, new persistent site service, speculative animation, new commerce flow, or changes in unrelated projects.
6. **Exclusive animation ownership:** C02 ink swipe / adaptive loading, other C-series SVG/GSAP/Lottie integrations are owned by their separate development stream; C05 standalone Lottie prototyping is independent. No unfinished animation is part of this freeze.

Future changes require a **new explicit owner request**, scoped feature PR, adversarial visual review and same regression gates. Creative approval and staging deployment are NOT equivalent to production release.

## Mandatory regression gates for future shared staging integration

- Native source/build tests and existing GitHub Actions three-context ruleset; build actual combined commit, not only an isolated PR preview.
- Desktop Chromium (1440), iPad WebKit (834), mobile Chromium (320/360/375/390/430), mobile WebKit (375/390); no uncaught errors or failed responses.
- Direct URL, menu links/banner, browser Back/Forward: frame immediately beneath navbar; one hidden h1; same stage dimensions, no overflow or unsolicited scroll/scale.
- Garment/style/color/size selections and color mask/shading; pricing/invoice/Total and bag count; uploads and edit tools.
- A3 fixed outer safe region, A4 frame movement at every edge/corner, artwork transform containment (rotation included), switch print-size and garment, independent front/back states, front/back flip behavior and 44px touch targets.
- Mobile five-button navigation/popup containment and active glow, automatic zoom/Done without changing print coordinates, iPad gesture rendering.
- Preserve valid existing cross-route and animation compatibility gates. Return animation-specific defects to its exclusive lane; do not modify animation internals.

## Stage verification record

The exact frozen integration revision is the immutable commit resolved by the annotated tag above **after** successful combined CI and after the existing Render service confirms `LIVE` with that same Git commit. Release integrators must record GitHub Actions run and Render deploy identifiers in the PR handoff. Until then, this file is an approved source contract—not a claim that deployment is complete.

**Status classification:** `CREATIVE APPROVED` now; `INTEGRATED` only after GitHub protected-branch and Render commit verification; `PRODUCTION RELEASE NOT AUTHORIZED`.
