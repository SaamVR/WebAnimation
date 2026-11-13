# CHAPCHITRA — No Automatic Deployed Previews Policy

**Owner directive:** 2026-11-13  
**Scope:** every CHAPCHITRA chat/agent, Main Website / Artist's Edit, Animation Integration, Making Lottie/C05, CI and serial staging integration.  
**Repository:** `SaamVR/WebAnimation` — `projects/chapchitra/`

## Mandatory rule

**No automatic deployed previews, one-off hosted review sites, or website redeploys for individual changes.** "Continue", "fix", "refine", "review", "approve", "make a prototype" and routine PR/commit actions do **not** authorize a Render/Vercel/Netlify deployment. An owner-approved asset alone is not deployment authorization.

Only the owner can **explicitly request a deployed/hosted website preview** in the current task. That request must identify the intended ready-for-review change batch or authorize the integration owner to assemble it. Only the designated **serial staging integration owner** may update the **one already-verified shared CHAPCHITRA staging service and stable URL**. Batch changes; verify exact deployed SHA. Production release requires separate explicit authorization. No new permanent or per-change services.

## Non-deployed review artifacts by default

| Change | Default review material | Deployment |
|---|---|---|
| Static illustration, page/layout, button, typography | Locally or GitHub-Actions-rendered screenshot(s), before/after images, QA report | NONE |
| Interactive GSAP/SVG/CSS/JS motion or page transition | MP4/WebM/GIF capture, timeline/frame sheet, local/self-contained HTML prototype if helpful, measured browser QA | NONE |
| Lottie asset | JSON, .lottie, editable source, local/offline Lottie player, replay capture | NONE |
| Multi-page behavior and integration | Local or authorized runner Playwright Chromium/WebKit reports, screenshots, recordings, artifact upload | NONE |

Local HTML or localhost is **not** a hosted/deployed preview. Do not publish it to a third-party host without explicit owner approval. Reuse screenshots, video and GitHub Actions artifacts for iterative QA rather than allocating a new deployment to each tweak. Avoid recreating expensive QA runs when focused tests suffice.

## Deployment/hosting enforcement

1. Before any branch push or deployment-oriented workflow, check automatic hosting hooks, preview PR builds and branch deployment triggers. Written instructions alone do not disable Git/Vercel/Render webhooks.
2. The CHAPCHITRA Vercel project's **preview deployment setting is intended to be disabled by default**, and should only be temporarily enabled for an explicitly requested hosted preview if required; restore the no-auto-preview default afterward. Do not touch unrelated hosting projects.
3. Other hosting services (e.g., existing Render shared staging) may have their own auto-deploy settings; verify them separately. Never claim all auto-deploy triggers are disabled without checking.
4. Feature branches, PRs, local tests, GitHub Actions CI and downloadable evidence are allowed **only when they do not cause unwanted hosted builds**. If pushing/merging to a branch would automatically deploy, pause that merge until the owner requests the hosted preview or the trigger is safely disabled.
5. When a true interactive hosted proof is necessary to establish a fact, explain the limitation and seek an explicit deployed-preview request; do not silently deploy or shift providers.
6. Failed/limited deployments are not a reason to create another service. No duplicate permanent preview sites.

## Existing exclusive responsibilities

- **Main Website / Artist's Edit:** approved editor and general UI, plus serial staging coordinator; does not rewrite C02 internals.
- **Animation Integration:** C02 and approved C-series site integration; supplies non-deployed recordings/previews during development.
- **Making Lottie/C05:** standalone GSAP/Lottie motion prototypes; only owner-approved assets pass to integration.
- Preserve approved work, shared staging rules, and protection of unrelated THREADS, EcomCMS and legacy `site/`.

## End-of-run report

Always report feature branch, PR/commit SHA, modified paths, tests, **local screenshot/video/artifact locations**, owner-approval status, blockers and next task.

Unless the owner explicitly requested and the hosting service actually confirmed a deployment, state exactly: **Deployment: NONE — per no-automatic-preview policy**. Never invent a hosted URL or call a local screenshot a deployed website.

**Precedence:** This 2026-11-13 rule overrides all older references to automatic PR previews, routine isolated Render deployments or "feature branch -> preview" for CHAPCHITRA. It does not remove the existing shared staging website; it restricts its deployment to explicit, batched owner requests.
