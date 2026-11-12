# Artist's Edit direct-to-worktable — rendered before/after evidence

**Scope:** Page entry layout only; no change to the T-shirt art, stage geometry, controls or animations.

## Actual browser screenshot comparisons

- [Desktop Chromium, 1440 × 900](desktop-comparison.svg)
- [iPad-sized WebKit, 834 × 1112](ipad-webkit-comparison.svg)
- [Phone WebKit, 390 × 844](mobile-webkit-comparison.svg)

Each comparison is a side-by-side of two **genuine automated browser screenshots**. The left frame is the previously deployed shared staging site at `ab9018d13a0ce2d1c5d9f1376e97b0456cc65d07`. The right frame is the same staging site with **only the candidate's `app.mjs`, `styles.css`, `worktable-studio.mjs`, and `worktable-studio.css`** substituted before the page loads. Screenshots were resized with aspect ratio preserved and JPEG encoded for compact GitHub review. No fake/redrawn UI was used. This is *premerge* source validation, not a claim that the candidate was already live.

| Viewport | Before: navbar bottom → frame top | After | Worktable frame before/after |
| --- | ---: | ---: | --- |
| Desktop Chromium 1440 × 900 | 72px | 0px | 1440 × 810px / unchanged |
| iPad WebKit 834 × 1112 | 72px | 0px | 834 × 469.1px / unchanged |
| Phone WebKit 390 × 844 | 56px | 0px | 390 × 693.3px / unchanged |
| Narrow phone Chromium 320 × 640 | 56px | 0px | 320 × 568.9px / unchanged |

## Browser acceptance

`scripts/perf/artist-direct-entry-qa.cjs`: **296 passed / 0 failed**, no JavaScript errors, no failed HTTP responses.

It verifies one visually hidden semantic `<h1>Artist's Edit</h1>`, no route/studio heading section, no async-mount spacer, `0px` navigation-to-frame gap, existing desktop and mobile ratios, direct URL, navbar link, homepage illustrated editorial banner, footer, Back and Forward history, and existing five-button phone navigation.

The shared staging GitHub Actions gate runs the same test against **compiled candidate output** through the existing Artist's Edit mobile browser test runner. Physical iPad/iPhone Safari not tested.

No C02, other motion, navbar/announcement lifecycle, print placement, pricing or upload implementation changed.
