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
