# Creative Motion Lab — WebAnimation

A growing collection of creative-coding, procedural and interactive motion experiments. **One GitHub repository and one Render static site** serve all projects.

## Live site

- `/` — project gallery
- `/projects/01-order-journey/` — Order Journey, a deterministic SVG web component; configurable loop, speed and timeline
- `/projects/02-living-ink/` — Living Ink, a Canvas 2D procedural botanical scene; wind interaction, three color palettes, WebM capture where browser-supported

## Run locally

```bash
cd site
python3 -m http.server 8080
```

Then open http://localhost:8080/ . No build dependencies, server or database are required.

## Add another animation

Create `site/projects/03-name/index.html` (and any project assets) and add a gallery card to `site/index.html`. New projects share the same Render service and domain.

## Video export

Project 1 supports deterministic `window.renderAt(milliseconds)` with `?render=1`; this enables frame rendering in a headless browser and FFmpeg assembly. Project 2 offers browser WebM recording and frame rendering via `window.renderAt(milliseconds)`; browser MediaRecorder exports run in real time and support varies.

## Accessibility and quality

Reduced-motion preferences are respected by default. Timeline scrubbing works while paused. Each experiment is independently viewable and usable without build tooling.