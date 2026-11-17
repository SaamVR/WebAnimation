# Selected Skill Integration (External Guidance, Not Blind Installation)

The six linked repos were inspected via the official GitHub connector. Only relevant skills below are adapted as production procedures. Refer to upstream for full instructions; **do not silently run third-party install scripts or vendor assets**. Licenses apply to each code/artwork/audio source separately.

| Repository | Selected guidance | Application to this film |
|--|--|--|
| [mattypark/Motion-graphics-skill](https://github.com/mattypark/Motion-graphics-skill/blob/main/skills/motion-video-director/SKILL.md) | Motion Video Director: preflight, PROGRESS, storyboard, fast previews, frame-by-frame render | Director gate G2 and resumable video build; optional voiceover after user approval |
| [Barty-Bart/motion-graphics](https://github.com/Barty-Bart/motion-graphics/blob/main/skills/sound-effects/SKILL.md) | Sound Effects: cue sheet, real licensed samples, measurable export loudness and true peak | Avoid prior synthesized oscillator beeps, log SFX and music licences, measure MP4 |
| [Barty-Bart/motion-broll](https://github.com/Barty-Bart/motion-graphics/blob/main/skills/motion-broll/SKILL.md) | One hero/action per cut, scale chosen on purpose, subject-originating animations | Direct original site motion rather than templated cards |
| [remotion-dev/skills](https://github.com/remotion-dev/skills/blob/main/skills/remotion-best-practices/SKILL.md) | Remotion 4: editable compositions, authored sequences, preview/still/boundary render | Preferred editable scene pipeline once dependency install/Studio preview is available; FFmpeg temp animatic remains source-grounded |
| [zhuyansen/awesome-claude-video-skills](https://github.com/zhuyansen/awesome-claude-video-skills) | Curated catalog and security risk awareness | Skill discovery only; no execution from unreviewed repo |
| [mengto/skills](https://github.com/mengto/skills/blob/main/agent-skills/media/html-explainer-video/SKILL.md) | Frame-deterministic scenes from a single video clock, brand-specific look | Use one timebase and reproducible frame mapping |
| [mengto/iterate-until-verified](https://github.com/mengto/skills/blob/main/agent-skills/codex/iterate-until-verified/SKILL.md) | Evidence-led independent verification, preserve original task | All G0–G5 approval gates |
| [owl-listener/designer-skills](https://github.com/owl-listener/designer-skills/blob/main/design-ops/skills/design-qa-checklist/SKILL.md) | Visual and responsive QA + source-specific interaction accuracy | Thumbnail, focus, crop, color, clarity audits |
| [owl-listener/animation-principles](https://github.com/owl-listener/designer-skills/blob/main/interaction-design/skills/animation-principles/SKILL.md) | Controlled easing, staging, purposeful motion | No forced action where the source has no real movement |
| [Taste / Leonxlnx](https://github.com/Leonxlnx/taste-skill/blob/main/skills/taste-skill/SKILL.md) | Anti-template composition, real visuals, purpose-driven distinct brand identity and browser finish checks | **Taste gate:** one visual idea per shot, no generic UI bento cards, no invented showcase content |

## Functional definition of 'Taste'
- Tell the audience what is for sale in under 10 seconds; do not show a blank intro.
- Establish focal hierarchy by actual source animation scale and contrast.
- Preserve each original brand visual world: CHAPCHITRA printmaking, Threads ecommerce, restaurant illustration, NOVA product studio, LeadFlow data flow, CITYSHIFT map.
- Avoid black-to-gradient generic backgrounds, decorative particle layers, oversized text unrelated to source motion, and animated cards lacking a buyer purpose.
- Do **not** apply a web page skill's literal UI rules to video without adaptation; video-specific editor, composer and sound audit override them.
- Always inspect the rendered MP4, not code previews or self-grades.

## Runtime checklist (current)
- Local container: ffmpeg, Python 3, Chromium, Playwright available.
- Remotion npm packages **not yet installed** because local container has no external network. Do not claim it renders until actual installed/tested.
- Rights-cleared music and source SFX **not yet selected**.
- Connected GitHub source-ingest workflow succeeded for public source branches.
- CITYSHIFT private Actions job failed; alternative private capture required.
