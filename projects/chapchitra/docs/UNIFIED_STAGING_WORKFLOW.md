# CHAPCHITRA — unified staging and contributor workflow

## NO AUTOMATIC DEPLOYED PREVIEWS — Owner directive 2026-11-13

**Mandatory:** No hosted previews or deployments per change, PR or test. Static changes -> local/CI screenshot; GSAP/SVG -> recorded local animation and optional self-contained HTML; Lottie -> local player + .lottie/JSON and recording; multi-page tests -> local/CI browser evidence. Do **not** deploy to Vercel/Render/Netlify unless the owner explicitly asks for a deployed website preview. Approval, "continue", "fix" and "review" are not deployment requests. When authorized, serial integration owner batches a single deploy to the **existing** verified shared staging service/URL. Do not create new preview services or independent sites. Check hosting auto-deploy triggers before pushing to a deploy-linked branch. Read `projects/chapchitra/docs/NO_AUTOMATIC_PREVIEWS_POLICY.md`. Routine report: `Deployment: NONE — per no-automatic-preview policy`.


**Owner directive:** 2026-11-12  
**Applies to:** all existing/new CHAPCHITRA developers, automation agents, reviewers and external contractors in `SaamVR/WebAnimation`.  
**Related rules:** repository `AGENTS.md`, `projects/chapchitra/AGENTS.md`.

## Strict exclusive development responsibilities (2026-11-12 owner clarification)

**Coordination does not equal shared implementation responsibility.** Before taking any task, identify one exclusive feature lane.

| Lane | Writes/implements | May inspect but MUST NOT implement |
| --- | --- | --- |
| **Artist's Edit / Main Website** | Garments/worktable, artwork editing, print guides, A3/A4 pricing, invoice, general UI | C02 ink texture, roller, adaptive GSAP timing, animation internals |
| **Animation Integration** | C02 transition and all approved C-series SVG/GSAP/Lottie integration, motion-specific performance and bug fixes | Artist's Edit garment editor, manual pricing or general UI internals |
| **Making Lottie** | Individually reviewed C05 prototype/source Lottie assets | Site integration prior to owner approval |
| **Serial Integration Owner (Artist's Edit coordinator)** | PR readiness/merge coordination, combined branch build/QA, *existing* staging service redeployment | Re-implementing or independently re-planning features owned by other lanes |

**Integration trigger:** Animation Integration signals `READY FOR INTEGRATION` with PR URL, immutable commit SHA, changed paths, exact tests, and current owner-approval status. Only then does the serial coordinator inspect the PR for integration purposes. Unready animation work does **not** block regular Artist's Edit development.

**Permitted integration checks:** PR ancestry/diff, ownership and merge conflicts, shared exports/contracts, whether page routes navigate together, C02 cross-page smoke tests, responsive/accessibility regressions, readiness of staging deploy. **Not permitted:** rewriting C02 motion, producing rival timing/texture solutions, developing a separate C02 branch, or assigning Artist's Edit time to ongoing C02 creative work.

**Failed integration:** If the failure concerns animation behavior or animation-owned code, send exact reproduction to the Animation lane and await its PR fix. If it concerns Artist's Edit behavior/code, Artist's Edit fixes it. For shared interfaces, agree on a single file owner before any edit. No competing implementation and no silent ownership transfer.

**One stable URL** remains the destination for successfully integrated features; isolated technical previews are optional diagnostics, not replacements.

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
