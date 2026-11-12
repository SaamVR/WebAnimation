# CHAPCHITRA — unified staging and contributor workflow

**Owner directive:** 2026-11-12  
**Applies to:** all existing/new CHAPCHITRA developers, automation agents, reviewers and external contractors in `SaamVR/WebAnimation`.  
**Related rules:** repository `AGENTS.md`, `projects/chapchitra/AGENTS.md`.

## One website, one persistent review address

The **Artist's Edit** and **Animation Integration** lanes build **one CHAPCHITRA website**. The owner reviews their *combined integrated work* at **one stable staging URL**, redeployed in place. The canonical URL must be confirmed from the hosting service and recorded here by the serial integrator; do not invent one.

| Item | Current direction |
| --- | --- |
| Repository | `SaamVR/WebAnimation` |
| App boundary | `projects/chapchitra/` |
| Existing candidate staging branch | `deploy/chapchitra-render-review` (**verify before adoption**) |
| Canonical staging URL | **To be verified and recorded by integration owner** |
| Artist's Edit/main website | Feature lane + designated serial integration coordinator |
| GSAP/SVG/Lottie implementation | Separate animation feature lane |
| Standalone C05 Lottie creation | Independent asset prototyping; approved output handed to animation integration lane |
| Production deployment | Separate owner approval; staging is not production |

**Do not create one permanent deployment/service/site per PR.** Short-lived PR previews or isolated animation QA pages may still be used to debug a change, but they are **supplemental**. Report the shared canonical URL for integrated review.

## Required execution sequence

1. **Reconcile live state:** Read both AGENTS files; check current repository branches, open PRs, working trees, deployments, source SHAs, and any current owner approvals. Confirm the current canonical staging branch/URL rather than trusting old handoffs.
2. **Assign ownership:** Each feature lane edits only its assigned files on an isolated feature branch; immediately flag conflicts in shared files. No two agents write to the staging branch simultaneously.
3. **Implement, test, submit:** Produce actual source changes, automated checks, visual evidence, and a PR to the integration owner. A long plan or fresh demo site alone does not complete an implementation task.
4. **Integrate serially:** The integration owner reviews exact changes/SHAs and approved assets, rebases/merges applicable PRs onto the *verified* staging branch, fixes conflicts, and runs smoke/browser/regression tests across the combined site.
5. **Redeploy in place:** Use the **existing confirmed staging service** and stable URL to deploy the new integrated commit. Do not create another Render/Vercel service to publish routine fixes. Verify commit identity and routes on the live staging address.
6. **Owner review and release:** Send the **same stable link** with changes and evidence; retain rejected or unfinished work in feature branches. Do **not** merge/release to production without explicit owner approval.

If staging hosting is unverified or lacks access: **do not guess, silently switch provider, create a replacement service, or change production.** Report the factual blocker and the safe next action.

## Ownership and scope

- **Artist's Edit lane:** worktable, garment controls, artwork editing, front/back, print guides, pricing and invoice, page UI, cross-feature integration coordinator.
- **Animation integration lane:** C-series GSAP/SVG/Lottie implementation, adaptive C02 ink transition, performance, animation route/navigation QA.
- **C05 Making Lottie:** creates one icon at a time in isolated prototype branch, takes owner visual approval, passes final files to animation integration; does **not** deploy unfinished icons on staging.
- **Serial Integration Owner:** *only* lane authorized to merge/update shared staging. Ownership may change only by explicit handoff, never by concurrent assumption.

All lanes must preserve approved artwork and CHAPCHITRA visual decisions. Do not alter the other projects in the repository (especially THREADS and legacy `site/`).

## Minimum staging acceptance

- Site builds and expected routes function.
- Artist's Edit pricing, artwork editing and front/back state still work.
- Approved C02 navigation starts with one click, uses the accepted adaptive timing, and reveals automatically.
- Regressions to accepted SVG buttons, navigation, assets and responsive layouts are investigated.
- Test Chromium and WebKit/iPad where relevant; confirm reduced-motion and touch/keyboard behavior for motion changes.
- Verify deployed revision SHA, not just successful build logs.

## Reporting format for every run

Provide:

- **Task accomplished:** actual files changed and behavior fixed
- **Feature PR(s) and exact commit SHA(s)**
- **Integration:** integrated / awaiting integration / blocked, with shared staging SHA
- **Canonical staging URL:** same URL every integrated update; if unverified, say so
- **Tests:** commands, results, browser/device evidence and known failures
- **Next task:** one concrete follow-up

## Conflict and rule precedence

Current owner decisions supersede obsolete dated implementation restrictions or animation ID mappings in legacy handoffs, without removing historic context. When uncertain, consult current approved art/motion register and user decisions; do not invent approval.

**Important enforcement distinction:** agent instructions and this runbook are discoverable guidance. Hard enforcement requires GitHub branch protection/required checks and hosting access controls. Do not claim those controls have been enabled unless independently verified.
