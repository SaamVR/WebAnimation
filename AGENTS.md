# WebAnimation — Repository Boundary Rules

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
