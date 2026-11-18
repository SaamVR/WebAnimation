> V11 refinement: The circle is preserved, but F01 now covers its entire area without yellow letterboxing. See V11_F01_CIRCLE_COVER_QA.md.

# ZESTRY V10 — Circle Hero, No Organic Clipping

Date: 2026-11-18.
Scope: projects/restaurant-demo only.
Review: Existing draft PR #125, branch feat/zestry-v8-editorial-fixes-20261118.
Deployment: NONE. Wait for explicit owner instruction.

## Owner instruction
Remove hero clipping, go back to circle shape, not oval, but circle.

## Exact implementation
- Removed the SVG clipPath definition and hidden SVG from the hero markup.
- Removed URL-based SVG mask styles; cleared clip-path and -webkit-clip-path.
- Set the visual frame to aspect-ratio 1:1, border-radius 50%, overflow hidden.
- Circle diameter is 485px on desktop, 330px on standard mobile, and 288px at 320px width.
- Existing F01 artwork, F04 playback and all other approved animation JSONs unchanged.
- Preserve red/yellow identity, hero copy, and buttons.

## Real Chromium QA
Viewport: 1818x828 -> 485x485 circle
Viewport: 1440x900 -> 485x485 circle
Viewport: 1024x768 -> 485x485 circle
Viewport: 390x844 -> 330x330 circle
Viewport: 320x690 -> 288x288 circle

At all sizes: radius 50%; clip-path none; no SVG clip definition; zero horizontal overflow, JS errors, or failed HTTP assets. F05 book stays within the viewport below the sticky navbar. Original F01 completes at 260 of 261 frames with its final-frame hold.
Simulated bag -> pickup checkout -> original F04 confirmation passed: SVG, 240 frames, loop false, Sample order received. No extra F04 player on page.

## Approved immutable source SHA-256
F01: 7fc0054b5ae4c1c7a13d0a3c5e321d117d570d8f0d71e3308ee076a48d301e37
F03: 136436c9af903ede3485bd0d688b9d2a57a6e9a1b52fb850a4aedb4d79710e68
F04: e9ca8b2e02a720d96cb4fe4f1f8035a3d2417fe57f7ddf695e32d4a92a4bfbd0
F05: 3a4160b4df4e5775551faf43fcad3f851679fb58e53040c2111981bcc8de9645
F07: a07dac1c24e3b867e9ca81cb30df99eafe5a4b8809a4a03dbfc8f603b636b84b

Screenshots:
- docs/qa/owner-v10/desktop-hero-circle-final.png
- docs/qa/owner-v10/mobile-hero-circle-final.png

The V9 organic hero mask is superseded. V9's F04 checkout-only restoration remains valid. No deployment.