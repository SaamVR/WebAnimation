# Creative Motion Lab V2 — Hybrid Product Motion Design

**Date:** 2026-10-10  
**Status:** Approved architecture, specification awaiting owner review  
**Repo:** [SaamVR/WebAnimation](https://github.com/SaamVR/WebAnimation)  
**Production baseline:** \`main\` at \`a1764f7b55bad414eecd87c4a647e6ada172de42\`; one Render static site; nine \`/ProjectN/\` routes.  
**Tool boundary:** GPT runtime only. No remote device, Remote Desktop Commander, \`samvr\`, or \`samai\`.

## 1. Product intent and failure being fixed

Creative Motion Lab must sell real freelance skills to e-commerce, hardware, furniture, beauty and SaaS clients. Each project needs a recognizable product, professional visual identity, purposeful motion, an interactive use case, an inspectable film/web output and a clear client deliverable.

The existing nine-route collection is operational but Projects 4–9 rely on SVG gradients and 2D shapes that cannot deliver convincing physical products. More easing and particle effects do not fix poor geometry, flat materials, inaccurate lighting, or unconvincing product proportions. Preserve hand-drawn techniques where they advance the visual story, but do not present them as photorealistic product construction.

**Approved approach:** offline 3D authoring + optimized real-time 3D + stylized 2D art. Solecraft (Project 07) will establish the product-fidelity benchmark before parallelizing upgrades to all nine projects.

**Completion standard:** a paused hero frame passes the scrutiny of a professional product still; a directed film has intelligible causation and physically believable action; a visitor can genuinely change an asset's visible configuration. URL availability alone is not sufficient.

## 2. Scope and boundaries

**In scope:** 3D geometry and PBR materials, cinematography/storyboarding, film and responsive browser outputs, actual model/material variants, accessible playback, optimized assets, license provenance, client-focused case studies and visual/performance evidence.

**Out of scope:** live payment processing, live calendar or customer integrations, actual inventory, certified product performance claims, scientific airflow modeling, precise mechanical engineering where no supplied design exists. Fictional flows are clearly labeled demos.

**Compatibility:** retain \`/Project1/\` through \`/Project9/\` and earlier descriptive project routes. Keep current deployed versions as reversible fallbacks. Render currently deploys automatically from \`main\`; development lives on branches, and unapproved experiments do not enter production.

## 3. Chosen architecture

| Layer | Technology | Responsibility |
| --- | --- | --- |
| 3D production | Blender | Authored product geometry, seams, laces, UV maps, rigged parts, shot cameras, high-quality material and film rendering **if GPT-runtime resources support Blender** |
| Asset delivery | GLB/glTF + glTF-Transform | Interoperable materials and rigs, versioned optimization, texture compression, file validation |
| Real-time product viewer | Vite + React + TypeScript + Three.js / React Three Fiber + Drei | Lazy-load single-scene 3D pages with orbit/material controls and responsive camera framing |
| Film and web choreography | Theatre.js; GSAP for DOM/UI motion | Art-directed keyframes, camera continuity, scrubbable timeline, restrained UI transitions |
| Effects | Three.js shaders / React Postprocessing / baked simulations | Carefully selected effects rather than generic bloom; do not force costly physics into mobile browser |
| Expressive 2D | SVG / Canvas / brush systems | Ink/sketch openings, graphic communication and Living Ink's artistic identity |
| Evidence/export | GPT-runtime browser, Playwright if available, FFmpeg and asset validators | Verify actual stills, reproducible screenshots, animations and film metadata |
| Deployment | Existing Render static site | Preserve one domain and all nine routes |

Availability of Blender, real graphical browser, GPU, FFmpeg, and tool-compatible dependencies in the **GPT runtime is not assumed**. The first engineering work item is an evidence-backed capability test. If required resources are missing, record a BLOCKED gate rather than secretly switching to a device or claiming a nonexistent photoreal render.

### Modular target structure

\`\`\`text
WebAnimation/
  apps/motion-lab/
    gallery/          # posters, filters, case studies
    project-shell/    # controls, captions, timeline
    projects/         # unique composition per project
  packages/
    motion-core/      # pure timestamp-to-pose evaluation
    product-viewer/   # R3F model/camera lifecycle
    visual-effects/   # per-project shader/art tools
    asset-manifest/   # provenance/variants/hashes
  assets/
    source/           # Blender originals and textures
    web/              # optimized GLB and posters
    film/             # exported cinematic assets
  scripts/            # optimization, validation, visual QA, export
  docs/               # storyboards, art-direction, license ledger
\`\`\`

This is a proposed end state, not a request to create every directory before the first real visual proof. Adapt gradually to minimize breakage.

### Interface and ownership contracts

- \`ProjectManifest\`: project ID, permanent route, poster, scene module, film link, capabilities, buyer use case and attribution.
- \`AssetManifest\`: source, asset ID, checksum, license, creator, render version, geometry/texture variants, file bytes and transformations.
- \`MotionTimeline\`: duration, absolute-time \`getStateAt(t)\`, \`play\`, \`pause\`, \`seek\`, shot/cue metadata and reduced-motion mode.
- \`ProductScene\`: controllable hero mesh, named rig parts, materials, camera anchors and project-specific interaction contract.
- \`ShotPlan\`: time range, focal object, anticipation, action, settle, camera, lighting, sound cue and still-frame acceptance evidence.
- \`ExportProfile\`: fps, resolution, codec, crop/alpha and scene version.

These contracts define design intent; concrete TypeScript APIs and compatibility tests belong in the implementation plan.

The same approved source assets and scene beats serve a **high-quality film** and a **fast interactive website**, but the two renderers need not be pixel-identical. Use baked physical simulations/absolute timeline states for deterministic scrubbing and frame-by-frame export.

## 4. Solecraft — first professional acceptance benchmark

Solecraft will depict a credible fictional premium sneaker with a precise silhouette, textured knit/mesh, separate sewn panels, laces, eyelets, midsole foam, outsole grooves, realistic reflection/roughness, contact shadows and accurate material variants. Do not copy an existing brand's protected logos or call an unmodified third-party sample an original model.

**Art direction:** quiet neutral/mineral studio, long controlled softboxes, closely observed textile macro shots, precise technical graphite marks and intentional camera moves. Its opening illustration must resolve into the same physical 3D contours rather than cutting abruptly to an unrelated object.

### Directed 24-second film and interactive ending

| Shot | Time | Story and choreography | Acceptance criterion |
| --- | --- | --- | --- |
| S1 · First mark | 0–3s | Pencil stroke tracks true shoe silhouette; design guides hold momentarily | Sketch corresponds to the final 3D mesh |
| S2 · Drawing becomes matter | 3–7s | Mesh, seams and rubber resolve into view during a measured camera push | Close-up withstands realistic still-image inspection |
| S3 · Engineered construction | 7–12s | Upper, insole and sole separate on physically readable axes; slow camera orbit | No collisions, teleporting or impossible part relation |
| S4 · Reassembly and landing | 12–17s | Components join; laces follow; weight settles onto the floor | Contact shadow, impact timing and mass read convincingly |
| S5 · Hero product | 17–21s | Controlled light sweep reveals a fully formed shoe | 1080p paused frame is credible product advertising |
| S6 · Configurator handoff | 21–24s | Camera settles into inspection state; UI appears after product hold | Web controls are functional; film ends on clean composition |

**Required web interactions:** constrained orbit, play/pause/replay, exact timeline scrub, at least three visibly different material/color variants applied to the shoe itself, two purposeful inspectable detail points, keyboard-accessible controls and a clear concept/demo CTA (not a fake paid checkout).

**Required evidence:** multi-angle product stills, one macro knit/eyelets/sole still, six-pose storyboard/contact sheet, materially distinct variant captures, screen recording of interaction, mobile fallback proof, asset manifest, size/performance metrics and an actual video file with verified frames and metadata. Do not label it complete if the still looks drawn when it should look physically real.

The Khronos [MaterialsVariantsShoe](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/MaterialsVariantsShoe) may be used as a **technical fixture** to validate 3D variants; it is CC BY 4.0 and requires attribution. The final flagship should use original or appropriately licensed assets and distinguish technical examples from original creative work.

## 5. Distinct art direction for all nine projects

| Project | Buyer | Visual identity | Real improvement |
| --- | --- | --- | --- |
| 01 Order Journey | E-commerce | Tactile playful 3D | Folding pivots, product impact, sealing and physically connected drone pickup |
| 02 Living Ink | Creative/editorial | Handcrafted generative 2D | Natural stroke/ink variation and staged dynamic compositions; no forced 3D |
| 03 Bloom to Bottle | Cosmetics | Botanical ink to luminous glass | Realistic amber bottle, glass highlight/refraction, product label and meaningful UI |
| 04 AER | Appliances | Bright architectural product cinema | Real purifier/filter asset, exploded sections, atmospheric airflow visualization without scientific claims |
| 05 Atelier | Furniture | Warm architectural studio | Genuine timber, upholstered mesh and stitching, room context, actual material swaps |
| 06 Relay | SaaS | Precise editorial UI motion | Stateful fictional enquiry → intent → availability → confirmation; no implied real transactions |
| 07 Solecraft | Footwear | Technical sketch → photographic sneaker | Full first-benchmark shot plan, realistic asset and interactive variants |
| 08 Studio Brew | Coffee machinery | Moody brushed metal and liquid | Credible brewer, crema and steam, macro material studies, recipe options |
| 09 Kinetic Time | Luxury watch | Dark premium mechanical macro | True 3D watch model, separate moving parts/hands and plausible gear staging |

Use [Khronos SheenChair](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/SheenChair) and [ChronographWatch](https://github.com/KhronosGroup/glTF-Sample-Assets/tree/main/Models/ChronographWatch) as possible licensed pipeline references. Check each asset's own model license and logos before any public use. The visual styles must differ intentionally across projects; common infrastructure must not make them look like one templated generic animation.

## 6. Outputs, performance and browser experience

**Film:** 1920×1080 minimum target, 24fps reference, 16:9 master and optional mastered audio. Prefer offline Blender rendering of expensive glass, fabric and liquid when available in GPT runtime; otherwise browser capture only if judged visually adequate. Retain exact scene/shot metadata and verify file, codec, duration, resolution, contact sheet and absence of corrupted/clipped frames. An unavailable renderer remains a documented blocker, not a claimed output.

**Web:** individual \`/ProjectN/\` paths with a responsive scene, art-directed poster fallback, lazy GLB loading, variant selection, timeline, optional orbit, reduced-motion handling and accessible buttons. Audio does not autoplay. If WebGL fails, show an intelligible poster/video and controls that do not misrepresent availability.

**Homepage:** stop loading nine full WebGL scenes simultaneously. Show elegant lightweight posters/loop clips, editorial composition, fast category filtering and meaningful buyer-facing descriptions. Load expensive 3D only on an opened project. Keep old aliases and direct refresh behavior on Render.

**Initial measured performance targets** (not current claims): gallery should not create multiple concurrent GPU 3D contexts; desktop motion should aim at ~50–60fps and a representative mid-range mobile at ≥30fps with controlled quality tiers. Establish actual browser/network/device test conditions in the implementation plan, record load time, model/texture sizes, GPU overhead and fallback behavior. Harder offline rendering is allowed for the film; do not compromise browser usability to force film-quality shaders on a phone.

## 7. Build sequence, integration and QA

**Increment A — feasibility gate.** Verify GPT-runtime tool availability for modeling or licensed 3D assets, bundling, browser screenshot, glTF validation, performance capture and video export. Record installed tools and actual proof or BLOCKED result. Confirm licensing for temporary fixtures.

**Increment B — Solecraft still.** Create or secure a valid shoe mesh, optimize/tune PBR materials and studio lighting. Review side/three-quarter/outsole/macro stills before animation. **Owner visual approval is required to proceed.**

**Increment C — Solecraft motion & viewer.** Block six-shot animatic, refine camera staging and contact, implement deterministic timeline/GLB variant control, verify playback/accessibility, export and review actual film and web stills.

**Increment D — gallery/platform.** Migrate to modular static React/Vite shell, preserve routes, introduce poster/clip lazy preview, verify Render direct links and performance. Do not cut over \`main\` without preview acceptance.

**Increment E — remaining project lanes.** Parallel asset production for AER/Atelier/Studio Brew/Kinetic Time, high-quality SaaS UI animation for Relay, and expressive 2D/3D refinement for Projects 1–3. Start parallel upgrades only after reuse contracts have proven stable. Each project has independent art and QA gates.

**Increment F — final release.** Nine live projects, verified rendered scenes, legal attribution, performance/fallback notes, working routes and credible product case studies, with selected film exports and complete evidence.

**Work lanes** (planned roles, not active autonomous workers): Creative Director/Storyboarding; Product Modeling & Materials; Motion Cinematography; WebGL & Frontend; QA/Integration. Each lane owns separate artifacts and uses reviewable GitHub branches. A controller integrates only after tested acceptance.

### Mandatory gate evidence

For every project record: \`gate name\`, \`project\`, \`commit SHA\`, \`runtime environment\`, \`timestamp\`, \`evidence links or file paths\`, \`observed metrics\`, \`PASS|FAIL|BLOCKED\`, and reviewer decision. Gates: asset rights/quality; hero still; storyboard/animatic; browser interactions; film integrity; mobile/reduced motion; performance; deployed visual QA; commercial integrity.

**Important past limitation:** a GPT-runtime full graphical audit of the public Render site has not yet succeeded. A URL content fetch or HTTP 200 response is not a screenshot and cannot close visual QA. Do not use a remote device to bypass this. Record blocker and use a supported GPT-runtime browser if/when available.

## 8. Risk and operational protection

- \`main\` auto-deploys the current Render production site. This spec sits on a separate **non-deploying documentation branch**, not production.
- Source and binary asset rights must be recorded. Never label borrowed GLB models as scratch-built creative work or expose third-party marks without permission.
- Verify Theatre.js core and Studio licensing separately and do not bundle the Studio editor in published viewer bundles. Pin tested runtime versions before integrating.
- Expensive simulations should be baked or represented deterministically. Avoid gimmicky over-rotation, decorative particles that obscure shape, inconsistent contact and fake physical dynamics.
- Record no personal customer details, secrets, vendor tokens or private files in public artifacts.
- If GPU, Blender, FFmpeg or real browser evidence cannot be produced in the GPT runtime, state the limitation and leave the relevant acceptance gate blocked.
- Preserve project-specific realism/illustration decisions; do not impose photorealism on projects where hand-drawn art is the actual product.

## 9. Approval stage and next action

**Already approved in conversation:** the hybrid Blender/R3F/Theatre.js architecture and Solecraft-first fidelity benchmark across nine eventual upgraded projects. **This written specification now requires separate owner review.** Once approved, follow the Superpowers \`writing-plans\` skill to produce a testable implementation plan focused on the first Solecraft vertical slice, and have the owner review that implementation plan and choose the execution method. Only then start new product implementation.

## References

[Blender](https://github.com/blender/blender) · [React Three Fiber](https://github.com/pmndrs/react-three-fiber) · [Drei](https://github.com/pmndrs/drei) · [Theatre.js](https://github.com/theatre-js/theatre) · [GSAP](https://github.com/greensock/GSAP) · [glTF-Transform](https://github.com/donmccurdy/glTF-Transform) · [React Postprocessing](https://github.com/pmndrs/react-postprocessing) · [Khronos glTF Samples](https://github.com/KhronosGroup/glTF-Sample-Assets)
