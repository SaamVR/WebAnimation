# ZESTRY F02 — Both original chef displays removed, replacement pending

**Scope:** Existing ZESTRY restaurant demonstration only, `projects/restaurant-demo/` in `SaamVR/WebAnimation`.

## Owner instruction

Remove **both** existing chef animations (`f02-orbit` and `f02-cooking`) from the website and wait for a newly supplied Lottie file. **Do not deploy a separate preview.** All other animations remain untouched.

## Source implementation

The deployed-package source archive `projects/restaurant-demo/review_bundle/` has been updated, changing its **`index.html` entry only**:

- Removed the small cooking chef element `data-animation="f02-cooking"`.
- Removed the larger orbiting-vegetable chef element `data-animation="f02-orbit"`.
- Removed both IDs from the site's deferred Lottie initialization list.
- Preserved the kitchen section ID, heading, text, layout container, navigation anchors and all other sections.
- Left **one neutral, static replacement slot** in the kitchen layout for the upcoming owner-supplied chef Lottie.

The existing source JSON files (`assets/lottie/f02-orbit.json` and `assets/lottie/f02-cooking.json` inside the archive, as well as historical standalone `assets/lottie/f02.json`) are **preserved**, not loaded by the page. This instruction requested removal from the website, **not deletion of archival source history**. No bodymovin paths or keyframes were edited.

The original owner-approved F01 V4 source is unchanged: SHA-256 `7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37`. F03, F04, F05, F06 and F07 are unchanged.

## QA — no hosting changes

Local native Chromium tests at desktop 1600×900 and mobile 390×844 passed **16/16** checks:

- No F02 animation nodes or registered players.
- No F02 asset network requests.
- One replacement slot, kitchen copy intact and no horizontal overflow.
- F01, F03, F06, F07 and the interactive F05 menu still function.
- No browser JavaScript errors or failed local assets.

Evidence: `docs/qa/f02-removal-before-new-upload/F02_REMOVAL_ACCEPTANCE.json` and desktop/mobile slot screenshots.

**No new Render deployment or preview website is authorized or triggered.** The existing Render service `srv-dbtkitifngtc73cua2p0` has `autoDeploy=no`. Updating the GitHub staging branch does not update the currently published website. The removal will become visible when the site is next deployed after the owner supplies and approves the replacement.

## Next step

Wait for the owner to attach the new F02 Lottie package. Inspect it, preserve the source animation, and replace the one reserved kitchen slot. Do not reintroduce the two-chef layout, add automatic orbit/reverse motion, alter F01, or deploy without explicit instruction.
