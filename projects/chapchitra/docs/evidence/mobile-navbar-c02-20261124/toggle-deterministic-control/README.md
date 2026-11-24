# CHAPCHITRA owner SVG theme toggle — independent live control audit

**Pre-C02 deployment, staging navbar-only SHA 6d6f8611327d7346190eba28597783c67491f759.** 2026-11-24.

The updated independent QA runs against the unmodified public Render site in desktop Chromium (1440), iPad WebKit (834), mobile Chromium (390 and 320), both themes. All 8 natural forward/reverse, rapid reversals, persistence and SVG palette/art assertions passed. All 8 real browser-rendered forward/reverse 150ms SVG midpoint pairs passed; source animation tick executed from a browser-only deterministic frame queue (no artwork mutation). Reduced-motion QA passed. 32 genuine browser screenshots, zero issues, and an uncut Chromium toggle recording are included.

The desktop/tablet 12px theme-dependent whole-navbar action-group offset was measured independently on the actual site; the original 96px Illustrator SVG does not change its position or scale relative to the 96px owner button. Production CSS was left untouched. See illustrated-toggle-qa.json.

These control results do not establish that vertical C02 is live. The C02 PR #161 fixes the independent QA to make midpoint captures deterministic across Chromium/WebKit.