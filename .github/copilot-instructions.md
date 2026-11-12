# Repository contributor instructions

This repository contains independent demos. Never change unrelated projects (especially THREADS, the root `site/` Creative Motion Lab or EcomCMS) when working on CHAPCHITRA.

## CHAPCHITRA — required first step

The active CHAPCHITRA application and its full instructions may not exist on the default `main` branch. Before starting CHAPCHITRA work:
1. Read the root `AGENTS.md` (especially **CHAPCHITRA unified staging and parallel-development rule**).
2. Locate the currently authorized CHAPCHITRA integration/development branch; check `deploy/chapchitra-render-review` as an existing candidate, and verify live GitHub/deployment state.
3. On the CHAPCHITRA working branch, read `projects/chapchitra/AGENTS.md` and `projects/chapchitra/docs/UNIFIED_STAGING_WORKFLOW.md`.

CHAPCHITRA Artist's Edit and Animation Integration belong to **one website** with **one permanent owner-facing staging URL**, updated in place. Work in isolated feature branches; a **single serial Integration Owner** coordinates combined staging updates. Do **not** create a new long-lived Render/Vercel site for each correction. Isolated temporary QA previews are allowed. Standalone C05 Lottie prototypes stay isolated until approved.

Do not merge/release to production without owner approval. Report actual commits/PRs, confirmed staging URL and deployed SHA, QA results and blockers. Never claim an unverified deployment is live.

These are workflow instructions, not GitHub branch protection: required checks and hosting restrictions must be configured independently if hard enforcement is desired.
