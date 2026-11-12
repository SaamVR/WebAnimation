---
applyTo: "projects/chapchitra/**"
---

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
