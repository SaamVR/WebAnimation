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


## CHAPCHITRA exclusive feature lanes — latest owner rule

**Do not conflate staging integration with feature ownership.**
- Artist's Edit/Main Website builds garment/worktable, pricing, invoice and general UI; it is also the **serial integration coordinator** but **not** a C02 or Lottie developer.
- Animation Integration alone builds, changes and troubleshoots C02's roller/ink/timing/navigation motion and other approved GSAP/SVG/Lottie integration. Artist's Edit may only inspect a **ready-for-integration PR** for conflicts, shared routes and integrated regression, then coordinate the one staging update.
- Making Lottie alone produces standalone C05 icon prototypes; only owner-approved final assets are passed to Animation Integration.
- An animation failure discovered by staging QA goes back to Animation Integration, not to an Artist's Edit code rewrite. Do not have two chats produce competing fixes. Continue assigned development while other lanes are unfinished.
- Read the complete exclusive ownership matrix in root `AGENTS.md` and the CHAPCHITRA staging runbook on the active project branch.
