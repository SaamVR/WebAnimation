# ZESTRY — Existing Render Service Deployment Compatibility

**Scope:** `projects/restaurant-demo/` only.  
**Deployment authorization:** Owner explicitly requested deployment to the previous ZESTRY demo site after reviewing F05 and F07.  
**Target service:** `zestry-v3-restaurant-review-20261117` on Render (`srv-dbtkitifngtc73cua2p0`).  
**Published URL:** https://zestry-v3-restaurant-review-20261117.onrender.com/

## Why this compatibility stage is necessary

The existing Render service's fixed build command contains this legacy integrity assertion:

```js
assert(fs.statSync(path.join(out,'assets/f05_interactive.html')).size>1000000,'F05 missing');
```

The revised F05 customer-facing menu is ~15 KB of HTML, loading the original ~4.24 MB dotLottie archive separately. Replacing the old QA page at the legacy path would make the old build fail even though the new book is valid.

Until Render's build configuration can be modernized, the packaged review archive therefore contains:

- `assets/f05_interactive.html`: original unused F05 developer QA harness for the legacy build-size assertion, never referenced by the customer's main page.
- `assets/f05_book.html`: the real customer-facing **book** HTML (~15 KB), linked from `index.html`.
- `assets/f05_book.lottie`: exact original F05 source dotLottie, SHA-256 `3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645`.

**Do not revert the iframe to `f05_interactive.html`.** The old QA file must remain unused; it contains debug test controls. This is a temporary build-contract bridge, not a change to the approved F05 state machine.

## Artwork and functionality

- The approved F07 V5 reservation JSON is packaged as `assets/lottie/f07.json`: SHA-256 `a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b`.
- All prior F01 and F03 runtime playback corrections remain.
- F05 book is embedded in the existing `#menu` section with four original categories and six featured dishes with local photographs. The original nine-item demo menu data still includes three Breakfast/Brunch items that are not yet exposed on the four-category book page; do not silently reclassify.
- F04 remains in simulated checkout, F06 remains one continuous cooking sequence and F08 remains excluded.

## Verification before release

1. Assemble all `review_bundle/part-*.bin` in ascending order.
2. Validate ZIP integrity.
3. Execute the **existing Render build command verbatim**, without changing the Render service settings.
4. Require both the legacy F05 integrity assertion and verification that the customer-facing index references `assets/f05_book.html`.
5. Run real Chromium tests on the extracted static output: book four-category navigation, photographs and bag, order confirmation, F07 reservation animation and booking confirmation, desktop/tablet/mobile responsiveness, no horizontal overflow.
6. Promote only this verified review commit to `deploy/zestry-v3-render-review-20261116` and manually trigger Render deployment; `autoDeploy` is disabled.
7. After deployment, run browser smoke tests against **the same public URL**.

No new Render or Vercel service is needed.
