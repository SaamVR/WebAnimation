# CHAPCHITRA — Staging Release Candidate, November 13, 2026

## Source PRs and explicit approval

- Artist's Edit loading optimization: PR #106, source head `9ebf545924c224608b717f9d583a88f1c1fd582b`.
- Footer redesign: PR #108, source head `60eb91563fdfe8b23f1becf7b5e9d0d1213ef213`.
- User authorized a deployed **staging preview** on November 13, 2026, using the pre-existing single CHAPCHITRA website, not production.
- Integration PR #109 collects the two source histories into one release. Candidate tree before this documentation-only note: `5c7dc29dce2b962fe1b1eec8d8766a8a61459cd5`.

## Scope

Artist's Edit remains architecturally intact: layout, responsive garment positions, A3/A4 tools, prices, front/back controls and original PNG masters unchanged. Parallel early release-manifest fetch/renderer import, version-safe manifest caching, appropriate responsive image preload and deferred noncritical hydration were measured via cold/warm Chromium/WebKit CI.

The owner-requested footer keeps the existing dark olive background, original CHAPCHITRA logo, tagline and copyright, removes provisional/demo text and old Shop/account/bag/checkout/newsletter links, adds Discover with actual routes, displays Help and social labels without invented destinations, and leaves a blank illustration space. Footer browser QA: 232/232 checks passed; native tests: 226/226 passed.

## Important release exclusions and QA caveat

The user's mentioned **scooter/street artwork revision is not independently identified in any committed CHAPCHITRA source branch**. Do not represent this candidate as containing newly supplied artwork; preserve the currently integrated street illustration until its exact asset/commit becomes available.

The combined technical browser gate has intermittently failed the **existing C03 iPad WebKit scroll/resize cancellation test** despite the tested source not modifying C03 motion implementation. The original site-wide C03 was previously approved and is already on live staging. Refer C03 defects to Animation Integration; Main Website must not alter that lane's code. This staging release is for owner review and is not production approval.

## Release procedure

Merge into the existing `deploy/chapchitra-render-review` branch **once** only, after review of current CI and regression state. Existing Render static service: `srv-dbmu3ubbc2fs73auj78g`; URL `https://chapchitra-webanimation.onrender.com/`. Verify new live deploy SHA and public page. Do not create a new Render/Vercel service, use other projects, or merge into `main`.
