# Vantela AI — isolated local Lottie integration candidate

Source baseline: approved Vantela AI decorative motif HTML. Only the sixth-icon-style correction to **fifth CMS tile** and animation attachment metadata/players are changed. Existing palette, layout, illustrations, decorative motifs and cards remain intact.

## Run
```bash
cd Vantela_AI_Lottie_Integration_Local_Review
python3 -m http.server 8080
# http://localhost:8080/
```

The ZIP contains 13 official-format vector Lottie JSON + .lottie files, their motion-preserving MP4 previews, plus the 24.5-second complete six-icon monitor composition. Every primary animation slot plays video immediately when visible. If `lottie-web` can be loaded in the browser, the standalone slots progressively upgrade to official vector playback. Video is the fallback if the external runtime is unavailable. Force MP4 by adding `?player=video`.

## Intentional limitations
- The AI08 hero animation is a six-player composite provided by the animation studio; the complete original integration HTML, SVG backdrop, config and matching standalones are included in `assets/animations/hero/`. The website hero plays its 24.5-second MP4 to preserve exact composite choreography; it is not claimed to be a single native `.lottie`.
- Browser runtime network accessibility varies; offline HTML cannot fetch official `lottie-web`. All MP4 previews are from the provided final ZIP, not remakes.
- Duplicated image gallery thumbnails are intentionally kept static to avoid running 32 independent vector animations at once. Live animation exists in the feature display locations.
- No hosted deployment, GitHub update, or changes to other WebAnimation projects.
