# CHAPCHITRA — One Permanent Shared Staging Website

**Integration ownership:** This chat acts as the **single serial Integrator**. Chat A owns Main Website / Artist's Edit; Chat B owns Interactive Animations / Lottie. Neither development chat pushes to shared staging directly.

## Fixed review destination

- Permanent shared URL: https://chapchitra-webanimation.onrender.com/
- Existing Render service: srv-dbmu3ubbc2fs73auj78g, static site, branch deploy/chapchitra-render-review, autoDeploy=yes, trigger=commit, publish path projects/chapchitra/dist
- Candidate integration branch: integration/chapchitra-staging-candidate-20261112
- Production remains on main; staging updates do not constitute production owner approval

Keep old preview services, branches, PRs and commit history. Feature-specific previews may assist debugging, but the permanent shared URL is the owner-facing integration review destination.

## Serial integration protocol

1. Inspect live PRs, reviews, exact SHAs, Render source SHA and current staging HEAD. Never assume a moving branch has passed CI.
2. Each developer creates a scoped feature branch + review PR. Record an **exact tested SHA** and check changed-file boundaries; no touching THREADS, EZCOMO, other projects, approved garment assets, or other owners' feature branches.
3. Only this integration owner updates the candidate branch. Merge or cherry-pick scoped source changes from a SHA with successful exact-head QA; reconcile src/app.mjs and scripts/build.mjs overlaps without deleting either subsystem.
4. Run the exact-head GitHub Actions CHAPCHITRA Shared Staging Integration Gate: full source tests/build, desktop/tablet/mobile Chromium/WebKit smoke (Home, Shop, Journal, About, Artist), front/back print pricing/cart, navbar, and animation/navigation/loader tests when C02 is included. Any failed/cancelled job blocks promotion.
5. Re-read remote staging and candidate refs just before promotion. Require fast-forward from the verified staging SHA; update with an expected_sha lease and **never force push**. If concurrent commits advance staging, stop/reconcile and rerun CI.
6. The already configured Render service automatically redeploys the same permanent URL. Verify Render's resulting deploy SHA equals the promoted commit; rerun public browser smoke.
7. Record integrated PR numbers, source SHA, deploy SHA, tests, screenshots, and pending visual approvals. Owner visual approval is mandatory for any subsequent **production** PR/merge.
8. Keep the candidate integration branch rebased or fast-forwarded onto staging as a separate serial owner lane, using a new checked candidate before each promotion.

## Source/approval guarantees

- The original wooden worktable, four garments, Regular Tee back crop, independent artwork on both sides, color render, A3/A4 guides, invoice, and printed Total tag PNG are protected from incidental changes.
- Artist's Edit has a **nonsticky** normal-flow navbar; all other site pages retain sticky navigation.
- The demo bag is session-only; no true checkout, payments, or upload persistence has been introduced.
- Preserve C01/C08 animation, Compact/Long SVG buttons and their accepted designs. C02 changes must not intercept artwork editing or break first-paint navigation, Back/Forward, or reduced-motion.
- Physical iPad hardware acceptance is separate from WebKit emulation.

## First reconciliation (2026-11-12)

- Reusable shared service branch baseline before integration: 29f484bb866146e8c2a52cfc12d9035413b38a68. Render service already auto-deploys this branch and must be reused.
- Artist's Edit complete pricing, invoice, replacement printed tag candidate: a1c1e1ab40f9b85838864cac8889f3d80131add8; PR #84 → #85 → #86 → #87. Descends cleanly from shared staging baseline. Exact public preview/browser/source QA passed.
- C02 animation PR #81 is concurrently advancing, and its latest exact-head Chromium and WebKit navigation runs failed. **Do not use the last passing older commit as if it were the latest**. Integrate C02 only after a stable exact-head green CI and combined branch regression.
- C05 Icon 01 is an isolated prototype on an unrelated ancestry; do not silently merge into the website.
- Outstanding owner-requested Hind Siliguri amount-font change is **not in a1c1e1a** (its amount is still Georgia-first). Deliver it as a separate scoped Artist feature PR before staging when QA-passing; do not silently alter owner PNG or claim it has already been implemented.

## Release gate

Staging is allowed for combined visual review without merging to main. This workflow is an integration/pre-release gate, not a production deploy authorizer. No unapproved change is promoted to main.
