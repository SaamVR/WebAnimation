# CHAPCHITRA PR #154 — five-regression correction evidence
Date: 2026-11-23 (Bangladesh; browser captures continued into November 24 local)
Source: owner-written task + existing staging https://chapchitra-webanimation.onrender.com/
Candidate: `fix/chapchitra-five-regressions-20261123`; **DRAFT, NOT MERGED OR DEPLOYED**

## Review boundary
The owner mentioned five annotated screenshots and one recording, but they were **not accessible as attachments in this conversation**. All conclusions below are grounded in owner-written requirements, inspected repository source, and independent real-browser reproductions. Do NOT claim pixel-perfect match to inaccessible annotations.

Screenshots and videos were captured with actual Chromium and WebKit browser engines using the unchanged live staging origin, with **only the PR's exact CSS/JS assets and first-paint HTML fragment substituted by Playwright**. No hosting changes occurred. These are pre-merge candidate captures. iPad is WebKit emulation at 834px, **not physical iPad Safari**.

## Correction 1 — desktop viewport
- Prior live baseline: 1920×1080 Hero01 850px, other slides 540px; 1440×900 Hero01 718px / others 540px; 1366×768 Hero01 718px / others 540px. Split grid capped at 1160px.
- Scoped CSS at desktop widths >=1024px now uses actual viewport minus measured 34px announcement and 64/65px navbar height; all five slides fill the same height, visual half covers entire width, services remain below viewport. Global `.wrap` and all tablet/mobile constraints untouched.
- **PASS 242/242 browser assertions** across 1920×1080,1440×900,1366×768 and tablet WebKit 834×1112, in both light/dark. All 5 active slides verified per profile. Full 40 screenshot set is in ZIP.

## Correction 2 — dark navbar
- Four original illustrated Search, Favorites, Account and Bag icon SVGs unchanged, Cream `#F4EBE4` background ONLY on four dark action circles (including hover); theme toggle, logo and stamped bag remain unchanged.
- Browser sampled `rgb(244,235,228)` at actual header; no global palette changes, no SVG recolouring.

## Correction 3 — long SVG Add to Bag
- The long button used the approved SVG clip and 300ms reversible Graphite wipe, but its CSS hover selector explicitly excluded `[data-add-to-bag]`. Scoped CSS change re-enables hover only while not added, confirming or returning, preserving the existing pressed/confirmation timeline.
- **PASS 20/20 browser checks** for light/dark: original SVG ready, first/mid/final/reverse ink progress, ADDED, stamp 0→1, returned copy, C03 fly-to-bag flight observed and no JS errors. Original long-button source paths, the C03/C04 and long-button runtime untouched.

## Correction 4 — C02 dual backing
- Build inserts **one** exact source-derived organic silhouette under the **727 unchanged original green ink paths**; output 728 total paths per composed SVG. Light `#F6F7F5`, dark `#6E523F`, exact geometry identical apart from ONE fill token.
- Theme-correct SVG uses a single decoded surface throughout initial prepaint, cover, loading and reveal; full-cover readiness now validates the **correct theme** rather than hardcoded white. Preload is invalidated and warmed on theme change.
- **PASS 24/24 browser checks** across Chromium light/dark and WebKit dark. Evidence includes exact underprint-geometry comparison, recorded original CSS prepaint, outgoing cover, incoming reveal and post-navigation proof, and short light/dark review recordings.
- QA waits for the theme-specific SVG to complete decoding before insisting on animated navigation. Early-click native fallback remains the original safe behavior and is not a claimed animation failure.

## CI and delivery
- Source-integrity/native tests, C02 gate, C08 unchanged-motion Chromium/WebKit gate, and responsive combined-site browser regression [run #45232936901](https://github.com/SaamVR/WebAnimation/actions/runs/45232936901): **SUCCESS** at implementation SHA `006e371e89c8afe38e12a798bbb538d55fa62bf2`.
- Source branches, merged production and `main` untouched. Adding evidence will create an evidence-only commit with its own repeat CI run.
- **NEEDS OWNER VISUAL APPROVAL. Do not merge, deploy, or promote to production.**

## Evidence index
- `CHAPCHITRA_PR154_FULL_BROWSER_EVIDENCE.zip`: all browser captures and machine-readable reports for 8 hero profiles and Add/C02 flows.
- Selected individual PNGs: hero light/dark at each requested viewport; Add button idle→wipe→confirmation; C02 storyboards and destination screens.
- Short MP4s: `light-C02-8s-review.mp4`, `dark-C02-8s-review.mp4`, `light-C03-long-button-8s.mp4`.
- Structured reports: `hero-report.json`, `long-button-report.json`, `c02-report.json`.
