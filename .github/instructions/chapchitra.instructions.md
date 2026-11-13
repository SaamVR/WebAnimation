---
applyTo: "projects/chapchitra/**"
---

## NO AUTOMATIC DEPLOYED PREVIEWS — Owner directive 2026-11-13

**Mandatory:** No hosted previews or deployments per change, PR or test. Static changes -> local/CI screenshot; GSAP/SVG -> recorded local animation and optional self-contained HTML; Lottie -> local player + .lottie/JSON and recording; multi-page tests -> local/CI browser evidence. Do **not** deploy to Vercel/Render/Netlify unless the owner explicitly asks for a deployed website preview. Approval, "continue", "fix" and "review" are not deployment requests. When authorized, serial integration owner batches a single deploy to the **existing** verified shared staging service/URL. Do not create new preview services or independent sites. Check hosting auto-deploy triggers before pushing to a deploy-linked branch. Read `projects/chapchitra/docs/NO_AUTOMATIC_PREVIEWS_POLICY.md`. Routine report: `Deployment: NONE — per no-automatic-preview policy`.


# CHAPCHITRA — mandatory contributor instructions

Before coding, read:
1. Repository `AGENTS.md`
2. `projects/chapchitra/AGENTS.md`
3. `projects/chapchitra/docs/UNIFIED_STAGING_WORKFLOW.md`

**Single-site rule:** CHAPCHITRA Artist's Edit and Animation Integration are feature lanes of **one site**, reviewed at **one persistent staging URL**. Do not open a new permanent Render/Vercel service or hand the owner a different review URL for every change.

**Parallel code / serial integration:** Make changes on isolated feature branches and submit PRs. Only the designated serial Integration Owner (currently coordinated by the Artist's Edit/main website lane) updates the verified shared staging branch and deploys to the same staging service. Check current PRs/commits/service configuration before integration; the existing `deploy/chapchitra-render-review` branch is a candidate, not proof of live hosting.

**Owner gate:** Validate source/build/browser behavior, preserve artwork, and do not merge/release to production without owner approval. Temporary technical previews are allowed but cannot substitute for integrated staging review. Standalone C05 Lottie prototypes remain independent until individually approved.

**Scope boundary:** Only work inside `projects/chapchitra/` unless the owner explicitly authorizes governance/deployment changes. Never change THREADS, EcomCMS, `site/`, or unrelated demos.

**Report each run:** actual changes, source PR/commit, integrated-versus-pending status, shared staging URL and verified SHA, tests, blockers, and next task. Do not call a proposed or unverified deployment "live".


## Exclusive lanes: integration review is not permission to implement features

- **Artist's Edit/Main Website** implements worktable, garment editing, pricing and UI, and coordinates serial integration when receiving a ready animation PR; it **must not modify, design, troubleshoot or independently plan C02/GSAP/Lottie internals**.
- **Animation Integration** implements and debugs C02 and other animation-owned files; it **must not implement Artist's Edit pricing or worktable features**.
- **Making Lottie** produces independent C05 assets one by one; handoff only after owner approval.
- The serial integrator may inspect ready animation PRs, merge conflicts, shared route contracts and combined-site regressions. Send animation defects to Animation lane; never make a parallel implementation. Do not monitor unfinished animation work instead of continuing Artist's Edit.
- New developers must declare an exclusive lane and consult `projects/chapchitra/docs/UNIFIED_STAGING_WORKFLOW.md` before making edits. Shared files require assigned ownership and handoff.
