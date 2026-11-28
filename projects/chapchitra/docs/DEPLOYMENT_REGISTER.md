# CHAPCHITRA cumulative development and deployment register

Last updated 2026-11-28. The owner explicitly approved the final Add to Bag, checkout/order confirmation and last-edit corrections, and authorized their consolidated merge and Vercel review deployment. That authorization has been fulfilled; future online deployments again require explicit owner authorization. Routine development, GitHub saves and Windows localhost QA only.

| Status | Work | Immutable checkpoint / source |
|---|---|---|
| Previously deployed | PR166/169/168/170; Artist's Edit, Journal V1/magazine, About, bag/checkout/confirmation validation | 4e0996db89f9e7a2215b28a81395d2cc51658da8 |
| Owner-approved, merged and deployed to existing protected Vercel review | PR172 and PR171: hidden/visible-navbar product flight coordination, approved purchase journey, final confirmation checkmark/entrance, permanent deployment gate | 8dd2c17688e3df1aae32aeaa71ad09c8e8e3d383 |
| Owner-approved awaiting deployment | None | No outstanding authorized deployment |
| Development awaiting owner approval | None in this accepted release | New changes require separate review |
| Render | No deployment authorized; keep linked branch unchanged while auto-deploy is enabled | deploy/chapchitra-render-review |

Stable Vercel URL: https://chapchitra-motion-demo-git-feature-chapchitra-wor-bf5ac1-samvrc.vercel.app/
Vercel deployment: dpl_FosWvTPQSjnvyDpKsXJgyeKLWjgC; READY, preview only, exact release manifest SHA verified through stable alias; noindex verified on candidate routes.
QA: approved Windows checkpoint 862322e73a9673d3fce8e0bb4c4c273a892eb631, identical source tree to merged deployment; 341/341 native, 13/13 browser and 14/14 HTTP smoke tests; 3 MP4 recordings. Merged cloud build independently passed 341/341 native tests and 11/11 protected route/module checks.
Routine review: http://localhost:4173/ (Windows). Actual screenshots and MP4 evidence remain on Windows; no new online previews without approval.
Render reported autoDeploy=yes, previews=off; no service-update action exposed. Vercel project ignored-build command exit 0 canceled the first authorized attempt; one deployment-specific exit 1 override allowed the approved build. App vercel.json retains git.deploymentEnabled=false. Do not claim hosting-wide enforcement from documentation alone.
Historical source chain: PR166 → PR169 → PR168 → PR170 → Journal V1/magazine → About → PR171 simulated purchase and checkout fix → PR172 final interaction corrections → PR171 unified merge.
Future handoffs: read both AGENTS.md and UNIFIED_STAGING_WORKFLOW.md, this register, then verify local/Git/host state. Only explicit owner approval to deploy allows approved consolidated publication. The register-only commit after deployment does not represent a new deployed runtime.
