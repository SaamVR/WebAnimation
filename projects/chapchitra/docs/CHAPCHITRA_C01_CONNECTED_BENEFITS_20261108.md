# CHAPCHITRA — C01 Connected Service Benefits · Review handoff

**Status:** DRAFT / OWNER VISUAL APPROVAL REQUIRED. No merge, no production publishing.

**Repository:** `SaamVR/WebAnimation`, `projects/chapchitra` only.
**Base:** rich-fabric PR #66 at `631d33958d931b999e0305411204aa9b59141fd5`.
**Review branch:** `feature/chapchitra-c01-approved-connected-benefits-20261108`.
**Review surface:** CHAPCHITRA homepage directly beneath the hero. No other page changes.

## Source locks and asset audit

All four **original** author-approved Lottie JSON files are self-hosted unchanged at `src/assets/c01/`. No frame/keyframe or palette modifications; Delivery is the **full-fidelity updated V2 truck**, not the separately attached older V1 nor the lower-resolution logo optimization.

| Animation | Source JSON SHA-256 | Dimensions / FPS | Frames / seconds |
|---|---|---|---|
| 01 Custom Print Care V4 | `d786771616aa3cabd84587a2790c25a9217b75e74853d57ca3bffdf237b0bd65` | 512×512 / 60 | 135 / 2.25 |
| 02 Easy Payment V2 | `d2a469545cf8e934779f8d82037b7201eb9d7023dfb5e68259be56166231df96` | 512×512 / 60 | 135 / 2.25 |
| 03 Delivery updated V2 | `b90cc633021160a8aa8b68658d34114d212c597069b057ccefd8f3a71c407f0c` | 512×512 / 60 | 120 / 2.00 |
| 04 Order Support V2 | `af1d3bb36b8769efb82bdc94d170551de33e2f8cd63ee2ce2f3684f10afe2a29` | 512×512 / 60 | 126 / 2.10 |

Official `lottie-web` 5.13.0 is pinned and self-hosted as `src/motion/c01/vendor/lottie.min.js` with its MIT license. Original JSON is mounted through the official SVG renderer; no CDN or independent Lottie timelines.

Static WebP posters were **captured from the original official Lottie SVG final frames** at 512px. They appear immediately and remain for reduced-motion or resource failure. Static preview rings are CSS only and do not animate.

## LOCKED copy

1. **Custom Print Care** — Thoughtful printing with room for customization.
2. **Easy Payment** — Easy checkout with multiple payment methods.
3. **Delivery** — Shipping updates with parcel delivery.
4. **Order Support** — Support for print, artwork, sizing, and ordering.

These four literal title/subtitle pairs are asserted by automated tests; no alternative copy is substituted.

## Authored V3 cue sheet — 10.27 seconds

- Icon 01: 0.00–2.25s; connector 01: 2.25–2.64s.
- Icon 02: 2.64–4.89s; connector 02: 4.89–5.28s.
- Icon 03: 5.28–7.28s; connector 03: 7.28–7.67s.
- Icon 04: 7.67–9.77s; completed still: 9.77–10.27s.

The three connector paths, beige guide, Press Green stroke, Terracotta pulse, curved horizontal/vertical geometry, and icon visibility gating use the V3 authored source timing exactly (390ms per connector; 140ms following-icon reveal). No retiming, animations on frames, spinning, parallax, pinned scroll, independent loops, new colors, or added layouts elsewhere.

One requestAnimationFrame clock maps absolute elapsed time to the 4 frozen 60fps Lottie playheads and 3 connector stroke positions. The controller stops on `IntersectionObserver` exit and document visibility change, resumes at the held position, loops after exactly 10.27 seconds, and switches to the fully assembled final static pose when reduced motion is selected. All decorative SVGs and posters are hidden from accessibility tree; service copy remains normal semantic text.

## Verification results

**Chromium**: **21/21 checks PASS** — exact text, official SVG renderer, 3 paths, complete cycle, all 4 visibility cues, 3 half-progress connector measurements, 1280/834/430/320px layouts, no overflow, offscreen pause/resume, static reduced motion, synchronized browser video. Zero page JS errors in final run.

**Linux WebKit**: **9/9 checks PASS** — full official SVG renderer at 1280/834/430/320px, final composition with aligned connectors, reduced-motion static icons; zero page exceptions. Browser emulation only: **not a physical iPad Safari certification**.

**Repository source validation**: **97/97 automated Node.js v22 tests PASS**, including byte-for-byte source hash locks and original 43 worktable master artworks verified by existing build. Artist's Edit is unchanged.

Evidence:
- `docs/c01-evidence/c01-synchronized-lottie-playback.webm` — actual official Lottie playback on local website in Chromium.
- `docs/c01-evidence/c01-desktop-1280.png` and `c01-430.png`, `c01-320.png` — full final pose and responsive layout.
- `docs/c01-evidence/c01-webkit-430.png` — independent Linux WebKit final pose.
- `docs/c01-evidence/c01-reduced-430.png` — static presentation.
- `docs/c01-evidence/c01-browser-qa-report.json`, `c01-webkit-qa-report.json`, `c01-performance-report.json` — machine-readable results.

Reproduce local checks after `npm ci`: `node --test tests/c01-connected-benefits.test.mjs`, `npm run check`, `npm run build`. Run `python3 -m http.server 19118 --directory src` separately, then `C01_CHROMIUM=<browser executable> node scripts/c01-generate-review.cjs`; Linux WebKit check: `C01_WEBKIT=<installed pw_run.sh> node scripts/c01-webkit-qa.cjs`.

## Performance tradeoff and mitigations

The original Delivery V2 JSON embeds a **1,639,254-byte PNG** logo (its raster source); the original composition is approximately 2.27 MB of JSON. Replacing it with the supplied `WEB_OPTIMIZED` candidate would reduce bytes but changes the logo's source resolution, so **the optimized version was deliberately NOT used** without owner art sign-off.

The controller delays loading the Lottie player and all four full-fidelity JSON compositions until the benefit section enters the viewport. Only four small final-frame WebP posters load before then; they provide meaningful content before the motion system is ready. Lottie is not imported on Artist's Edit or other pages. The self-hosted Lottie library adds roughly 306 KB uncompressed; the 4 unmodified JSON assets add roughly 3.04 MB raw.

A controlled, single-run **local Python HTTP server** comparison under simulated **4 Mbps / 70ms RTT / 4× CPU slowdown / 390×844 Chromium** gave:
- Existing PR #66 baseline DOMContentLoaded wall time: **1,233ms**; C01 candidate: **1,146ms** (not statistically meaningful; do not infer improved LCP).
- Initial resource transfer after 1.5s: baseline **585,962 B**; C01 **707,110 B** (about **121 KB additional**, primarily posters).
- After scrolling to C01, complete official Lottie set ready in **9,441ms** cold under the same emulation. The static content is present before motion readiness.
- This local server **does not use gzip/Brotli**, so byte transfer is not directly comparable to the public Render CDN. No physical-device performance claims. The 9.44s simulated cold-start is a review caveat; further artwork-preserving optimization requires separate owner decision.

## Release boundary

Review-only candidate. Before presentation: commit, draft PR, CI validation, deploy to the **existing isolated Render review service** only (autoDeploy branch `deploy/chapchitra-render-review`), independently verify exact source SHA + public browser playback. **STOP** for owner creative approval. No automatic merge/publish to production, no changes to other homepage animations, Artist's Edit, THREADS, EcomCMS, or repository root.
