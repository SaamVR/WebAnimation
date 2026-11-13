# WebAnimation — Repository Boundary Rules

## CHAPCHITRA — deployment previews only on explicit owner request (2026-11-13)

**Mandatory for all Interactive Animation / CHAPCHITRA development chats and coding agents:** do not create or trigger Vercel, Render or other hosted previews for every tweak, PR, branch, fix, Lottie export, test or iteration. The owner explicitly requests a deployed/hosted website preview before a deployment may occur; merely saying "continue", "fix", "review", or approving an asset is **not** deployment authorization.

**Default evidence:** static edits → local/CI screenshots; SVG/GSAP/CSS/JS animation → MP4/WebM/GIF recording, frame comparison and optional self-contained **local** HTML; Lottie → JSON/.lottie/source, offline/local player and recording; integration tests → local/authorized GitHub Actions runner + artifacts. No new deployment URL is required or permitted for routine work.

The **serial integration owner** coordinates a single batched update to the **existing verified shared CHAPCHITRA staging service and stable URL** **only upon the owner's explicit deployed-preview request** and after readiness/QA. Production release requires separate explicit approval. Do not create new permanent sites, automatically enable per-PR previews, or push to auto-deploy branches for routine QA. Verify the host-level Git hooks; written rules do **not** suppress automatic Vercel/Render builds by themselves.

Read the full canonical policy at `projects/chapchitra/docs/NO_AUTOMATIC_PREVIEWS_POLICY.md` on the CHAPCHITRA governance/working branch. This newer rule overrides all older "preview per iteration" conventions. Report `Deployment: NONE — per no-automatic-preview policy` when no authorized hosting action was taken.


This is a shared Git repository containing **independent** demos, not one coupled website.

## Hard boundaries
- THREADS is finalized and owner-approved. Preserve the approved release branch `release/threads-demo-complete-20261026`, its assets, scripts, source, preview, and the separate `SaamVR/Threads-Final-Demo-Web` deployment/repository untouched.
- CHAPCHITRA work lives exclusively in `projects/chapchitra/` and a dedicated Vercel project with its root directory set to `projects/chapchitra`. No imported code, styles, assets, globals, or runtime dependency from THREADS.
- Do not modify `SaamVR/EcomCMS`, the historic Creative Motion Lab site, or any unrelated project.
- CHAPCHITRA remains a portfolio demo, **not** an EZCOMO CMS template and **not** a live commerce system.
- Only scoped changes under `projects/chapchitra/` are routine. Changes to repository-level files, workflows, deployment configuration, or `site/` require explicit owner approval and THREADS regression evidence.
- In feature branches and PRs, inspect the changed-file list: files under `site/`, `threads/`, or another project are a blocker.
- Structural milestones are not brand/motion approval. Never replace approved assets or implement CHAPCHITRA C01–C04 before explicit choreography/artwork authorization.
- No fabricated product photography, model imagery, customer data, prices, checkout, payments, subscription storage, or commerce integrations.

## Baseline (2026-10-26)
- Source repo: `SaamVR/WebAnimation`, default branch `main`; independent THREADS release branch identified above.
- Existing Creative Motion Lab: Render static `site/` deploy via root `render.yaml`; do not edit.
- CHAPCHITRA: own app under `projects/chapchitra/`; own Vercel project `chapchitra-motion-demo`.
- Future CHAPCHITRA changes: feature branch → isolated tests → preview → owner approval → merge. Keep THREADS unchanged.


## CHAPCHITRA unified staging and parallel-development rule (owner directive, 2026-11-12)

**Mandatory for every existing or newly opened CHAPCHITRA development chat, coding agent, contractor, and GitHub contributor.** Read `projects/chapchitra/AGENTS.md` and `projects/chapchitra/docs/UNIFIED_STAGING_WORKFLOW.md` before making changes. The newer CHAPCHITRA staging rule supersedes the older "feature branch -> independent preview" convention where those conflict; all unrelated project boundaries above remain binding.

- CHAPCHITRA is **one website with one persistent, canonical staging/review URL**. Integrate Artist's Edit and approved animation changes into the same website for owner review.
- Two parallel feature-development lanes may operate independently: **Artist's Edit/main website** and **animations/GSAP/Lottie integration**. Separate branches/PRs and exclusive file ownership remain required.
- Only **one serial Integration Owner** may write/merge into the shared CHAPCHITRA staging/integration branch at a time. Until formally reassigned, the Artist's Edit/main website lane coordinates integration. Other lanes submit PRs and evidence, never race to update staging.
- The existing `deploy/chapchitra-render-review` branch is a **candidate** shared staging branch, not automatically the live source. Verify current GitHub ancestry and actual hosting configuration before switching or updating it.
- **Update the existing CHAPCHITRA staging deployment** after integrated changes; do not create a new Render/Vercel service, permanent domain, or unrelated owner-facing review site for every correction. Temporary isolated test previews are allowed when needed, but are not substitutes for the shared staging URL.
- Protect production: isolated tests -> integrator conflict review -> shared staging -> owner visual acceptance -> production merge/release only with explicit authorization. A staging update is not production approval.
- Standalone **C05 individual Lottie prototypes** stay isolated until separately approved; only then may the Animation lane submit them for shared-site integration.
- Never touch THREADS, `site/`, EcomCMS, or unrelated deployment configuration while doing CHAPCHITRA work. Changes to repository-level governance/workflows/hosting settings need explicit owner authorization and appropriate regression review.
- Before and after every integration, report source PRs, exact commits, staging branch/head, stable review URL, tests, and blockers. Never label unverified deployments or combined features as live.

**Tooling limitation:** `AGENTS.md` guides agents that read it. GitHub branch protection/required CI checks are separate repository settings; instructions alone do not mechanically prevent an unauthorized deployment or merge.


## CHAPCHITRA strict feature ownership vs integration ownership (owner directive, 2026-11-12)

**This clarifies, and takes precedence over ambiguous interpretations of, the unified-staging rule above. Integration authority does NOT grant authority to develop another lane's feature. Every new developer must choose a lane before editing.**

| Task | Exclusive feature owner | What the serial integrator may do |
| --- | --- | --- |
| Artist's Edit worktable, garments, front/back customization, pricing, invoice, controls and general website UI | **Artist's Edit / Main Website lane** | Implement its own scope normally |
| C02 ink swipe, Grit Roller artwork, overlay, adaptive timing/loading lifecycle and C02 GSAP/SVG source | **Animation Integration lane ONLY** | Inspect PR metadata/diff for merge conflicts; test one-click route behavior on the integrated site; report bugs to Animation owner |
| Other C-series motion, Lottie player code, button motion and animation-specific assets | **Animation Integration lane ONLY** | Perform compatibility and staging smoke tests; return motion defects to Animation owner |
| Unapproved individual C05 Lottie prototypes | **Making Lottie lane ONLY** | No staging integration until owner explicitly approves each asset |
| Shared CHAPCHITRA staging branch, conflict coordination and in-place staging deployment | **One serial Integration Owner (currently Artist's Edit coordinator)** | Integrate reviewed, submitted source branches/SHAs one at a time and verify combined-site health |

**Hard behavioral boundaries for Artist's Edit / serial coordinator:**
- Do **not** independently reimplement, refactor, redesign, tune, research solutions for, or produce competing implementation plans for C02 or other animation internals. Do **not** take over a motion problem because it appears in cross-page navigation.
- Do **not** continuously review an unfinished C02 feature branch or hold Artist's Edit development while waiting for it. Review Animation PRs **only after a concrete ready-for-integration handoff** with commit SHA, scope, test evidence and owner approval status.
- Integration review is limited to changed-file ownership, branch ancestry, merge conflicts, shared interfaces, production boundaries, route/navigation compatibility and combined-site regression checks. A failing C02 animation test belongs back to **Animation Integration** for correction; never silently patch animation logic in the Artist's Edit lane.
- For conflicts in animation-owned source, coordinate with the Animation owner to supply the fix; serial integration authority is not an exception to exclusive source ownership.

**Hard behavioral boundaries for Animation Integration:**
- Do not edit worktable, garment/print controls, invoice, pricing or general Artist's Edit UI unless the owner explicitly reassigns the task.
- Submit animation changes via feature branch/PR with exact SHA, changed files, tests and approval status; do not write to the shared staging branch or deploy competing permanent review services.
- Own and fix motion-specific defects discovered during integrated site QA.

**Cross-lane collaboration:** Shared code changes require explicit owner assignment and a file-ownership handoff before editing; when a task crosses boundaries, split it into separately owned PRs. The staging integrator tests the *combined* result but is not a second feature development team. Continue one's own assigned work while other lanes are unfinished.

These rules guide cooperating agents, but technical prevention requires separate GitHub permissions/protections. Do not claim repository protections have been enabled merely by writing this file.
