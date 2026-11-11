# CHAPCHITRA — C02 Ink-Sweep Page Transition · Owner Review

**Status:** Implementation candidate; original creative concept approved, final motion/artwork **not yet creatively accepted**.

**Project:** `projects/chapchitra/` · **Render baseline:** `bdefd1d509a800a1537b03ae624156158fd784ed` · **Feature:** `feature/chapchitra-c02-ink-sweep-20261111`

## Approved interaction boundaries

- Entry route must be Home, via primary desktop/tablet navigation or mobile menu.
- Only Home → Shop, Artist's Edit, Journal, About Us is animated.
- Hero/editorial CTAs, Shop → Product Detail, Journal Story, cart, checkout, and other paths have native navigation without C02.
- Ctrl/Meta/Shift/Alt modified clicks, non-`_self` targets, downloads and cross-origin links remain native.
- The destination page awaits its actual application shell before the cover clears. A four-second **failure guard only** prevents a permanently obscured page; no artificial page-load delay occurs.
- One-time session ticket matches exact destination path and expires. Browser Back/forward resumes without an overlaid screen.
- Reduced-motion visitors use immediate native navigation. Links retain native keyboard activation, focus and history.
- No new animation runtime or external imagery; SVG silhouette and the Web Animations API are self-contained.

## Palette and proposed choreography

A restrained, rough-edged ink sheet moves left-to-right. Deep Forest `#172419` and Press Green `#293D2D` lead; Terracotta `#8A503B` is a restrained accent on the irregular ink edge. No large literal roller. Cover 310 ms + reveal 285 ms = **595 ms of programmed motion**, excluding actual page load. Source art remains a **review candidate**.

## Verification performed

- Pure Node tests: **4/4 pass** (approved four-route allowlist, exclusion cases, native link semantics, numbering independence).
- Direct asset build: **PASS**. Long SVG source geometry and worktable source asset integrity remain intact.
- Browser acceptance, **Google Chrome (Chromium) and Playwright WebKit**: **22/22 pass**, including four approved routes, browser Back, mid-sweep capture, Shop → Product exclusion, reduced-motion, mobile navigation, keyboard Enter and Artist's Edit entrypoint.
- Reproducible script: `node scripts/c02-browser-qa.cjs` against `npm run preview` (expects port 4272 or `C02_QA_ORIGIN` override).
- Browser evidence summary: `docs/c02-evidence/results.json`. PNG frames and WebM videos were captured on the local QA runner; not yet published as a hosted preview.
- Full `npm run check` on the Windows runner **is not green**: several legacy byte/string-sensitive SVG and CSS assertions fail on Windows line endings. Do not treat that run as a passing full-suite gate. A clean Linux CI run is still required.

## Isolation and release gate

- Only adds C02 module, four tests, one narrowly scoped app boot import/installer, the browser QA script, and review evidence/docs.
- Does not touch Artist's Edit worktable code, garment images, C01/C08 Lottie artwork, original Compact/Long SVG artwork, or THREADS.
- **No merge to `main`, no Render deploy, and no owner creative approval is claimed.**
- Independent visual critic must inspect motion edge, texture, entry/reveal continuity, tablet/mobile ergonomics and reduced-motion behavior before creative acceptance.

**Next gate:** Obtain an isolated browser-review preview, verify clean Linux CI and request owner visual acceptance of C02.