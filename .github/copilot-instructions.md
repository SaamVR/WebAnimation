# Repository contributor instructions

## CHAPCHITRA — deployment previews only on explicit owner request (2026-11-13)

**Mandatory for all Interactive Animation / CHAPCHITRA development chats and coding agents:** do not create or trigger Vercel, Render or other hosted previews for every tweak, PR, branch, fix, Lottie export, test or iteration. The owner explicitly requests a deployed/hosted website preview before a deployment may occur; merely saying "continue", "fix", "review", or approving an asset is **not** deployment authorization.

**Default evidence:** static edits → local/CI screenshots; SVG/GSAP/CSS/JS animation → MP4/WebM/GIF recording, frame comparison and optional self-contained **local** HTML; Lottie → JSON/.lottie/source, offline/local player and recording; integration tests → local/authorized GitHub Actions runner + artifacts. No new deployment URL is required or permitted for routine work.

The **serial integration owner** coordinates a single batched update to the **existing verified shared CHAPCHITRA staging service and stable URL** **only upon the owner's explicit deployed-preview request** and after readiness/QA. Production release requires separate explicit approval. Do not create new permanent sites, automatically enable per-PR previews, or push to auto-deploy branches for routine QA. Verify the host-level Git hooks; written rules do **not** suppress automatic Vercel/Render builds by themselves.

Read the full canonical policy at `projects/chapchitra/docs/NO_AUTOMATIC_PREVIEWS_POLICY.md` on the CHAPCHITRA governance/working branch. This newer rule overrides all older "preview per iteration" conventions. Report `Deployment: NONE — per no-automatic-preview policy` when no authorized hosting action was taken.


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
