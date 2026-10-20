# THREADS T03 Stage A — layered flap, live Render QA

**Review status: live and technically verified, awaiting owner creative approval.**
No Stage B products or offers, and no T04 work.

## Live preview
https://threads-t03-layered-flap-20261020.onrender.com/#deal

Separate new Render static site `srv-dbbd2gbrjlhs73dqsdag` in My Workspace. First deploy `dep-dbbd2grrjlhs73dqsecg`, **LIVE**, pinned to application source `6ef7390e2d44cb2383bc34f7cb35571d6d4c9112`. Build plan static starter, auto-deploy disabled; no paid compute enabled. Does not replace the previous T03 experimental preview or approved T01/T02 services.

## Actual Chrome browser recordings taken from LIVE Render
- [Desktop scroll / hover open / leave close / repeated click and keyboard interaction (13.56s MP4)](desktop-open-close-review.mp4)
- [Mobile/touch-sized viewport open/close/reversal (15.60s MP4)](mobile-open-close-review.mp4)
- [Original closed state](desktop-rest.png)
- [Full open state](desktop-open.png)
- [Mid-flap transition](desktop-mid.png)
- [Mobile open state](mobile-open.png)
- [Machine-readable browser checks](QA-browser.json)
- [T02 storefront / cart / checkout regression](integration-regression.json)

## Implementation
Seven new uploaded originals are preserved byte-for-byte at `site/threads/assets/t03-layer-*.png`, each 2048 × 1572 and transparent. Only empty margins are cropped into identical 1085 × 845 registered viewport sprites; no nontransparent source pixels are removed (enforced by generator), no painted replacement illustrations. Exact original closed plate stays visible at rest and throughout animation; unchanged cap, sneaker and bottle. The base body, rim and interior become visible under the opening flap.

The flap exterior includes both teal straps and shares one GSAP 3D transform wrapper with both buckle layers; they move in sync, never disengage. Interior and complete orange underside reveal inside this sequence. IntersectionObserver makes one subtle flap wiggle when the Deal section enters viewport. Mouse hover opens, leave closes; click/tap pins/unpins; native keyboard click and Escape are supported. GSAP reverses in progress on repeated activation, reduced-motion switches endpoints immediately. Existing "Shop the Deals" remains a link to `/search/`, not hijacked.

## Testing
- 37/37 existing source/contract checks passed.
- 25/25 actual deployed Chrome Stage A checks passed: desktop/mobile/reduced motion, hover and leave, open/close, repeated and mid-flight keyboard reversal, asset integrity and CTA preserved, T01 spotlight.
- 17/17 deployed Chrome additional storefront checks passed: actual product media, add-to-cart, cart count, variant limit, cart navigation, checkout, T01.
- Zero browser JavaScript exceptions.
- T01 source Git blob unchanged: `46c96964f6757b3a99f9e7ee873fdffaca1f55ff`
- T02 source Git blob unchanged: `f4813a8e6bb01d03f51a2a2b487d068fd95d719b`
- Previous T03 recoverable via `checkpoint/threads-t03-stage-a-previous-20261019`.

No approval or merge should be inferred from automated QA. Stage A remains ready for owner review only.
