# Vantela — Taste refinement, 24 November 2026

Base: feature/vantela-ai-isolated-demo-20261123 at 83ae20d886c775e04a792dae110a2a76dfaaca57 (merged PR #157).
Scope: projects/vantela-ai/ exclusively. No merge, Render action, preview service or deployment authorized.

## Direction and changes
- Original Taste Skill on samai was available (v2.5.1 guidance), with software page direction and palette/type dealer consulted. The established Vantela palette and typography take precedence over the dealer's consumer-product suggestions. Preserve exported layout and copy.
- Four cards: blue #006BE0, cyan/mint #03DDB3, orange #F15A24, yellow #F6BC17; adjust icon/foreground colors only for contrast. Card content and links unchanged.
- Solid gear cutouts; larger hero bars; two-color filled pies; capabilities gear increased from 154 to 200px (+29.9%).
- Remove duplicate cyan decorative cube, not the actual 3D-generation animation. Yellow cube crosses the blue band edge. Replace separate clipped bars and gear with one spanning SVG; responsive offsets reserve header text space.
- All seven animation stages retain a single player and now have 12–28px inset on every edge. Replay controls remain above media.
- AI04: the original embedded reference illustration has a white background, but the original MP4 is black-matted and the previous web preview is pale-yellow-matted. Added a separate opaque white-matte reconstruction from the existing 16s MP4 using black colorkey (0.055 similarity, 0.04 blend), preserving all source assets. Sample at 4s inspected; original full-background motion export not available/verified. The white reconstruction is not represented as a byte-identical original export.
- One manual Capability Explorer (Create, Understand, Work smarter, Collaborate): reuses the four existing descriptions, adds conceptual process diagrams; keyboard arrows/Home/End, ARIA tab semantics, reduced-motion transitions, no backend/API claims or autoplay.
- Existing animations, story structure, text, and brand retained.

## Verification
- Existing single-motion showcase contract and new Taste refinement source contract: PASS.
- White preview: H.264, yuv420p, 670×376, 30 fps, 16.00 seconds.
- Taste local audit job 1314f14d-b2ae-40e7-9383-1b0e524e09d2 started on 127.0.0.1:39572; not a final gate result. Local disk pressure (5 MB free observed) limits samai browser QA. Earlier audit began before the last changes, so it cannot certify final revision. Browser evidence and owner/device acceptance remain separate.
- No new deployment URL. No claim of actual AI product functionality.
