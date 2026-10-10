# Creative Motion Lab — WebAnimation

A growing collection of creative-coding, procedural and interactive motion experiments. **One GitHub repository and one Render static site** serve all projects.

## Live site

- `/` — project gallery
- `/projects/01-order-journey/` — Order Journey, a deterministic SVG web component; configurable loop, speed and timeline
- `/projects/02-living-ink/` — Living Ink, a Canvas 2D procedural botanical scene; wind interaction, three color palettes, WebM capture where browser-supported
- `/projects/03-bloom-to-bottle/` — Bloom to Bottle, an original botanical-to-product sequence with three visual variants, a functional demo Add to Bag control, deterministic frame rendering and WebM capture

## Run locally

```bash
cd site
python3 -m http.server 8080
```

Then open http://localhost:8080/ . No build dependencies, server or database are required.

## Add another animation

Create `site/projects/03-name/index.html` (and any project assets) and add a gallery card to `site/index.html`. New projects share the same Render service and domain.

## Video export

Project 1 supports deterministic `window.renderAt(milliseconds)` with `?render=1`; this enables frame rendering in a headless browser and FFmpeg assembly. Projects 2 and 3 offer browser WebM recording and frame rendering via `window.renderAt(milliseconds)`; browser MediaRecorder exports run in real time and support varies.

## Accessibility and quality

Reduced-motion preferences are respected by default. Timeline scrubbing works while paused. Each experiment is independently viewable and usable without build tooling.

### Reproducible MP4 exports

```bash
pip install playwright
playwright install chromium
# FFmpeg must be installed on the host
python scripts/export_video.py --project 01-order-journey --width 1280 --fps 30
python scripts/export_video.py --project 02-living-ink --width 1280 --fps 30
python scripts/export_video.py --project 03-bloom-to-bottle --width 1280 --fps 30
```

This exporter captures each frame at an explicit timestamp and encodes H.264 MP4 through FFmpeg; no interactive animation input is required during export. If you want art-directed wind in the recorded Living Ink video, add scripted wind to the deterministic renderer.

## Motion direction and QA

Read [`docs/animation-direction.md`](docs/animation-direction.md) for the beat-by-beat choreography, art-direction decisions, and acceptance criteria. The `?render=1` mode freezes each project at the start for reproducible export, and `window.renderAt(ms)` sets deterministic scene time. The mock shopping bag in Project 3 is a **client-side design study**, not a payment checkout or inventory backend.
