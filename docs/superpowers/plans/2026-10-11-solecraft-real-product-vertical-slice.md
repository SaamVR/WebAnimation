# Solecraft Real-Product Vertical Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (- [ ]) syntax for tracking.

**Goal:** Replace the visual limitations of the existing Project 07 SVG sneaker with a verified realistic 3D sneaker prototype, a deterministic interactive web scene, and an inspectable film/export path—without disrupting the existing nine-project Render website.

**Architecture:** Isolate the new Vite/React/TypeScript scene under apps/motion-lab, load a licensed real glTF shoe, implement camera/material controls and a pure timeline engine, then verify product stills before animating. Keep the existing site/Project7 route live until a reviewed integration. The first milestone is a credible physical-product still and working material variants, not another animated illustration.

**Tech Stack:** Node.js 22+, Vite, React, TypeScript, Three.js, React Three Fiber, Drei, Vitest or Node test runner, Playwright, glTF-Transform, FFmpeg; optional Theatre.js and Blender only after availability/license checks.

**Spec:** docs/superpowers/specs/2026-10-10-creative-motion-lab-v2-hybrid-product-motion-design.md

## Global Constraints

- GPT runtime and approved GitHub/Render connectors ONLY. Never use the user's remote devices, Remote Desktop Commander, samvr, or samai.
- Protect the current live Render deployment; main is auto-deployed. Implement in an isolated feature branch derived from the documented approved starting point and merge only after proof and review.
- Preserve /Project1/ through /Project9/ and the legacy named project routes.
- Solecraft first; exact six story beats: 0–3 s sketch, 3–7 s material, 7–12 s construction, 12–17 s landing, 17–21 s hero, 21–24 s interaction.
- Final model must be original or properly licensed and credited. Khronos MaterialsVariantsShoe is a CC BY 4.0 **technical fixture only**, with credit; never imply it was modeled from scratch.
- Reproducible absolute-time timeline, not frame-accumulation as sole animation truth.
- Respect reduced motion; no autoplay audio; keyboard-accessible playback/variants/hotspots; unsupported WebGL must degrade to valid poster content.
- Production claim threshold: accepted believable hero still; realistic product geometry/materials; actual 3D material variants; sampled interaction video or browser proof; verified final film metadata. Failing any gate is BLOCKED/FAIL, not PASS.
- Runtime scouting on 2026-10-11 found Node.js 22.16, Chromium 144, Python Playwright and FFmpeg 7.1 available; Blender and Python bpy unavailable; direct external raw GLB fetch via Python blocked. Re-probe this at execution time, do not assume network access.

## Review Focus

1. **Asset inaccessible or not licensed:** Task 1 test must reject unresolvable or unverifiable GLB input with a precise BLOCKED reason, preserving existing production.
2. **WebGL unsupported, context lost, or shader/extension missing:** Task 3 and 5 browser tests must show accessible poster/video fallback instead of blank/failed canvas.
3. **Rapid variant switch while loading or scrubbing:** Task 5 tests must end in the requested current variant and maintain the current playhead and visible product mesh.
4. **Direct /Project7/ refresh and historic links:** Task 7 tests must verify new route and rollback alias behavior before any Render promotion.
5. **Mobile/reduced-motion and performance regression:** Task 5/7 tests must validate a 390 px viewport, keyboard actions, safe motion and no simultaneously-mounted gallery 3D renderers.

---

## File map / ownership

**Keep unchanged until promotion:** site/index.html, site/Project7/index.html, site/assets/scenes.js, site/assets/studio.js, render.yaml.

**Add in the isolated V2 vertical slice:**
- scripts/runtime-preflight.mjs — test actual GPT-runtime commands/permissions and output JSON evidence.
- scripts/asset-validate.mjs — verify GLB signature, actual provenance, file checksum and material variant inputs.
- docs/assets/solecraft-license-ledger.md — source, license, credits, reference/production use classification.
- apps/motion-lab/package.json, vite.config.ts, tsconfig.json, index.html — independent source app, no changes to live site.
- apps/motion-lab/src/main.tsx and App.tsx — Vite entry and Project 07 preview route.
- apps/motion-lab/src/projects/solecraft/model.ts — export resolveModel(config): Promise<ValidatedShoeModel>, load parameters, fallback metadata.
- apps/motion-lab/src/projects/solecraft/SolecraftStage.tsx — 3D Canvas, lights, hero camera, shadow, material scene.
- apps/motion-lab/src/projects/solecraft/timeline.ts — export evaluateSolecraftAt(tSeconds: number): SolecraftPose and the six shot boundaries.
- apps/motion-lab/src/projects/solecraft/SolecraftExperience.tsx — bind timeline, stage and web controls.
- apps/motion-lab/src/projects/solecraft/SolecraftControls.tsx — accessible variants, orbit/inspection, play, seek and hotspots.
- apps/motion-lab/src/projects/solecraft/fallback.tsx — unsupported/loading/failed WebGL states.
- apps/motion-lab/src/projects/solecraft/__tests__/ — unit tests adjacent to the relevant feature.
- apps/motion-lab/tests/solecraft.browser.spec.ts — Playwright web/visual/keyboard/runtime QA.
- scripts/export-solecraft.mjs — deterministic output from approved timed frames, or explicit BLOCKED status if renderer unavailable.
- docs/evidence/solecraft/ — test, contact sheet, still and acceptance summary refs; include hashes and source status.

These filenames are the implementation target. Do not pre-create irrelevant shared packages or migrate all nine projects while working on Solecraft. Extract a shared package only after the Solecraft proof shows an actually reusable API.

## Task 1: Runtime capability and asset provenance gate

**Files:** Create scripts/runtime-preflight.mjs, scripts/asset-validate.mjs, docs/assets/solecraft-license-ledger.md; Test scripts/tests/runtime-preflight.test.mjs and scripts/tests/asset-validate.test.mjs.

**Interfaces:** Produces preflight report {node, browser, ffmpeg, blender, npmRegistry, assetFetch, flags}, and validateShoeAsset(path, manifest) -> {ok, errors, sha256, byteSize, variantNames}. Never emit secrets.

- [ ] **Step 1: Write failing preflight and asset tests.** Assert absent Blender is reported as unavailable rather than passed; missing GLB returns BLOCKED; file with wrong 0x46546C67 glTF magic is rejected; manifest lacking license/source is rejected; known valid fixture hashes and variant names are returned.
- [ ] **Step 2: Run tests and capture expected failure.** Command: node --test scripts/tests/runtime-preflight.test.mjs scripts/tests/asset-validate.test.mjs. Expected before implementation: failing import or missing functions.
- [ ] **Step 3: Implement the minimal scripts and provenance ledger.** Report which tools truly execute; support input path and expected digest; read the file header and glTF metadata; for non-local assets record URL and required attribution but do not fake success on binary download. Capture actual availability of npm dependency downloads separately.
- [ ] **Step 4: Re-run tests, inspect report and store evidence.** Same command PASS; command: node scripts/runtime-preflight.mjs --json. Expected: truthful environment report, no device usage, definitive GO/BLOCKED asset acquisition state.
- [ ] **Step 5: Commit only this capability/provenance work.** Message: test: establish GPT runtime and licensed GLB feasibility gate. **Hard stop** if no licensed GLB can be obtained via approved GPT-runtime mechanism; owner-supplied GLB/BLEND is the fallback, not a reason to use a device.

## Task 2: Independent typed Vite preview and route contract

**Files:** Create apps/motion-lab/package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/App.tsx; Test src/__tests__/routes.test.ts.

**Interfaces:** Produces route resolver resolvePreviewRoute(pathname): 'solecraft' | 'not-found' and a preview mount at /Project7/ in the isolated build. Does not edit live Render site.

- [ ] **Step 1: Write failing route test.** Assert /Project7/ and /Project7 resolve Solecraft; unrelated paths are not hijacked; package build scripts exist and CLI output path is isolated.
- [ ] **Step 2: Run npx vitest run src/__tests__/routes.test.ts and observe failure.** Use package scripts after dependencies are available; do not install from random mirrors.
- [ ] **Step 3: Create minimal Vite/React TypeScript app and route resolver.** Pin mutually compatible dependencies (React 19 with React Three Fiber 9, matching Drei and Three versions), generate lockfile, import project components lazily; no heavy rendering on bare gallery.
- [ ] **Step 4: Run route tests, typecheck, build.** npm run test -- src/__tests__/routes.test.ts; npm run typecheck; npm run build. Record dependency resolution and bundle sizes. No live deployment.
- [ ] **Step 5: Commit.** Message: feat: isolate typed Solecraft V2 preview application.

## Task 3: Actual 3D model loader and fallback

**Files:** Create src/projects/solecraft/model.ts, fallback.tsx; add model.test.ts; extend apps/motion-lab/tests/solecraft.browser.spec.ts.

**Interfaces:** Produces resolveModel(config: ShoeAssetConfig): Promise<ValidatedShoeModel>, model error categories 'missing' | 'license' | 'decode' | 'unsupported-extension', plus a poster fallback surface.

- [ ] **Step 1: Write failing tests.** Valid fixture includes actual shoe mesh plus three named material variants; invalid/missing assets report specific failure; missing extension or mock WebGL failure shows the static poster and accessible explanation.
- [ ] **Step 2: Run tests to see failure.** npm run test -- src/projects/solecraft/__tests__/model.test.ts; browser cases expected to fail until fallback exists.
- [ ] **Step 3: Implement loader, GLB caching, error boundaries, source credits and fallback.** Use exact fixture manifest and verify license and hash. Do not present that fixture as final original art. Ensure the variant mapping changes material on the actual mesh.
- [ ] **Step 4: Verify.** Unit tests green; browser renders real GLB geometry and a forced WebGL failure renders poster with no uncaught JS errors; document model/texture sizes.
- [ ] **Step 5: Commit.** Message: feat: load and verify licensed 3D shoe with graceful fallback.

## Task 4: Product-photography still / creative acceptance gate

**Files:** Create SolecraftStage.tsx, src/projects/solecraft/stageConfig.ts, docs/evidence/solecraft/hero-still-review.md; extend browser screenshot specs.

**Interfaces:** Produces configurable physical stage {cameraPosition, lookAt, exposure, environment, keyLight, fillLight, floor, shadow} plus render with three material combinations.

- [ ] **Step 1: Write failing browser/visual requirements.** Product fills deliberate frame with no clipping at 1440x900 and 390x844; material variant visibly changes mesh surface; no dropped poster if GLB is valid; screenshot is an actual captured frame from GPU/WebGL browser.
- [ ] **Step 2: Run browser test and capture expected failure.** npx playwright test tests/solecraft.browser.spec.ts --grep "hero still".
- [ ] **Step 3: Implement lighting/camera/material stage with grounded product reference.** Calibrate metalness/roughness/normal map, knit detail and midsole shading; use deliberate environment lighting and soft ground contact. For final original model, ensure legible laces, eyelets, outsole, and distinct upper/midsole geometry.
- [ ] **Step 4: Generate and inspect proof.** 3/4 side, top, outsole and macro stills plus mobile crop; record actual screenshot filenames, observed limitations and the original/licensed-model distinction. **Require owner visual approval of photographic quality before Task 6 film animation.**
- [ ] **Step 5: Commit evidence and code.** Message: feat: establish Solecraft 3D hero lighting and product still. Gate remains BLOCKED if actual photographic quality not achieved.

## Task 5: Accessible product configuration and resilient runtime

**Files:** Create SolecraftControls.tsx, SolecraftExperience.tsx, controls.test.tsx; extend browser specs for variants/orbit and mobile/reduced motion.

**Interfaces:** setVariant(name: ShoeVariantName) applies to mesh; currentVariant, cameraMode, reducedMotion state and inspect hotspot states remain consistent under fast transitions.

- [ ] **Step 1: Write failing user-facing tests.** Switching from A to C during asset load ends on C; variants affect 3D materials not background; orbit limits never flip underside by accident; reduced-motion disables autoplay; keyboard activates controls; 390 px wide viewport has no horizontal overflow; forced unsupported WebGL shows fallback.
- [ ] **Step 2: Run tests, confirm red.** npm run test -- src/projects/solecraft/__tests__/controls.test.tsx; npx playwright test tests/solecraft.browser.spec.ts --grep "interaction|mobile|fallback".
- [ ] **Step 3: Implement accessible web control states and scene wiring.** Disable controls while their underlying assets are unavailable; stage render-on-demand after pausing; gracefully recover or fall back on context loss.
- [ ] **Step 4: Run tests and manual visual review.** Confirm material difference in three same-camera screenshots, hotspots inspect real mesh areas, mobile and keyboard behavior, performance observation. Record evidence.
- [ ] **Step 5: Commit.** Message: feat: add robust Solecraft configurator and accessibility.

## Task 6: Choreographed deterministic timeline and export

**Files:** Create timeline.ts, timeline.test.ts, docs/storyboards/solecraft-shot-plan.md, scripts/export-solecraft.mjs; extend browser spec and evidence ledger.

**Interfaces:** evaluateSolecraftAt(timeSeconds: number): SolecraftPose with shotId 1–6, camera pose, component offsets, materialTransition and display/UI state; clamp to [0,24] and be invariant to render call order. Expose a safe seek/play/pause controller.

- [ ] **Step 1: Write failing tests for all six boundary poses.** Assert at 0,3,7,12,17,21,24 seconds correct shot identity, exact terminal behavior and finite transforms; random seek order yields same state; repeated t yields identical pose; no physical part teleports across shot transitions.
- [ ] **Step 2: Run timeline tests to confirm failure.** npm run test -- src/projects/solecraft/__tests__/timeline.test.ts.
- [ ] **Step 3: Implement six-shot blocking and art-directed camera/mesh animation from approved storyboard.** Separate scene truth from playback UI; keep sketch geometry registered to 3D shoe contour; animate real rigged parts where asset hierarchy allows. Do not imply a complete explode/reassemble animation if the model has no individually separable parts—mark gate BLOCKED until asset rig supports it.
- [ ] **Step 4: Verify browser timing and film export capability.** Produce six reproducible contact-sheet frames and inspect overlaps, contact and framing. Run scripts/export-solecraft.mjs only where an actual rendering path is available, then check codec/resolution/duration via ffprobe and six sampled frames. If no Blender or verified high-quality fallback, mark cinema export BLOCKED; do not pass a placeholder MP4.
- [ ] **Step 5: Commit.** Message: feat: direct Solecraft film beats and deterministic exports, attaching exact evidence/blocked statuses.

## Task 7: Production-safe integration and release readiness

**Files:** Modify site/index.html, site/Project7/index.html, render.yaml only after reviewing preview; create scripts/tests/production-route.test.mjs and docs/evidence/solecraft/release-gates.md. Other projects remain unchanged.

**Interfaces:** Preserves all /Project1/–/Project9/ and /projects/0N-name/ URLs and supplies a fallback to legacy Project7 while the new scene is unaccepted. Gallery shows a light poster/clip, not all nine simultaneous 3D contexts.

- [ ] **Step 1: Write failing production-routing and regression tests.** For all nine direct URLs plus legacy aliases, check correct project mapping; page refresh remains on route; fallback remains available; category filters work and homepage does not instantiate a 3D canvas per card.
- [ ] **Step 2: Run tests before migration.** node --test scripts/tests/production-route.test.mjs; npx playwright test tests/solecraft.browser.spec.ts --grep "gallery|routing".
- [ ] **Step 3: Integrate the accepted Project 07 build behind the existing route without disrupting others.** Generate static output compatible with Render's publishPath site; keep an explicit rollback path; update documentation and model credits. Do not move production assets until passing tests and still approval.
- [ ] **Step 4: Run full checks and capture staging proof.** npm run typecheck; npm run test; npm run build; npx playwright test; verify the actual new route and old routes locally; run a GPT-runtime graphical check of the preview or record BLOCKED. Confirm exact commit SHA and Render deployment only after approved release.
- [ ] **Step 5: Commit reviewable integration work.** Message: feat: prepare Solecraft V2 for gated Motion Lab integration. Do not push to production main merely because tests compiled.

## Handoff decision: scope, quality and execution

This plan covers **one vertical slice only**: Solecraft realistic product asset, still-image acceptance, web configuration, directed motion and export. It intentionally does not claim all nine projects are finished or attempt the entire platform rewrite before the first product meets its visual standard.

At Task 1, if external binary assets are unavailable and no user-provided licensed model exists, report BLOCKED_ASSET_SOURCE and request a GLB/BLEND/FBX/OBJ asset (with textures/rights). If the runtime lacks Blender, do not claim film-grade offline rendering; continue supported web milestones and document the missing cinema path.

**Preferred execution:** Native GPT-runtime implementation in a dedicated feature branch, performing test–implement–verify–commit for each task, with objective owner visual review at the still stage and a final code/quality review before production promotion. The user must approve this written implementation plan and execution method before any implementation starts.
