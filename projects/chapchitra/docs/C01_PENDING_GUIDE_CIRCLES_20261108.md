# CHAPCHITRA C01 — Subtle Pending Icon Guide Circles

**Release boundary:** draft PR #67, isolated Render review only; owner approval required. No production merge.

## Owner visual feedback (2026-11-08)

While the first icon animates, later icon positions appear empty even though the connecting lines have faint beige inactive guides. Show each pending icon's **circle only**, in the **same color as the inactive connector**, until its existing icon animation activates. Preserve all four finished Lottie assets, the completed layout, the 10.27-second synchronization, one-line feature labels, spacing, and artistic framing.

## Exact implementation

- A noninteractive C01-only CSS `::after` circle appears at each pending slot. It uses `var(--beige)`, the identical CSS token of the inactive connector path; both use **0.57 opacity**, with CSS-requested 1.7px border/stroke width.
- The new circle's 72px desktop / 68px mobile geometry is registered to the **existing icon shell**, so the connector still terminates at its unchanged original icon position.
- **No extra animation.** The existing synchronized V3 reveal `(seconds - STARTS[i] + .02) / .14` controls the original icon and its offset outline. The guide fades inversely under that same 140ms reveal.
- At cycle reset, later icons return to beige circles in the same frame as the existing original Lottie playheads reset. The guide does not pulse, spin, draw, scale, or independently loop.
- On reduced motion, all four completed icons appear and all guide placeholders are hidden.
- Before JS/Lottie readiness or on an asset failure, existing static posters remain available. All headings remain accessible; CSS-only rings are decorative and never announced.
- Guard redundant CSS style writes: the guide and artwork opacity properties are updated only if a reveal value changes.
- No new runtime image files, JS libraries, network requests, Lottie modifications, or non-C01 changes.

## Validation

- **50/50 Chromium timing and rendering checks passed**: 11 V3 cues each at 1408/834/430/320px, including 50%-drawn connector intervals, guide color equality, icon reveal and complete final pose, visibility, layout, and reduced motion.
- **4/4 Microsoft Edge pending-icon checks passed**, including both desktop and mobile widths.
- **99/99 C01 branch repository tests passed**; the four original Lottie JSON files are still hash-locked.
- Captured screenshots: `docs/c01-evidence/c01-guide-1408-t0.png` (first icon animating + 3 pending circles), `c01-guide-1408-t2_445.png` (first connector halfway, pending circles), `c01-guide-1408-t10_27.png` (approved final pose), `c01-guide-430-t0.png` (mobile).
- Synchronized original-Lottie browser recording: `docs/c01-evidence/c01-guide-synchronized-lottie.webm`.
- Machine-readable browser evidence: `docs/c01-evidence/c01-guide-qa.json`.

**No change to** Artist's Edit, other homepage animations, the existing approved titles, circle size, connector geometry, 10.27s cue map, or the source Lottie JSON.

**Owner gate:** review live preview before merge or publication. Physical iPad Safari visual acceptance remains pending.
