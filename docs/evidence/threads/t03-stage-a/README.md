# THREADS T03 Stage A — first reconstruction study

**Status: EXPERIMENTAL / NOT CREATIVELY APPROVED.** Do not start Stage B promotional cards.

## Sources and provenance
- `site/threads/assets/t03-backpack-closed-original.png` — exact owner-supplied 1536×1024 transparent closed image
- `site/threads/assets/t03-backpack-open-original.png` — exact owner-supplied 1536×1024 transparent opened image
- `scripts/t03_generate_layers.py` — deterministic crops and masks only; no generated/replacement artwork
- Derived sprites share the common 1090×1024 coordinate system. The open image is approximately aligned to the closed art using **the unchanged lower-bag/shoe/bottle details**.

## Implementation
A single isolated GSAP timeline toggles on the existing Deal art trigger and on the current "Shop the Deals" CTA (normal activation used for this Stage A experiment; modifier-click retains original shopping navigation). Uses independent buckle sprites, front-flap and open-flap sprites, a 3D transform-origin hinge, and a geometric clip window revealing the interior. Click again reverses the same timeline. Keyboard/touch works through the native button. Honors reduced-motion preferences.

Unchanged: T01 source, T02 source, original Deal SVG panel, other homepage sections, Shop/Cart/Checkout, and all other repositories.

## Visual QA — known limitations
The source drawings are not registered sprites of one rig: open-body proportions and cap/shoe/bottle positions differ, and the fully opened flap is clipped at the top of the supplied Open Backpack.png. A procedural mask-and-pivot study can illustrate intended staging but **cannot provide pixel-perfect physical hinges** without extra art. The full-body reveal mask still causes a redraw of adjacent accessories. This first attempt should **NOT** be considered visually complete or approved.

## Precise additional artwork required (all aligned to one master canvas)
1. **Closed main flap FRONT** — full uncropped cream/orange flap as transparent PNG, excluding straps/buckles, with its physical hinge marked in common image coordinates.
2. **Open main flap BACK/INTERIOR** — full uncropped orange underside, same contour, pivot and scale as closed flap (the supplied open screenshot clips the top); separate for true 3D pivot without image switching.
3. **Flap-free backpack BODY / cavity** — a clean background plate with the flap and front straps absent but bag shape, cap, sneaker, bottle absolutely unchanged; include the open mouth and empty cavity.
4. **Left and right straps + buckles** — four separate transparent parts (strap L/R, buckle L/R), full-length pieces including the hidden connection where possible.
5. **Front rim/occlusion matte** — transparent lip layer marking what passes behind the pouch rim, helpful for a natural flap/cavity edge and eventually Stage B products.

Use one consistent-sized transparent PNG/SVG canvas and image coordinate registration. Never regenerate or recolor the illustration.

## Browser QA
Capture and attach homepage closed endpoint, midpoint, open endpoint, reverse landing, desktop/mobile and reduced motion via actual Chrome. Verify T01 and T02 separately. No Stage B / T04.
