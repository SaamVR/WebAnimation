# CHAPCHITRA cumulative development and deployment register

Last updated 2026-11-28. Current authorization: development, GitHub saves, Windows localhost only. NO online preview or deployment.

| Status | Work | Immutable checkpoint / source |
|---|---|---|
| Previously deployed to protected Vercel review | PR166/169/168/170; Artist's Edit, Journal V1/magazine, About, bag/checkout/confirmation validation | 4e0996db89f9e7a2215b28a81395d2cc51658da8 (last verified review alias) |
| Development pending local QA and owner approval | C03 hidden-navbar coordination, confirmation entrance, permanent deployment gate | Current isolated local-review commit; exact SHA in Git and QA report |
| Owner-approved awaiting deployment | None newly authorized for deployment | Explicit scoped approval required |
| Render | No deployment authorized; keep linked branch unchanged while auto-deploy is enabled | deploy/chapchitra-render-review; verify service and deployed SHA before future authorized deploy |

Stable Vercel URL: https://chapchitra-motion-demo-git-feature-chapchitra-wor-bf5ac1-samvrc.vercel.app/
Routine review: http://localhost:4173/ (Windows). Use actual screenshots and MP4 evidence, never new online preview builds.
Render reported autoDeploy=yes, previews=off; no service-update action exposed. Vercel ignored-build command requested as exit 0; read-back response omits setting. App vercel.json disables Git deployments. Do not claim hosting-wide enforcement from documentation alone.
Historical source chain: PR166 → PR169 → PR168 → PR170 → Journal V1/magazine → About → PR171 simulated purchase and checkout fix.
Future handoffs: read both AGENTS.md and UNIFIED_STAGING_WORKFLOW.md, this register, then verify local/Git/host state. Only "Approve and deploy" allows approved consolidated publication.
