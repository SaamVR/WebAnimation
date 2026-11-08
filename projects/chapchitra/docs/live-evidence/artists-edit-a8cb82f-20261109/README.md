# CHAPCHITRA Artist's Edit — Public Integration Evidence (2026-11-09)

**Live commit:** `a8cb82ff6fc1e8b9997854a55ad6bb0cd06525f6`
**Source donor:** PR #72 / `7545ef3f9964b9ce6820979f89610ecfdbbba7cd`
**Previous public review:** `49bdc3ddc628ce14961d5bef274e39b3d0d6b1eb`
**Render deploy:** `dep-dboe3r8ae00c739kic4g` — LIVE
**Source-pinned public URL:** https://chapchitra-webanimation.onrender.com/artists-edit/review/a8cb82ff6fc1e8b9997854a55ad6bb0cd06525f6/

## Independent source and deployment QA

- PR #72 cherry-picked cleanly as one patch-equivalent commit; 31 changed files, all under `projects/chapchitra/`.
- The overlapping Artist's Edit baseline files matched PR #69 by exact Git blob hash before integration.
- C01/C08 motion and logo source files were excluded from the patch; no unrelated projects changed.
- Combined Windows-runner Node tests: **129/129 PASS**, including inherited C01/C08 tests. Initial Git Windows line-ending conversion broke exact CSS/SVG text comparisons; the test working tree was normalized to the committed blob contents. No C01/C08 source changes were committed.
- Build: **PASS**.
- Local Chromium desktop, WebKit tablet and Chromium mobile focused editor checks: **137/137 PASS**.
- Local Chrome touch-packet QA: **14/14 PASS**. Local settled-state WebKit paint-pot checks: **6/6 PASS**.
- **Public source-pinned Render** browser checks: **137/137 PASS**.
- **Public source-pinned Render** real Chrome touch-packet checks: **14/14 PASS**. Public settled-state WebKit checks: **6/6 PASS**.
- **Public homepage** C08 animated hero SVG, mounted navbar and hover replay, static footer, four rendered C01 Lotties, same-origin HTTP requests and JS page errors: **PASS**.

## Public deployment visual evidence

- [Desktop with Resize tool and four corner handles](./live-artist-desktop-resize.png)
- [Desktop A3 frame before artwork upload](./live-artist-guide-a3.png)
- [Desktop clockwise 90 degree rotation](./live-artist-rotation-90.png)
- [Touch tablet 834px](./live-artist-tablet-touch.png)
- [Touch mobile 390px](./live-artist-mobile-touch.png)
- [Homepage C08 hero](./live-homepage-c08-hero-desktop.png)
- [Homepage C01 benefits](./live-homepage-c01-benefits-desktop.png)
- [Desktop full artwork workflow recording](./live-desktop-workflow.webm)
- [Tablet WebKit workflow recording](./live-tablet-workflow.webm)
- [Mobile Chrome workflow recording](./live-mobile-workflow.webm)

## Machine-readable evidence

- [Public editor QA](./live-editor-qa.json)
- [Public touch QA](./live-touch-qa.json)
- [Public WebKit selected state](./live-selected-qa.json)
- [Public homepage C01/C08 QA](./live-homepage-qa.json)

## Performance boundary

The previously committed PR #72 **paired simulated** comparison against the approved PR #69 baseline recorded mobile 390px 4Mbps **2.653s → 2.768s (+115ms)** and desktop 1440px 10Mbps **1.889s → 1.811s (-78ms)**, with unchanged image request counts and bytes. Those historical same-runner results are **not a new end-to-end benchmark against the combined Render site**. Browser tests above verify runtime functionality, not a fresh production performance measurement.

## Owner acceptance gate

This is **technical PASS / awaiting owner visual acceptance**, not final brand approval. No physical iPad test was performed; browsers emulate touch packets. Relative A3/A4 outlines are *visual print guides*, not manufacturer-certified cut/print dimensions. No draft PR was merged; no main branch was modified.
