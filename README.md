# Creative Motion Lab — WebAnimation

Nine independent, code-driven motion studies on **one Render static site**. The gallery is an editorial presentation of interactive product-motion concepts rather than a generic collection of animated icons.

**Live:** https://creative-motion-lab.onrender.com/

## Routes

| Route | Experience | Practical application |
| --- | --- | --- |
| `/Project1/` | Order Journey | E-commerce fulfillment |
| `/Project2/` | Living Ink | Procedural illustration |
| `/Project3/` | Bloom to Bottle | Botanical beauty product detail |
| `/Project4/` | AER | Air-purifier explainer & color variants |
| `/Project5/` | Atelier | Furniture material configurator |
| `/Project6/` | Relay | Software workflow explainer |
| `/Project7/` | Solecraft | Footwear construction & colorways |
| `/Project8/` | Studio Brew | Espresso-machine product story |
| `/Project9/` | Kinetic Time | Luxury watch mechanical visual study |

Original Project 1–3 routes under `/projects/` remain intact; their new /ProjectN/ aliases retain the original experiences. Projects 4–9 use shared `site/assets/scenes.js`, `site/assets/studio.js`, and `site/assets/lab.css` but each has unique procedural artwork and choreography. The `site/index.html` gallery contains lazy-loaded previews, navigation, category filters, responsive layout, and accessibility labels.

## Run locally

```bash
cd site
python3 -m http.server 8080
# http://localhost:8080
```

No web build step or backend is needed. The Render static site publishes the `site/` folder directly from `main`.

## Motion & interaction

Projects 4–9 offer Play/Pause, deterministic frame scrubbing, 3 responsive product variants, and a **Copy Product Configuration** action. Call `window.renderAt(milliseconds)` to render a specific time for tests, visual QA, or MP4 exports. Use `?preview=1` for an art-only presentation frame.

Video export:

```bash
pip install playwright
playwright install chromium
# ffmpeg must be installed
python scripts/export_video.py --project Project4 --fps 24 --width 1280
python scripts/export_video.py --project Project5 --fps 24 --width 1280
# Project6 through Project9 also supported.
```

## Direction & honesty about scope

The brief and beat-by-beat cinematography are recorded in `docs/production-direction-04-09.md`. Projects 4–9 are **original stylized SVG/procedural concept demonstrations**, not physically validated engineering simulations or high-poly photoreal product renders. Their variant controls change the illustrated product appearance or recipe state. Relay uses fictional customer information, not live messaging, calendar, or billing. None of the prototypes performs an actual purchase or accepts customer orders.

## QA

An automated browser pass on 2026-10-10 checked all six newly created routes: an SVG scene at a deterministic time, three clickable variants, no page errors; it also verified nine cards and working filters in the gallery and a narrow mobile viewport with no horizontal overflow. Deployment status is checked separately through Render.
