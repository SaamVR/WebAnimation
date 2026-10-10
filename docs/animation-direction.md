# Creative Motion Lab — animation direction / October 2026

Creative direction: Show the **cause of each movement**. The eye must understand the next action before it happens. One narrative focal point at a time. Motion is directed on **poses and beats** rather than a wall of simultaneous procedural movement.

Guiding references: Walt Disney's animation principles (anticipation, arcs, timing and spacing, squash/stretch, follow-through) and Material Design's motion choreography (shared-object continuity and staged entrance). Avoid borrowing assets; all artwork is procedural and original.

## Project 01 — Order Journey / 10.2 seconds

| Time | Story beat | Acting and staging | Acceptance criterion |
| --- | --- | --- | --- |
| 0.4–1.1 | Reveal a flat cardboard blank | Floor pops onto quiet backdrop | Single focal object |
| 1.1–2.2 | Origami-fold the box | Independent wall hinges, staggered easing | Clearly three-dimensional container |
| 2.1–3.3 | Product drops in | Anticipatory hover, accelerated fall, impact deformation and rebound | Product meets inner floor and reads as having mass |
| 3.2–4.5 | Protect the contents | Inner flap, left and right flaps close in sequence | Overlapping action, not simultaneous disappear |
| 4.35–5.35 | Seal and label | Tape draws down center, shipping label stamps onto front | Shipping readiness clearly visible |
| 5.35–6.95 | Drone approaches | Decelerates into hover; cable lowers to carton top | Pickup has a plausible physical mechanism |
| 6.96–7.3 | Latch | Hook contacts carton; small verification spark; hold | Audience notices moment of attachment |
| 7.3–8.7 | Lift and accelerate | Package and drone share one rig and motion path; dust trails and shadow weakens | **Cable stays connected**, parcel never teleports |
| 8.55–10.2 | Confirmation | Motion exits frame; checkmark writes on; copy lands and holds | One conclusive resolution; legible long enough |

Production note: SVG polygons create a graphic isometric interpretation, *not* a true 3D rigid-body simulation. The magnetic pickup is a visual metaphor. If pursuing physically accurate mechanics, use an actual 3D rig and render the same storyboard.

## Project 03 — Bloom to Bottle / 11.6 seconds

**Commercial use case:** a premium botanical serum product-detail-page hero where a naturally hand-drawn ingredient story turns into a product preview and a real *demonstration* shopping interaction.

| Time | Story beat | Animation | Viewer takeaway |
| --- | --- | --- | --- |
| 0–2.3 | Quiet growth | A stem traces its arc, alternating leaves unfold | Organic ingredient origin |
| 2.3–4.3 | Bloom | Nine petal ribbons draw with overlapping timings | Emotional/visual peak |
| 3.9–5.5 | Transmutation | Pigment particles pull out of plant and converge into bottle volume | Ingredient becomes product |
| 4.4–6.4 | Reveal | Amber glass and stopper materialize, then matte label and typography | Recognizable physical product |
| 6.6–7.7 | Finish | A single reflection sweeps glass; orbit motes settle | Surface and craftsmanship |
| 7.2–11.6 | Shop moment | Name, size, fictional price, and Add to Bag become interactive | Clear user action and conversion |

### Motion, design and implementation rules

1. Anticipation comes **before** release or contact. Ease object arrivals instead of globally applying one easing curve.
2. The important product remains in one consistent screen location; environmental marks enhance rather than occlude it.
3. Keep UI keyboard accessible; respect `prefers-reduced-motion` and manual scrubbing. Product and shopping controls are HTML, not canvas hit targets.
4. Use time-based geometry for frame-perfect browser-to-video rendering. Cursor wind is optional and does not affect the canonical video sequence.
5. Preserve 16:9 framing for portfolio/export; responsive browser views require a separate layout check. Browser recording depends on browser WebM capabilities.
6. Shopping state is demonstrative: no cart backend, checkout service or billing transaction is implied.

### Acceptance checklist

- JavaScript syntax validates; no uncaught runtime exceptions in sampled frames.
- All listed story beats are recognizable in a contact sheet.
- Drone magnet connects to the box apex during lift.
- Three Project 03 variants render with the same narrative and a visible product silhouette.
- Product control is initially unavailable and becomes interactive only after the reveal.
- Scrubbing works with playback paused; there is a reproducible `window.renderAt` API and reduced-motion fallback.
- Public deployment must show gallery cards for Projects 01, 02 and 03, and each project route must load independently.
