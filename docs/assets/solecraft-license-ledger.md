# Solecraft V2 — controlled asset intake ledger
**Checkpoint:** 2026-10-13. **Review state: PUBLIC RELEASE BLOCKED.**

## Primary evidence
- Source branch: [`feat/solecraft-v2-user-fbx-intake-20261011`](https://github.com/SaamVR/WebAnimation/tree/feat/solecraft-v2-user-fbx-intake-20261011).
- Evidence: `docs/evidence/solecraft/2026-10-11-user-fbx-intake-and-motion-proof.md` on that branch.
- Planning: `docs/superpowers/plans/2026-10-11-solecraft-real-product-vertical-slice.md` on `docs/creative-motion-lab-v2-hybrid-spec-20261010`.

## Assets reviewed in the prior isolated runtime — *not present in this repository*
| Asset | Recorded integrity evidence | Public rights | Status |
| --- | --- | --- | --- |
| Owner-supplied `LAIR_SERIES_2_JORDANS.zip` | SHA-256 `7f7531d2ffe4f0171dba957ed5280bebfa1602f638437e061a15b2d76564f406`; 4,524,070 bytes | **Unverified**; recognizable Nike/Jordan styling | Private prototype only |
| Chicago export GLB | `d39e25dcf1ae7266770ef12cec85b7c933eec5683164dacb55baa459cfd068d9` | Same restriction as source | Not committed or deployed |
| White export GLB | `156fe62bd5cfa732eeefa52a0985c41678f9bd094a4fcf0c5b4fcedd0882e76a` | Same restriction as source | Not committed or deployed |
| Blue export GLB | `8e90599d80959833bc56a6ac25e97e7cee13d120676b48b2e35aa23f1526856d` | Same restriction as source | Not committed or deployed |

Recorded intake also covered seven texture/colorway choices, source FBX models, and a 12-second internal motion proof. The GLB meshes were combined; a physically valid exploded sole/lace/upper assembly was **not** proven. Browser WebGL pixels and GPU material switching remained unverified. No real buyer transactions are implied.

## Development gate in this PR
`scripts/asset-validate.mjs` checks local GLB bytes, JSON metadata, mesh declarations, checksum and explicit source/license manifest. A validated **technical file** is not a photorealistic or licensed final product. `variantVerified` is true only for variant names actually embedded in the `KHR_materials_variants` extension; colorway names supplied in a manifest are *declarations*, not a rendering proof.

`scripts/runtime-preflight.mjs` reports command/binary availability without claiming that Blender, WebGL or download permissions were exercised. The CI fixture is synthetic and has no shoe geometry/artistic fidelity. This PR deliberately contains **no owner binary, texture, trademarked image, video or model**.

## Release gates still blocked
1. Owner-approved original shoe geometry or documented written license and trademark/public-portfolio permissions.
2. Private controlled asset store with hash, license, credit and revocation procedure.
3. Genuine browser WebGL rendering, real material variant screenshots, mobile/keyboard/reduced-motion proof and failure fallback.
4. Component rigging/credible physical contact, approved hero still and complete storyboard.
5. Actual final film sampling/metadata plus owner creative approval.

**Deployment policy:** no merge to auto-deploying `main`, public GLB hosting or Render production promotion until those gates pass.
