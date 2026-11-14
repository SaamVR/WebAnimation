# CHAPCHITRA C05 — final “More Than a T-Shirt” homepage integration

**Feature-only; NO DEPLOYMENT.** This branch was prepared for the Main Website / Artist's Edit serial integration owner. Do not push/merge the protected staging branch from this animation lane. See `projects/chapchitra/AGENTS.md`, `docs/UNIFIED_STAGING_WORKFLOW.md` and the owner-supplied authoritative project source.

## Owner-locked copy and artwork

Homepage `#values` heading: **More Than a T-Shirt**. Cards remain in the order **Stories You Can Wear / Rooted in Bengal / Anything but Ordinary / Onto What You Wear**, with exactly the four owner-supplied descriptions. Three native Lottie JSONs (Icon 01 V7, Icon 02 V1, Icon 04 V3 SOFT BOUNCE) play via the existing C01 self-hosted lottie-web renderer. Icon 03 uses its original SVG + refined opening + unchanged SHA-locked closing with existing C03 GSAP. Approved Press Green circular compositions, Icon 04 visible entrance/single bounce and all native timing are unmodified.

## Git object transfer fidelity

The GitHub plugin rejected an approximately 5.9 MB direct JSON blob. **Only Icon 01 V7** is therefore committed as 11 lossless ASCII base64/gzip shards under `src/assets/c05/encoded/`; the other **10 original files are literal, byte-identical Git blobs** under `src/assets/c05/` or `src/motion/c05/`. This is not re-export or simplified animation data. The original 5,867,171-byte `icon01-final.json` is reconstructed by `scripts/materialize-c05-assets.mjs` after `src` is copied to `dist`, so the served file is normal original native Lottie JSON. The materializer validates ALL 11 original SHA-256, original byte lengths and Git blob SHA-1 identities against `src/assets/c05/encoded/manifest.json` and fails the build if any asset differs.

The original Icon 03 closing script must hash SHA256 `9ad4c7fd272cb498cd0de72bbdcf84b7434739362bca1b8a0d3426451b32ef45`. Icon 01 V7 JSON must hash SHA256 `221856b3a58bfd493622b40d2149d0c43fb76a85f73e3704f30695f9aee57838` after reconstruction. Both originals were byte-checked locally against the owner's supplied ZIP files.

## Integration scope

- Replace only homepage `#values` markup, titles and descriptions in `src/app.mjs`.
- Add only the homepage stylesheet link in `src/index.html` and homepage-only lazy loader of `src/motion/c05/values.mjs`.
- Reuse existing `/motion/c01/vendor/lottie.min.js` and `/motion/c03/vendor/gsap.min.js`; **no new runtime package or CDN**.
- One C05-specific build materializer call after `src` copy in `scripts/build.mjs`; no other build steps removed.
- Original source remains in `src/`; materialized original Icon 01 JSON is written to `dist/` only.
- Respect `prefers-reduced-motion`, browser visibility, IntersectionObserver, one-shot playback, and source frame count.

## QA and recordings

Prior to GitHub feature integration, supplied owner-final assets passed standalone Chromium desktop 1440×900, iPad-sized Chromium 834×1112, and Chromium mobile 390×844 runs with no page JS errors; local standalone recordings are in the owner's C05 ZIP, **not full-site evidence**.

After applying to a local copy of the current website, run:

```sh
cd projects/chapchitra
npm ci --include=dev --no-audit --no-fund
npm run check
npm run build
node scripts/preview.mjs
# Other terminal:
C05_LOCAL_URL=http://127.0.0.1:4272 node scripts/c05-capture-values.mjs
```

This `c05-capture-values.mjs` refuses hosted URLs. Record desktop, iPad-sized WebKit, mobile and reduced-motion journeys and check all four playback states. Confirm full-site C01/C02/C03/C08 and Artist's Edit have no regressions before the serial integration owner merges. Physical iPad Safari remains a distinct manual visual review.

## Handoff status

This PR is a **source-only** proposed homepage integration for review. The Main Website coordinator alone may verify conflicts against the current staging head and merge in serial. No staging push, live preview, hosted deployment or service change is authorized by this handoff.

**Deployment: NONE — per no-automatic-preview policy.**