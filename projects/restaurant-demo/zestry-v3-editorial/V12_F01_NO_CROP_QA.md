# ZESTRY V12 — F01 full ingredients in a circular hero

Date: 2026-11-18. Scope: projects/restaurant-demo only.
Review: Draft PR #125. Deployment: NOT DEPLOYED.

## Owner requirement
The V11 cover crop chopped flying ingredients at the circle's left/right border. Preserve visible ingredient movement in the approved F01 animation, fill the entire circular wood background, and introduce only a narrow yellow shape behind the circle.

## Implementation
- The original F01 composition is widescreen 1984 x 1134. A single SVG cover transform into 1:1 circle inevitably crops horizontal material.
- Reuse a clone of the **original static wood tabletop vector layer** from the existing F01 browser SVG. Clone into an SVG backdrop with viewBox 0 0 1984 1134 and preserveAspectRatio xMidYMid slice. Hide the old wood layer in the foreground only after cloning succeeds.
- Display the original moving vector composition in a centered 84%-diameter stage with preserveAspectRatio xMidYMid meet. The entire original rectangular source canvas is geometrically inscribed inside the circle. Positive clearance to the circle is 4.7–7.9 CSS pixels depending on viewport.
- The parent visual remains a true 1:1 circle with 50% border radius and no custom shape clipping. Add an offset, low-profile warm-yellow circular background accent via CSS box shadow. No yellow horizontal bands.
- Preserve all animation source JSON, vectors, frames, timing and original approved behavior. F04 remains checkout-only.

**Natural entry nuance:** Some approved F01 ingredients intentionally begin outside its original 1984x1134 canvas and appear partially while entering that native scene. This is part of the original motion, not circle-boundary cropping.

## QA
Real Chrome / Puppeteer tested at 1818x828, 1440x900, 1024x768, 390x844, 320x690.
All tested: circle exactly 1:1; original background clone present with xMidYMid slice; foreground uses xMidYMid meet; source wood layer hidden only after successful clone; no horizontal overflow; no page JS or HTTP asset errors. Thirteen desktop key frames and seven mobile key frames were visually reviewed (including frame 0 and the final frame 260). F04 simulated checkout regression passed: 240 frames, one shot, Sample order received.

Evidence: docs/qa/owner-v12/f01-desktop-13-keyframes.jpg, f01-mobile-7-keyframes.jpg, f01-browser-qa.json, and initial/final reference screenshots.

Approved original SHA256 unchanged:
F01: 7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37
F03: 136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68
F04: e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0
F05 dotLottie: 3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645
F07: a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b

User creative signoff pending. DO NOT DEPLOY without explicit user request.
