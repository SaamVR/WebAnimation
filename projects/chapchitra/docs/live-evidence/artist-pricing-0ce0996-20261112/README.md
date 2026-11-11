# CHAPCHITRA — Artist's Edit temporary pricing visual acceptance

**Date:** 2026-11-12
**Implementation:** 0ce0996c37e58ce7fadd3974c2a9601b4328667d
**Draft PR:** https://github.com/SaamVR/WebAnimation/pull/84
**Vercel preview:** https://chapchitra-motion-demo-6xnagfryi-samvrc.vercel.app/artists-edit/
**Release type:** Isolated preview; no shared Render or main change.

## Screenshots

- [Desktop estimate + expandable price breakdown](desktop-pricing.png)
- [iPad-viewport WebKit estimate](ipad-webkit-pricing.png)
- [Mobile estimate and full-width demo-bag action](mobile-pricing.png)

The QA illustration file is a generated test PNG, not a real customer's artwork.

## Verified tests

- Full source suite: 163 / 163 passed; build PASS.
- Pricing calculations and 5 requested owner examples: PASS.
- Public pricing editor + demo bag in desktop Chromium, iPad-sized WebKit and mobile Chromium: 54 / 54 PASS; 0 JavaScript exceptions and 0 failed requests. [Machine-readable report](public-pricing-report.json).
- Public two-sided independent artwork editor preservation: 54 / 54 PASS. [Report](public-two-sided-report.json).
- Public normal-flow Artist's Edit navbar and sticky navigation on all other pages: 90 / 90 PASS. [Report](public-navbar-report.json).
- Approved image assets unchanged: resolved a clean-preview 404 by correcting only two legacy HTML preload filenames to existing approved WebPs. No asset data edits.
- Existing editor layout regression: 137 / 137 PASS locally.

## Privacy and release boundary

Client-only estimate. The demo bag stores configuration metadata but **not artwork image bytes or a fulfillment-ready order**. A real order requires a separately approved secure upload and server-side validation/repricing system.

These are automated desktop/iPad-viewport/mobile browser checks. **No physical iPad hardware acceptance** is claimed. Owner visual approval is required before merging or changing the shared Render review.
