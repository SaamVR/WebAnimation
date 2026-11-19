# C04 Ink-stamp number impression — feature review, NOT staging approval

Base: deploy/chapchitra-render-review @ 21062b097d69418d6fac09084f610e33b3399ff4
Branch: feature/chapchitra-c04-ink-impression-20261119

## Rendering contract
- Existing Illustrator stamp-0.svg through stamp-9.svg are referenced, never modified.
- Only \`.cc-bag-stamps\` (the complete numeral group) and \`.cc-c04-ink\` (the active pager numeral) receive a 280ms compositor transform/opacity animation. Existing buttons, badges, artwork dimensions, colors, focus styles and accessible names remain structurally intact.
- 0–45ms contact 0→.85 opacity; 45–100ms full transfer; 100–200ms imperceptible release to original scale/position; 200–280ms identity hold; no ink masks, device or repeated loops.
- Quantity state commits synchronously, with animation only for changed totals. C03's approved flight and its separate outer-badge arrival animation are untouched.
- Pagination animates only a *user-initiated changed* active page; filter/sort redraw and hydration never trigger a stamp. Focus follows the new active page button after its DOM replacement. Reduced motion is immediate, including live preference toggles.
- No new dependencies. Animation uses Web Animations API with CSS transforms and opacity.

## Owner / independent creative critic gate
- REJECT if this reads as a badge pop, floating object, bounce, sticker or digital zoom, even when technical QA passes. Inspect 4x crops and native recording frame-by-frame. The older approved C03 flight badge feedback is separate and out-of-scope; distinguish it from the C04 impression.
- Visual owner approval is NOT IMPLIED by CI passing. Do not merge, auto-merge, update shared staging branch, touch main or deploy. PR remains draft pending artist signoff.

## QA
Run \`npm run check\`, \`npm run build\`, and \`CC_QA_ROOT=http://127.0.0.1:4272 node scripts/c04-ink-impression-qa.mjs\` with \`PORT=4272 npm run preview\` running against the built site.
The C04-only GitHub Actions workflow uses a local preview process (localhost, **not hosted deployment**), captures Chromium desktop / iPad-width WebKit / mobile Chromium video, enlarged SVG closeups, screenshots and machine-readable contracts. Playwright WebKit is not physical iPad Safari.
