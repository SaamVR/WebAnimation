# CHAPCHITRA C03 — local browser evidence (NOT creatively approved)

Prototype derived from the approved T02 motion behavior, adapted for CHAPCHITRA's
existing sample garment and sticky-header SVG bag. The displayed product stays
in place. A temporary transparent SVG cutout flies from lower-right toward the
real bag and shrinks; the bag and counter respond on impact.

## Local recordings — no hosted website

- [Desktop Chromium 1440×900 WebM](c03-desktop-chromium.webm)
- [Phone Chromium 390×844 WebM](c03-mobile-chromium.webm)

### Browser-frame samples

| Viewport | Before | In flight | Bag approach | Bag catch |
| --- | --- | --- | --- | --- |
| Desktop Chromium | [PNG](desktop-chromium-before.png) | [PNG](desktop-chromium-mid-flight.png) | [PNG](desktop-chromium-bag-approach.png) | [PNG](desktop-chromium-bag-catch.png) |
| Mobile Chromium | [PNG](mobile-chromium-before.png) | [PNG](mobile-chromium-mid-flight.png) | [PNG](mobile-chromium-bag-approach.png) | [PNG](mobile-chromium-bag-catch.png) |

These are **real local Playwright browser capture artifacts**, not generated
mockups and not footage from the historical THREADS site. Their recording source
is the local feature implementation with mobile camera reveal, prior to a
later refinement of QA wait-for-completion assertions (not a change to creative
choreography).

## Source and verification boundaries

- Initial local browser matrix covered Chromium desktop, Chromium 390/320,
  WebKit iPad/phone, and reduced motion. It reported 64 passing assertions,
  3 premature cleanup-timing assertions, 0 JavaScript errors, and 0 failed
  HTTP responses. The tests were then corrected to wait for detached
  overlays after the animated camera return. A subsequent full run could not
  launch new Chromium due to the Linux runner's memory/swap pressure;
  do **not** misrepresent it as a fully passing rerun.
- Focused source/geometry tests: **4/4 passed** after camera-reveal fix.
- Build: **passed** on Node 22.23.2. Earlier Node 18 full suite is not a
  valid environment check. Entire native suite under Node 22 was interrupted
  on the constrained runner and needs existing GitHub Actions CI.
- The printed bag uses existing sessionStorage and a 99-item clamp. C03 is
  visual-only and runs only on successful Product Detail increments.
- Physical iPad/iPhone Safari was not used. WebKit automation was used in the
  first matrix; any remaining device-specific issues require owner QA.
- No hosted deployment was made; no staging branch or THREADS source changed.

**C03 status: PROTOTYPE / OWNER CREATIVE REVIEW PENDING.**
